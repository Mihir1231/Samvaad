from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import hashlib
import os
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime
import shutil
from pathlib import Path
import io
import time
from enum import Enum
import tempfile
import httpx
from dotenv import load_dotenv

from extraction import extract as extract_document
from chunking import chunk_text
from nim_client import NIMClient
from qdrant_store import QdrantStore
from languages import detect_script, simple_lang_code
from analytics_store import AnalyticsStore
from admin_store import AdminStore, FacultyStore
from auth_tokens import create_token, verify_token
from file_store import FileStore

# Load environment variables from backend/.env regardless of the process's working directory
load_dotenv(Path(__file__).resolve().parent / ".env")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Samvaad - LDRP-ITR RAG Chatbot",
    description="FastAPI backend: NVIDIA NIM (embed/rerank/LLM) + Qdrant Cloud retrieval + Groq email drafting",
    version="4.0.0",
    docs_url="/docs", redoc_url="/redoc"
)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081"
allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",") if origin.strip()]

app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class Config:
    MAX_FILE_SIZE = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xlsx', '.csv'}
    MAX_WORKERS = 4

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
    EMAIL_GENERATION_TIMEOUT = 4.5
    GROQ_MAX_TOKENS = 400
    GROQ_TEMPERATURE = 0.3

    NVIDIA_NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY")
    QDRANT_URL = os.getenv("QDRANT_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

    RETRIEVE_TOP_K = 5
    RERANK_TOP_N = 3

    DATABASE_URL = os.getenv("DATABASE_URL")
    AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")


config = Config()

http_client = None


def initialize_http_client():
    global http_client
    if not config.GROQ_API_KEY:
        logger.error("GROQ_API_KEY not found. Please set it in your .env file.")
        return False
    try:
        headers = {"Authorization": f"Bearer {config.GROQ_API_KEY}", "Content-Type": "application/json"}
        http_client = httpx.AsyncClient(headers=headers, timeout=httpx.Timeout(30.0), limits=httpx.Limits(max_keepalive_connections=5, max_connections=10))
        logger.info("HTTP client for Groq API initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize HTTP client: {e}")
        return False


client_initialized = initialize_http_client()

nim_client = NIMClient(config.NVIDIA_NIM_API_KEY)
if not nim_client.is_configured:
    logger.error("NVIDIA_NIM_API_KEY not found. Retrieval and chat will fail until it's set in backend/.env.")

qdrant_store: Optional[QdrantStore] = None
if config.QDRANT_URL and config.QDRANT_API_KEY:
    qdrant_store = QdrantStore(config.QDRANT_URL, config.QDRANT_API_KEY)
else:
    logger.error("QDRANT_URL/QDRANT_API_KEY not found. Set them in backend/.env.")

admin_store: Optional[AdminStore] = None
faculty_store: Optional[FacultyStore] = None
if config.DATABASE_URL:
    admin_store = AdminStore(config.DATABASE_URL)
    faculty_store = FacultyStore(config.DATABASE_URL)
else:
    logger.error("DATABASE_URL not found. Admin/faculty login will fail until it's set in backend/.env.")

if not config.AUTH_SECRET_KEY:
    logger.error("AUTH_SECRET_KEY not found. Admin/faculty login will fail until it's set in backend/.env.")

executor = ThreadPoolExecutor(max_workers=config.MAX_WORKERS)
analytics = AnalyticsStore(config.DATABASE_URL)
file_store = FileStore(config.DATABASE_URL)


# --- PYDANTIC MODELS ---
class DocumentType(str, Enum):
    EXAM_TIMETABLE = "ExamTimetable"; CLASS_TIME_TABLE = "ClassTimeTable"; CIRCULAR = "Circular"
    EVENT_INFORMATION = "EventInformation"; FEES_NOTICE = "FeesNotice"; EXAM_FORM = "ExamForm"
    GENERAL_NOTICE = "GeneralNotice"; GENERAL_INFORMATION = "GeneralInformation"; SEMINAR_INFORMATION = "SeminarInformation"


class UploadResponse(BaseModel):
    success: bool; message: str; file_id: Optional[str] = None; hash: Optional[str] = None


class StudentUploadResponse(BaseModel):
    success: bool; message: str; file_id: Optional[str] = None; hash: Optional[str] = None


class EmailPrompt(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=500)


class DraftedEmail(BaseModel):
    success: bool; email_body: str; email_subject: str; message: Optional[str] = None; generation_time: Optional[float] = None


class DashboardLogin(BaseModel):
    email: str; password: str


class DashboardLoginResponse(BaseModel):
    success: bool; message: str; token: Optional[str] = None


class FacultyLogin(BaseModel):
    email: str; password: str


class FacultyLoginResponse(BaseModel):
    success: bool; message: str; token: Optional[str] = None


class DashboardStats(BaseModel):
    total_files: int; total_emails: int; today_uploads: int; weekly_uploads: int


class DashboardResponse(BaseModel):
    success: bool; records: List[Dict[str, Any]]; stats: DashboardStats


class StudentQuery(BaseModel):
    batch: str; branch: str; semester: str; doc_type: str
    question: str = Field(..., min_length=1)
    lang: Optional[str] = None


class RagQuery(BaseModel):
    question: str = Field(..., min_length=1)
    lang: Optional[str] = None


class ChatQueryResponse(BaseModel):
    answer: str
    sources: List[str] = []
    detected_lang: str = "en"
    widened_search: bool = False


# --- HELPERS ---
def calculate_file_hash_from_stream(file_stream: io.BytesIO, chunk_size=8192) -> str:
    sha256_hash = hashlib.sha256(); file_stream.seek(0)
    while chunk := file_stream.read(chunk_size): sha256_hash.update(chunk)
    file_stream.seek(0); return sha256_hash.hexdigest()


def validate_file(file: UploadFile, check_extension: bool = True):
    if not file.filename: raise HTTPException(status_code=400, detail="No file provided.")
    if check_extension and Path(file.filename).suffix.lower() not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    if file.size and file.size > config.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large.")


async def validate_dashboard_credentials(email: str, password: str) -> bool:
    if admin_store is None:
        return False
    return await admin_store.validate_credentials(email, password)


def create_dashboard_token(email: str) -> str:
    return create_token(config.AUTH_SECRET_KEY, email)


async def validate_dashboard_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "): return None
    if admin_store is None or not config.AUTH_SECRET_KEY: return None
    token = authorization.replace("Bearer ", "")
    email = verify_token(config.AUTH_SECRET_KEY, token)
    if email and await admin_store.email_exists(email):
        return email
    return None


async def index_document(file_content: bytes, filename: str, file_hash: str, metadata: dict) -> int:
    """Extract -> chunk -> embed each chunk (NIM bge-m3) -> upsert to Qdrant. Returns chunk count."""
    if qdrant_store is None or not nim_client.is_configured:
        raise HTTPException(status_code=503, detail="Retrieval backend (Qdrant/NIM) is not configured.")

    doc = await asyncio.get_event_loop().run_in_executor(executor, extract_document, file_content, filename, None)
    text = doc.text.strip()
    if not text:
        text = f"Title: {metadata.get('title', filename)}\nFile: {filename} - no text could be extracted."

    chunks = chunk_text(text)
    if not chunks:
        chunks = [text]

    vectors = await nim_client.embed(chunks, input_type="passage")
    source_lang = simple_lang_code(doc.detected_langs[0]) if doc.detected_langs else "en"

    payloads = []
    for i, chunk in enumerate(chunks):
        payload = dict(metadata)
        payload.update({
            "chunk_index": i,
            "source_lang": source_lang,
            "text": chunk,
            "file_hash": file_hash,
        })
        payloads.append(payload)

    await qdrant_store.upsert_chunks(file_hash, vectors, payloads)
    return len(chunks)


async def answer_query(question: str, filters: dict, lang_hint: Optional[str]) -> ChatQueryResponse:
    if qdrant_store is None or not nim_client.is_configured:
        raise HTTPException(status_code=503, detail="Chat backend (Qdrant/NIM) is not configured.")

    detected_lang = lang_hint or simple_lang_code(detect_script(question)[0])

    query_vector = (await nim_client.embed([question], input_type="query"))[0]

    hits = await qdrant_store.search(query_vector, filters, limit=config.RETRIEVE_TOP_K)
    widened = False
    if not hits and any(filters.values()):
        # Graceful filter-widening: drop the most specific filter first, then keep loosening.
        widen_order = ["document_type", "semester", "branch", "batch"]
        loosened = dict(filters)
        for key in widen_order:
            if loosened.get(key):
                loosened[key] = None
                hits = await qdrant_store.search(query_vector, loosened, limit=config.RETRIEVE_TOP_K)
                widened = True
                if hits:
                    break

    if not hits:
        return ChatQueryResponse(
            answer="I couldn't find anything relevant in the indexed documents for that question. Please try rephrasing, or check with the college office directly.",
            sources=[], detected_lang=detected_lang, widened_search=widened,
        )

    passages = [hit.payload.get("text", "") for hit in hits]
    top_indices = await nim_client.rerank(question, passages, top_n=min(config.RERANK_TOP_N, len(hits)))
    top_hits = [hits[i] for i in top_indices]

    context_blocks = []
    sources = []
    for hit in top_hits:
        payload = hit.payload
        filename = payload.get("filename", "document")
        context_blocks.append(f"[Source: {filename}]\n{payload.get('text', '')}")
        if filename not in sources:
            sources.append(filename)

    system_prompt = (
        "You are Samvaad, the multilingual assistant for LDRP-ITR, an engineering college in Gandhinagar, Gujarat. "
        "Answer the student's/visitor's question using ONLY the provided context. "
        "If the context does not contain the answer, say so honestly rather than guessing. "
        f"Respond in the same language as the question (language code: {detected_lang}). "
        "Be concise and directly helpful."
    )
    user_prompt = "Context:\n\n" + "\n\n---\n\n".join(context_blocks) + f"\n\nQuestion: {question}"

    answer = await nim_client.chat(
        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
    )

    return ChatQueryResponse(answer=answer, sources=sources, detected_lang=detected_lang, widened_search=widened)


# --- CORE SERVICES: email generation (unchanged, Groq-backed) ---
class DirectHTTPEmailGenerator:
    def __init__(self):
        self.system_prompt = """You are an expert email writer for an Indian engineering college administration. Write professional, concise emails for students and faculty.

RULES:
1. Generate both EMAIL SUBJECT and EMAIL BODY
2. Direct, clear communication
3. Formal but friendly tone
4. End email body with "Best regards," only
5. Keep email body under 150 words for speed
6. Address common college scenarios professionally
7. Subject should be concise and descriptive (max 8-10 words)

RESPONSE FORMAT:
SUBJECT: [Your subject line here]

BODY:
[Your email body here]

Best regards,"""
        self.models_to_try = [
            "llama-3.1-8b-instant", "llama3-8b-8192",
            "llama-3.1-70b-versatile", "llama3-70b-8192"
        ]

    async def generate_optimized_email(self, prompt: str) -> tuple[str, str, float]:
        if not http_client:
            return "Error: Email generation service unavailable.", "", 0.0
        if not prompt or not prompt.strip():
            return "Error: Please provide a valid email prompt.", "", 0.0

        start_time = time.time()
        try:
            email_content, email_subject = await asyncio.wait_for(
                self._call_groq_api_direct(prompt.strip()),
                timeout=config.EMAIL_GENERATION_TIMEOUT
            )
            generation_time = time.time() - start_time
            logger.info(f"Email generated successfully in {generation_time:.2f}s")
            return email_subject, email_content, generation_time
        except asyncio.TimeoutError:
            logger.warning("Email generation timed out.")
            fallback_body, fallback_subject = self._create_fallback_email(prompt)
            return fallback_body, fallback_subject, config.EMAIL_GENERATION_TIMEOUT
        except Exception as e:
            logger.error(f"Email generation error: {type(e).__name__}: {str(e)}")
            return f"Error: Email generation failed - {type(e).__name__}", "", time.time() - start_time

    async def _call_groq_api_direct(self, prompt: str) -> tuple[str, str]:
        clean_prompt = prompt.strip()[:500]
        for model in self.models_to_try:
            try:
                payload = {
                    "messages": [{"role": "system", "content": self.system_prompt}, {"role": "user", "content": clean_prompt}],
                    "model": model, "max_tokens": config.GROQ_MAX_TOKENS, "temperature": config.GROQ_TEMPERATURE,
                    "top_p": 0.9, "stream": False
                }
                response = await http_client.post(config.GROQ_BASE_URL, json=payload, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("choices") and data["choices"][0]["message"]["content"]:
                        content = data["choices"][0]["message"]["content"].strip()
                        return self._parse_email_response(content)
                logger.warning(f"No content from model {model}, status: {response.status_code}")
            except Exception as e:
                logger.warning(f"Model {model} failed: {type(e).__name__}: {str(e)}")
                if model == self.models_to_try[-1]:
                    return f"All models failed. Last error: {type(e).__name__}", "Email Generation Failed"
                continue
        return "Unable to generate email with any available model.", "Email Generation Failed"

    def _parse_email_response(self, content: str) -> tuple[str, str]:
        subject = "Important Notice"
        try:
            lower_content = content.lower()
            if 'subject:' in lower_content and 'body:' in lower_content:
                subject_part, _, body_part = content.partition(next(filter(lambda x: x in content, ['BODY:', 'Body:'])))
                _, _, subject = subject_part.partition(next(filter(lambda x: x in subject_part, ['SUBJECT:', 'Subject:'])))
                return subject.strip() or "Important Notice", body_part.strip()
            if 'subject:' in lower_content:
                _, _, after_subject = content.partition(next(filter(lambda x: x in content, ['SUBJECT:', 'Subject:'])))
                subject_line, _, body_part = after_subject.partition('\n')
                return subject_line.strip() or "Important Notice", body_part.strip()
            lines = content.strip().split('\n')
            potential_subject = lines[0].strip()
            if len(potential_subject) < 80 and potential_subject and potential_subject[-1] not in '.?!':
                return potential_subject, '\n'.join(lines[1:]).strip()
            return "Important Notice", content
        except Exception as e:
            logger.error(f"Error parsing email response: {e}. Falling back to basic split.")
            lines = content.strip().split('\n')
            if len(lines) > 1:
                return lines[0].strip(), '\n'.join(lines[1:]).strip()
            return "Important Notice", content

    def _create_fallback_email(self, prompt: str) -> tuple[str, str]:
        subject = "Important Notice"
        body = f"""Dear Recipient,\n\nThis is a notice regarding: "{prompt[:50]}..."\n\nFurther details will be communicated shortly.\n\nBest regards,"""
        return body, subject


email_generator = DirectHTTPEmailGenerator()


# --- API ENDPOINTS ---
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up Samvaad backend...")
    if client_initialized:
        logger.info("Groq HTTP integration ready for email generation")
    else:
        logger.warning("Groq HTTP integration failed - email generation disabled")
    if nim_client.is_configured and qdrant_store is not None:
        logger.info("NIM + Qdrant retrieval backend ready")
    else:
        logger.warning("NIM/Qdrant not fully configured - /student_query and /rag_query will return 503")


@app.post("/api/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    document_type: DocumentType = Form(...),
    batch: str = Form(...),
    branch: str = Form(...),
    semester: str = Form(...)
):
    validate_file(file, check_extension=True)
    doc_type_str = document_type.value
    formatted_semester = f"Semester {semester.strip()}"
    logger.info(f"Processing admin upload: '{title}' ({file.filename}), batch: {batch}, type: {doc_type_str}")
    temp_file_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        with open(temp_file_path, "rb") as f:
            file_content = f.read()
            file_hash = calculate_file_hash_from_stream(io.BytesIO(file_content))

        if qdrant_store is not None and await qdrant_store.exists_by_hash(file_hash):
            return UploadResponse(success=False, message="Document with identical content already exists.", hash=file_hash)

        if await file_store.exists(batch, branch, formatted_semester, doc_type_str, file.filename):
            return UploadResponse(success=False, message=f"A file named '{file.filename}' already exists. Please rename and re-upload.")

        logical_path = "/".join([batch, branch, formatted_semester, doc_type_str, file.filename])
        metadata = {
            "title": title, "description": description, "filename": file.filename,
            "document_type": doc_type_str, "batch": batch, "branch": branch,
            "semester": formatted_semester, "file_path": logical_path,
            "upload_date": datetime.now().isoformat(),
        }
        chunk_count = await index_document(file_content, file.filename, file_hash, metadata)

        await file_store.save(file.filename, file_content, file_hash, batch, branch, formatted_semester, doc_type_str)
        file_id = f"{batch}-{branch}-{formatted_semester}-{doc_type_str}-{uuid.uuid4().hex[:8]}"

        await analytics.log_upload_activity({
            "filename": file.filename, "title": title, "description": description,
            "document_type": doc_type_str, "batch": batch, "branch": branch,
            "semester": formatted_semester, "file_size": len(file_content),
            "uploader_email": "admin@college.edu"
        })

        logger.info(f"Admin document uploaded and indexed ({chunk_count} chunks): {file_id}")
        return UploadResponse(success=True, message="Document uploaded and indexed successfully!", file_id=file_id, hash=file_hash)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin upload failed: {str(e)}")
        return UploadResponse(success=False, message=f"Upload failed: {str(e)}")
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@app.post("/api/upload-student-document", response_model=StudentUploadResponse)
async def upload_student_document(file: UploadFile = File(...)):
    title = Path(file.filename).stem.replace('_', ' ').title()
    description = f"File uploaded by a visitor: {file.filename}"

    logger.info(f"Processing student/visitor upload: '{title}' ({file.filename})")
    validate_file(file, check_extension=False)

    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        with open(temp_file_path, "rb") as f:
            file_content = f.read()
            file_hash = calculate_file_hash_from_stream(io.BytesIO(file_content))

        if qdrant_store is not None and await qdrant_store.exists_by_hash(file_hash):
            return StudentUploadResponse(success=False, message="This document has already been uploaded.", hash=file_hash)

        stored_filename = file.filename
        if await file_store.exists("Student/Visitor", "N/A", "N/A", "GeneralQuery", stored_filename):
            base, ext = os.path.splitext(file.filename)
            stored_filename = f"{base}_{uuid.uuid4().hex[:6]}{ext}"

        logical_path = "/".join(["Student/Visitor", "GeneralQuery", stored_filename])
        metadata = {
            "title": title, "description": description, "filename": stored_filename,
            "document_type": "GeneralQuery", "batch": "Student/Visitor", "branch": "N/A", "semester": "N/A",
            "file_path": logical_path, "upload_date": datetime.now().isoformat(),
        }
        chunk_count = await index_document(file_content, file.filename, file_hash, metadata)

        await file_store.save(stored_filename, file_content, file_hash, "Student/Visitor", "N/A", "N/A", "GeneralQuery")
        file_id = f"student-doc-{uuid.uuid4().hex[:8]}"

        await analytics.log_upload_activity({
            "filename": stored_filename, "title": title, "description": description,
            "document_type": "Student/GeneralQuery", "batch": "Student/Visitor", "branch": "N/A", "semester": "N/A",
            "file_size": len(file_content), "uploader_email": "student.visitor@system"
        })

        logger.info(f"Student document '{file.filename}' indexed ({chunk_count} chunks): {file_id}")
        return StudentUploadResponse(success=True, message="Document uploaded successfully!", file_id=file_id, hash=file_hash)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Student document upload failed: {str(e)}")
        return StudentUploadResponse(success=False, message=f"An error occurred: {str(e)}")
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@app.post("/student_query", response_model=ChatQueryResponse)
async def student_query(query: StudentQuery):
    filters = {
        "batch": query.batch,
        "branch": query.branch,
        "semester": query.semester if query.semester.lower().startswith("semester") else f"Semester {query.semester}",
        "document_type": query.doc_type,
    }
    return await answer_query(query.question, filters, query.lang)


@app.post("/rag_query", response_model=ChatQueryResponse)
async def rag_query(query: RagQuery):
    return await answer_query(query.question, {}, query.lang)


@app.post("/api/draft-email", response_model=DraftedEmail)
async def draft_email(email_request: EmailPrompt):
    try:
        email_content, email_subject, generation_time = await email_generator.generate_optimized_email(email_request.prompt)
        await analytics.log_email_activity({"prompt": email_request.prompt, "email_body": email_content, "user_email": "user@college.edu"})
        return DraftedEmail(success=True, email_body=email_content, email_subject=email_subject, message="Email generated successfully", generation_time=generation_time)
    except Exception as e:
        logger.error(f"Email generation failed: {str(e)}")
        return DraftedEmail(success=False, email_body="", email_subject="", message=f"Email generation failed: {str(e)}", generation_time=0.0)


@app.post("/api/dashboard/login", response_model=DashboardLoginResponse)
async def dashboard_login(login_request: DashboardLogin):
    try:
        if await validate_dashboard_credentials(login_request.email, login_request.password):
            token = create_dashboard_token(login_request.email)
            return DashboardLoginResponse(success=True, message="Login successful", token=token)
        return DashboardLoginResponse(success=False, message="Invalid email or password")
    except Exception as e:
        logger.error(f"Dashboard login error: {str(e)}")
        return DashboardLoginResponse(success=False, message="Login failed due to server error")


@app.post("/api/faculty/login", response_model=FacultyLoginResponse)
async def faculty_login(login_request: FacultyLogin):
    try:
        if faculty_store is None or not config.AUTH_SECRET_KEY:
            return FacultyLoginResponse(success=False, message="Login failed due to server error")
        if await faculty_store.validate_credentials(login_request.email, login_request.password):
            token = create_token(config.AUTH_SECRET_KEY, login_request.email)
            return FacultyLoginResponse(success=True, message="Login successful", token=token)
        return FacultyLoginResponse(success=False, message="Invalid email or password")
    except Exception as e:
        logger.error(f"Faculty login error: {str(e)}")
        return FacultyLoginResponse(success=False, message="Login failed due to server error")


@app.get("/api/dashboard/records", response_model=DashboardResponse)
async def get_dashboard_records(authorization: Optional[str] = Header(None)):
    try:
        user_email = await validate_dashboard_token(authorization)
        if not user_email: raise HTTPException(status_code=401, detail="Unauthorized access")
        records = await analytics.get_dashboard_records(limit=500)
        stats_dict = await analytics.get_dashboard_stats()
        return DashboardResponse(success=True, records=records, stats=DashboardStats(**stats_dict))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard records error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")


@app.get("/api/dashboard/export")
async def export_dashboard_data(authorization: Optional[str] = Header(None)):
    try:
        user_email = await validate_dashboard_token(authorization)
        if not user_email: raise HTTPException(status_code=401, detail="Unauthorized access")
        records = await analytics.get_dashboard_records(limit=1000)
        csv_lines = ["Email,Date,Time,File Type,File Name,Document Type,Batch,Branch,Semester"]
        for record in records:
            file_name = record.get("file_name", "").replace('"', '""')
            line_data = [f'"{record.get("email", "")}"', f'"{record.get("date", "")}"', f'"{record.get("time", "")}"', f'"{record.get("file_type", "")}"', f'"{file_name}"', f'"{record.get("document_type", "")}"', f'"{record.get("batch", "")}"', f'"{record.get("branch", "")}"', f'"{record.get("semester", "")}"']
            csv_lines.append(",".join(line_data))
        csv_content = "\n".join(csv_lines)
        return {"success": True, "csv_data": csv_content, "filename": f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", "record_count": len(records)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard export error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export dashboard data")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "nim": nim_client.is_configured,
            "qdrant": qdrant_store is not None,
            "groq_email": client_initialized,
        },
        "version": "4.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
