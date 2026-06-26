from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import chromadb
import hashlib
import os
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timedelta
import shutil
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import PyPDF2
from docx import Document
from PIL import Image
import io
import time
from functools import lru_cache
from enum import Enum
import tempfile
import json
import base64

# --- IMPORTS for Direct HTTP API calls ---
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# --- END IMPORTS ---

# Configure advanced logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Professional Document & Comms System with Analytics",
    description="High-performance API with Local Embeddings, ChromaDB, Email Drafting powered by Groq/Llama3, and Real-time Analytics Dashboard",
    version="3.4.1", # Version updated
    docs_url="/docs", redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- CONFIGURATION ---
class Config:
    UPLOAD_DIR = "uploads"
    CHROMADB_DIR = "chromadb_data"
    DASHBOARD_DIR = "dashboard_data"
    STUDENT_UPLOAD_DIR = os.path.join("uploads", "student_visitor")
    STUDENT_CHROMADB_DIR = os.path.join("chromadb_data", "student_visitor")
    EMBEDDING_MODEL = "google/embeddinggemma-300m"
    MAX_FILE_SIZE = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'}
    CHUNK_SIZE = 512
    CHUNK_OVERLAP = 50
    MAX_WORKERS = 4
    EMBEDDING_CACHE_SIZE = 1000
    CHROMA_BATCH_SIZE = 50
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
    EMAIL_GENERATION_TIMEOUT = 4.5
    GROQ_MAX_TOKENS = 400
    GROQ_TEMPERATURE = 0.3
    DASHBOARD_USERS = {
        "admin@college.edu": "admin123",
        "principal@college.edu": "principal456",
        "dean@college.edu": "dean789"
    }

config = Config()

# --- CONFIGURE DIRECT HTTP CLIENT ---
http_client = None

def initialize_http_client():
    global http_client
    if not config.GROQ_API_KEY:
        logger.error("GROQ_API_KEY not found. Please set it in your .env file.")
        return False
    
    logger.info(f"GROQ_API_KEY found: {config.GROQ_API_KEY[:10]}...{config.GROQ_API_KEY[-4:]}")
    try:
        headers = { "Authorization": f"Bearer {config.GROQ_API_KEY}", "Content-Type": "application/json" }
        http_client = httpx.AsyncClient(headers=headers, timeout=httpx.Timeout(30.0), limits=httpx.Limits(max_keepalive_connections=5, max_connections=10))
        logger.info("HTTP client for Groq API initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize HTTP client: {e}")
        return False

client_initialized = initialize_http_client()

# Create directories
for directory in [config.UPLOAD_DIR, config.CHROMADB_DIR, config.DASHBOARD_DIR, config.STUDENT_UPLOAD_DIR, config.STUDENT_CHROMADB_DIR]:
    os.makedirs(directory, exist_ok=True)

executor = ThreadPoolExecutor(max_workers=config.MAX_WORKERS)

# --- PYDANTIC MODELS ---
class DocumentType(str, Enum):
    EXAM_TIMETABLE = "ExamTimetable"; CLASS_TIME_TABLE = "ClassTimeTable"; CIRCULAR = "Circular"
    EVENT_INFORMATION = "EventInformation"; FEES_NOTICE = "FeesNotice"; EXAM_FORM = "ExamForm"
    GENERAL_NOTICE = "GeneralNotice"; GENERAL_INFORMATION = "GeneralInformation"; SEMINAR_INFORMATION = "SeminarInformation"

class StudentDocumentType(str, Enum):
    GENERAL_QUERY = "GeneralQuery"

class UploadResponse(BaseModel):
    success: bool; message: str; file_id: Optional[str] = None; hash: Optional[str] = None

class StudentUploadResponse(BaseModel):
    success: bool; message: str; file_id: Optional[str] = None; hash: Optional[str] = None

class SearchQuery(BaseModel):
    query: str; batch: str; document_type: Optional[str] = None; branch: Optional[str] = None
    semester: Optional[str] = None; limit: int = 10

class SearchResponse(BaseModel):
    success: bool; results: List[Dict[str, Any]]; query: str; total_results: int

class EmailPrompt(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=500)

class DraftedEmail(BaseModel):
    success: bool; email_body: str; email_subject: str; message: Optional[str] = None; generation_time: Optional[float] = None

class DashboardLogin(BaseModel):
    email: str; password: str

class DashboardLoginResponse(BaseModel):
    success: bool; message: str; token: Optional[str] = None

class DashboardRecord(BaseModel):
    id: str; email: str; date: str; time: str; file_type: str; file_name: str
    document_type: str; batch: str; branch: str; semester: str; upload_timestamp: datetime

class DashboardStats(BaseModel):
    total_files: int; total_emails: int; today_uploads: int; weekly_uploads: int

class DashboardResponse(BaseModel):
    success: bool; records: List[Dict[str, Any]]; stats: DashboardStats

# --- CORE SERVICES ---
class EmbeddingManager:
    def __init__(self):
        self.model = None; self.tokenizer = None; self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False; self.model_loading_lock = asyncio.Lock(); logger.info(f"EmbeddingManager initialized on device: {self.device}")
    async def load_model(self):
        if self.is_loaded: return
        async with self.model_loading_lock:
            if self.is_loaded: return
            try:
                logger.info(f"Loading {config.EMBEDDING_MODEL} model..."); start_time = time.time()
                self.tokenizer, self.model = await asyncio.get_event_loop().run_in_executor(executor, self._load_model_sync)
                self.is_loaded = True; logger.info(f"Model loaded in {time.time() - start_time:.2f}s")
            except Exception as e: logger.error(f"Failed to load embedding model: {e}"); raise
    def _load_model_sync(self):
        tokenizer = AutoTokenizer.from_pretrained(config.EMBEDDING_MODEL, trust_remote_code=True)
        model = AutoModel.from_pretrained(config.EMBEDDING_MODEL, trust_remote_code=True, torch_dtype=torch.float16 if self.device.type == "cuda" else torch.float32).to(self.device).eval()
        return tokenizer, model
    def chunk_text(self, text: str) -> List[str]:
        if len(text) <= config.CHUNK_SIZE: return [text]
        chunks = [text[i:i + config.CHUNK_SIZE] for i in range(0, len(text), config.CHUNK_SIZE - config.CHUNK_OVERLAP)]; return [c for c in chunks if c.strip()]
    @lru_cache(maxsize=config.EMBEDDING_CACHE_SIZE)
    def _cached_embed(self, text_hash: str, text: str) -> np.ndarray: return self._generate_embedding_sync(text)
    def _generate_embedding_sync(self, text: str) -> np.ndarray:
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
        norm = np.linalg.norm(embeddings, axis=1, keepdims=True); return embeddings / norm if norm.any() else embeddings
    async def generate_embeddings(self, text: str) -> List[float]:
        if not self.is_loaded: await self.load_model()
        text = text.strip()
        if not text: return [0.0] * (self.model.config.hidden_size if self.is_loaded else 256)
        chunks = self.chunk_text(text)
        if not chunks: return [0.0] * (self.model.config.hidden_size if self.is_loaded else 256)
        tasks = [asyncio.get_event_loop().run_in_executor(executor, self._cached_embed, hashlib.md5(chunk.encode()).hexdigest(), chunk) for chunk in chunks]
        chunk_embeddings = await asyncio.gather(*tasks)
        final_embedding = np.mean(chunk_embeddings, axis=0)
        final_norm = np.linalg.norm(final_embedding)
        normalized_embedding = (final_embedding / final_norm).flatten() if final_norm > 0 else final_embedding.flatten()
        return [float(x) for x in normalized_embedding]

class TextExtractor:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        ext = Path(filename).suffix.lower(); text = ""
        try:
            if ext == '.pdf':
                reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                for page in reader.pages: text += (page.extract_text() or "") + "\n"
            elif ext == '.docx':
                doc = Document(io.BytesIO(file_content))
                for para in doc.paragraphs: text += para.text + "\n"
            elif ext in ['.txt', '.md']: text = file_content.decode('utf-8', errors='ignore')
            elif ext in ['.jpg', '.jpeg', '.png']:
                img = Image.open(io.BytesIO(file_content)); text = f"Image metadata: {img.format}, {img.size}, {img.mode}"
        except Exception as e: logger.warning(f"Could not extract text from {filename}: {e}")
        return text.strip()

class ChromaDBManager:
    def __init__(self):
        self.clients = {}; self.connection_pool = asyncio.Semaphore(10); logger.info("ChromaDBManager initialized")
    async def get_client(self, batch: str):
        async with self.connection_pool:
            if batch not in self.clients:
                db_path = os.path.join(config.CHROMADB_DIR, f"batch_{batch}"); os.makedirs(db_path, exist_ok=True)
                try: self.clients[batch] = chromadb.PersistentClient(path=db_path)
                except Exception as e:
                    logger.warning(f"Failed to create persistent client, using in-memory: {e}")
                    try: self.clients[batch] = chromadb.Client()
                    except Exception as e2: raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e2)}")
            return self.clients[batch]
    async def get_collection(self, batch: str, collection_name: str = "documents"):
        client = await self.get_client(batch)
        try: return client.get_or_create_collection(name=collection_name, metadata={"hnsw:space": "cosine"})
        except Exception as e: raise HTTPException(status_code=500, detail=f"Collection operation failed: {str(e)}")
    
    async def get_student_collection(self, collection_name: str = "student_visitor_documents"):
        client_key = "student_visitor_client"
        async with self.connection_pool:
            if client_key not in self.clients:
                db_path = config.STUDENT_CHROMADB_DIR
                os.makedirs(db_path, exist_ok=True)
                try:
                    self.clients[client_key] = chromadb.PersistentClient(path=db_path)
                    logger.info(f"Persistent ChromaDB client created for students at: {db_path}")
                except Exception as e:
                    logger.error(f"Failed to create persistent client for student DB, using in-memory: {e}")
                    self.clients[client_key] = chromadb.Client()
            client = self.clients[client_key]
            try:
                return client.get_or_create_collection(name=collection_name, metadata={"hnsw:space": "cosine"})
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Student collection operation failed: {str(e)}")

class DashboardAnalytics:
    def __init__(self):
        self.analytics_db_path = os.path.join(config.DASHBOARD_DIR, "analytics.db")
        self.client = None
        self.collection = None
        self.initialize_analytics_db()
        
    def initialize_analytics_db(self):
        try:
            db_path = os.path.join(config.DASHBOARD_DIR, "analytics_db")
            os.makedirs(db_path, exist_ok=True)
            self.client = chromadb.PersistentClient(path=db_path)
            self.collection = self.client.get_or_create_collection(
                name="upload_analytics",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Dashboard Analytics DB initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize analytics DB: {e}")
            
    async def log_upload_activity(self, file_data: dict):
        try:
            if not self.collection:
                return
            
            current_time = datetime.now()
            record_id = f"upload_{uuid.uuid4().hex[:12]}"
            
            analytics_record = {
                "id": record_id,
                "email": file_data.get("uploader_email", "user@college.edu"),
                "date": current_time.strftime("%Y-%m-%d"),
                "time": current_time.strftime("%H:%M:%S"),
                "file_type": Path(file_data["filename"]).suffix.lower(),
                "file_name": file_data["filename"],
                "document_type": file_data["document_type"],
                "batch": file_data["batch"],
                "branch": file_data["branch"],
                "semester": file_data["semester"],
                "upload_timestamp": current_time.isoformat(),
                "file_size": file_data.get("file_size", 0),
                "title": file_data["title"],
                "description": file_data.get("description", ""),
                "activity_type": "file_upload"
            }
            
            embedding_text = f"{file_data['title']} {file_data.get('description', '')} {file_data['document_type']} {file_data['batch']} {file_data['branch']}"
            embeddings = await embedding_manager.generate_embeddings(embedding_text)
            
            self.collection.add(
                ids=[record_id],
                embeddings=[embeddings],
                documents=[json.dumps(analytics_record)],
                metadatas=[{
                    "record_type": "upload", "date": analytics_record["date"],
                    "batch": analytics_record["batch"], "branch": analytics_record["branch"],
                    "semester": analytics_record["semester"], "document_type": analytics_record["document_type"],
                    "uploader_email": analytics_record["email"], "activity_type": "file_upload"
                }]
            )
            logger.info(f"Upload activity logged: {record_id} - {file_data['filename']}")
        except Exception as e:
            logger.error(f"Failed to log upload activity: {e}")
            
    async def log_email_activity(self, email_data: dict):
        try:
            if not self.collection:
                return
            
            current_time = datetime.now()
            record_id = f"email_{uuid.uuid4().hex[:12]}"
            
            analytics_record = {
                "id": record_id, "email": email_data.get("user_email", "user@college.edu"),
                "date": current_time.strftime("%Y-%m-%d"), "time": current_time.strftime("%H:%M:%S"),
                "file_type": "email", "file_name": f"email_{current_time.strftime('%Y%m%d_%H%M%S')}.txt",
                "document_type": "EmailGeneration", "batch": "N/A", "branch": "N/A", "semester": "N/A",
                "upload_timestamp": current_time.isoformat(), "prompt": email_data.get("prompt", ""),
                "email_length": len(email_data.get("email_body", "")), "activity_type": "email_generation"
            }
            
            embedding_text = f"email generation {email_data.get('prompt', '')}"
            embeddings = await embedding_manager.generate_embeddings(embedding_text)
            
            self.collection.add(
                ids=[record_id], embeddings=[embeddings], documents=[json.dumps(analytics_record)],
                metadatas=[{"record_type": "email", "date": analytics_record["date"], "user_email": analytics_record["email"], "activity_type": "email_generation"}]
            )
            logger.info(f"Email activity logged: {record_id}")
        except Exception as e:
            logger.error(f"Failed to log email activity: {e}")
            
    async def get_dashboard_records(self, limit: int = 500) -> List[Dict[str, Any]]:
        try:
            if not self.collection:
                return []
            
            results = self.collection.get(limit=limit, include=["documents", "metadatas"])
            
            records = []
            for doc, metadata in zip(results.get("documents", []), results.get("metadatas", [])):
                try:
                    record = json.loads(doc)
                    if record.get("activity_type") == "file_upload":
                        records.append(record)
                except json.JSONDecodeError:
                    continue
            
            records.sort(key=lambda x: x.get("upload_timestamp", ""), reverse=True)
            return records
        except Exception as e:
            logger.error(f"Failed to get dashboard records: {e}")
            return []
            
    async def get_dashboard_stats(self) -> DashboardStats:
        try:
            if not self.collection:
                return DashboardStats(total_files=0, total_emails=0, today_uploads=0, weekly_uploads=0)
            
            all_results = self.collection.get(limit=5000, include=["documents", "metadatas"])
            
            current_date = datetime.now().date()
            week_ago = current_date - timedelta(days=7)
            
            total_files = 0; today_uploads = 0; weekly_uploads = 0
            
            for doc, metadata in zip(all_results.get("documents", []), all_results.get("metadatas", [])):
                try:
                    record = json.loads(doc)
                    activity_type = record.get("activity_type", "")
                    record_date_str = record.get("date", "2000-01-01")
                    record_date = datetime.strptime(record_date_str, "%Y-%m-%d").date()
                    
                    if activity_type == "file_upload":
                        total_files += 1
                        if record_date == current_date:
                            today_uploads += 1
                        if record_date >= week_ago:
                            weekly_uploads += 1
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Failed to parse record for stats: {e}")
                    continue
            
            logger.info(f"Statistics calculated - Files: {total_files}, Today: {today_uploads}, Weekly: {weekly_uploads}")
            return DashboardStats(total_files=total_files, total_emails=0, today_uploads=today_uploads, weekly_uploads=weekly_uploads)
        except Exception as e:
            logger.error(f"Failed to calculate dashboard stats: {e}")
            return DashboardStats(total_files=0, total_emails=0, today_uploads=0, weekly_uploads=0)

embedding_manager = EmbeddingManager()
text_extractor = TextExtractor()
db_manager = ChromaDBManager()
dashboard_analytics = DashboardAnalytics()

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
            logger.warning(f"Email generation timed out.")
            fallback_body, fallback_subject = self._create_fallback_email(prompt)
            return fallback_body, fallback_subject, config.EMAIL_GENERATION_TIMEOUT
        except Exception as e:
            logger.error(f"Email generation error: {type(e).__name__}: {str(e)}")
            return f"Error: Email generation failed - {type(e).__name__}", "", time.time() - start_time

    async def _call_groq_api_direct(self, prompt: str) -> tuple[str, str]:
        clean_prompt = prompt.strip()[:500]
        for model in self.models_to_try:
            try:
                logger.info(f"Trying email generation with model: {model}")
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
                        logger.info(f"Success with model: {model}. Raw content received:\n{content}")
                        return self._parse_email_response(content)
                logger.warning(f"No content from model {model}, status: {response.status_code}, response: {response.text}")
            except Exception as e:
                logger.warning(f"Model {model} failed: {type(e).__name__}: {str(e)}")
                if model == self.models_to_try[-1]:
                    return f"All models failed. Last error: {type(e).__name__}", "Email Generation Failed"
                continue
        return "Unable to generate email with any available model.", "Email Generation Failed"

    def _parse_email_response(self, content: str) -> tuple[str, str]:
        """
        Robustly parses the AI response to extract subject and body.
        Handles cases where the model doesn't perfectly follow the SUBJECT/BODY format.
        """
        subject = "Important Notice"
        body = content

        try:
            lower_content = content.lower()
            # Case 1: Both keywords are present
            if 'subject:' in lower_content and 'body:' in lower_content:
                subject_part, _, body_part = content.partition(next(filter(lambda x: x in content, ['BODY:', 'Body:'])))
                _, _, subject = subject_part.partition(next(filter(lambda x: x in subject_part, ['SUBJECT:', 'Subject:'])))
                return subject.strip() or "Important Notice", body_part.strip()

            # Case 2: Only "SUBJECT:" is present
            if 'subject:' in lower_content:
                _, _, after_subject = content.partition(next(filter(lambda x: x in content, ['SUBJECT:', 'Subject:'])))
                subject_line, _, body_part = after_subject.partition('\n')
                return subject_line.strip() or "Important Notice", body_part.strip()

            # Case 3: No keywords, assume first line is subject
            lines = content.strip().split('\n')
            potential_subject = lines[0].strip()
            if len(potential_subject) < 80 and potential_subject and potential_subject[-1] not in '.?!':
                return potential_subject, '\n'.join(lines[1:]).strip()
            else:
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

# --- HELPER FUNCTIONS ---
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

def validate_dashboard_credentials(email: str, password: str) -> bool:
    return email in config.DASHBOARD_USERS and config.DASHBOARD_USERS[email] == password

def create_dashboard_token(email: str) -> str:
    return base64.b64encode(f"{email}:{datetime.now().isoformat()}".encode()).decode()

def validate_dashboard_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "): return None
    try:
        token = authorization.replace("Bearer ", "")
        if ":" in token:
            email, password = token.split(":", 1)
            if validate_dashboard_credentials(email, password): return email
    except Exception: pass
    return None

# --- API ENDPOINTS ---
@app.on_event("startup")
async def startup_event():
    logger.info("Starting up System with Real-time Analytics...")
    asyncio.create_task(embedding_manager.load_model())
    if client_initialized: logger.info("✅ Groq HTTP integration ready for email generation")
    else: logger.warning("❌ Groq HTTP integration failed - email generation disabled")

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
        
        collection = await db_manager.get_collection(batch)
        if existing_by_hash := collection.get(where={"file_hash": file_hash}, limit=1):
            if existing_by_hash.get('ids'): 
                return UploadResponse(
                    success=False, 
                    message="Document with identical content already exists.", 
                    file_id=existing_by_hash['ids'][0], 
                    hash=file_hash
                )
        
        structured_path = os.path.join(config.UPLOAD_DIR, batch, branch, formatted_semester, doc_type_str)
        os.makedirs(structured_path, exist_ok=True)
        final_file_path = os.path.join(structured_path, file.filename)
        
        if os.path.exists(final_file_path): 
            return UploadResponse(
                success=False, 
                message=f"A file named '{file.filename}' already exists. Please rename and re-upload."
            )
        
        text_content = text_extractor.extract_text(file_content, file.filename) or f"Title: {title}\nFile: {file.filename} - No text extracted."
        embeddings = await embedding_manager.generate_embeddings(text_content)
        
        shutil.move(temp_file_path, final_file_path)
        temp_file_path = None
        file_id = f"{batch}-{branch}-{formatted_semester}-{doc_type_str}-{uuid.uuid4().hex[:8]}"
        
        metadata = {
            "title": title, "description": description, "filename": file.filename, 
            "document_type": doc_type_str, "batch": batch, "branch": branch, 
            "semester": formatted_semester, "file_path": final_file_path, 
            "file_hash": file_hash, "upload_date": datetime.now().isoformat()
        }
        
        collection.add(
            ids=[file_id], embeddings=[embeddings], documents=[text_content], metadatas=[metadata]
        )
        
        await dashboard_analytics.log_upload_activity({
            "filename": file.filename, "title": title, "description": description,
            "document_type": doc_type_str, "batch": batch, "branch": branch,
            "semester": formatted_semester, "file_size": len(file_content),
            "uploader_email": "admin@college.edu"
        })
        
        logger.info(f"Admin document uploaded and logged: {file_id}")
        return UploadResponse(success=True, message="Document uploaded and indexed successfully!", file_id=file_id, hash=file_hash)
        
    except Exception as e:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        logger.error(f"Admin upload failed: {str(e)}")
        return UploadResponse(success=False, message=f"Upload failed: {str(e)}")

@app.post("/api/upload-student-document", response_model=StudentUploadResponse)
async def upload_student_document(file: UploadFile = File(...)):
    title = Path(file.filename).stem.replace('_', ' ').title()
    uploader_name = "Visitor"
    description = f"File uploaded by a visitor: {file.filename}"
    document_category = StudentDocumentType.GENERAL_QUERY

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

        collection = await db_manager.get_student_collection()
        if existing_by_hash := collection.get(where={"file_hash": file_hash}, limit=1):
            if existing_by_hash.get('ids'):
                return StudentUploadResponse(
                    success=False, message="This document has already been uploaded.",
                    file_id=existing_by_hash['ids'][0], hash=file_hash
                )
        
        category_str = document_category.value
        structured_path = os.path.join(config.STUDENT_UPLOAD_DIR, category_str)
        os.makedirs(structured_path, exist_ok=True)
        final_file_path = os.path.join(structured_path, file.filename)
        
        if os.path.exists(final_file_path):
            base, ext = os.path.splitext(file.filename)
            final_file_path = os.path.join(structured_path, f"{base}_{uuid.uuid4().hex[:6]}{ext}")

        text_content = text_extractor.extract_text(file_content, file.filename) or f"File: {file.filename} - No text extracted."
        embeddings = await embedding_manager.generate_embeddings(text_content)
        
        shutil.move(temp_file_path, final_file_path)
        temp_file_path = None
        file_id = f"student-doc-{uuid.uuid4().hex[:8]}"
        
        metadata = {
            "title": title, "description": description, "uploader_name": uploader_name,
            "document_category": category_str, "filename": os.path.basename(final_file_path),
            "file_path": final_file_path, "file_hash": file_hash,
            "upload_date": datetime.now().isoformat()
        }
        
        collection.add(ids=[file_id], embeddings=[embeddings], documents=[text_content], metadatas=[metadata])

        await dashboard_analytics.log_upload_activity({
            "filename": os.path.basename(final_file_path), "title": title, "description": description,
            "document_type": f"Student/{category_str}", "batch": "Student/Visitor", "branch": "N/A", "semester": "N/A",
            "file_size": len(file_content), "uploader_email": "student.visitor@system"
        })

        logger.info(f"Student document '{file.filename}' indexed: {file_id}")
        return StudentUploadResponse(success=True, message="Document uploaded successfully!", file_id=file_id, hash=file_hash)

    except Exception as e:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        logger.error(f"Student document upload failed: {str(e)}")
        return StudentUploadResponse(success=False, message=f"An error occurred: {str(e)}")

@app.post("/api/draft-email", response_model=DraftedEmail)
async def draft_email(email_request: EmailPrompt):
    try:
        logger.info(f"Email generation request: {email_request.prompt[:50]}...")
        email_content, email_subject, generation_time = await email_generator.generate_optimized_email(email_request.prompt)
        await dashboard_analytics.log_email_activity({"prompt": email_request.prompt, "email_body": email_content, "user_email": "user@college.edu"})
        return DraftedEmail(success=True, email_body=email_content, email_subject=email_subject, message="Email generated successfully", generation_time=generation_time)
    except Exception as e:
        logger.error(f"Email generation failed: {str(e)}")
        return DraftedEmail(success=False, email_body="", email_subject="", message=f"Email generation failed: {str(e)}", generation_time=0.0)

@app.post("/api/dashboard/login", response_model=DashboardLoginResponse)
async def dashboard_login(login_request: DashboardLogin):
    try:
        if validate_dashboard_credentials(login_request.email, login_request.password):
            token = create_dashboard_token(login_request.email); logger.info(f"Dashboard login successful: {login_request.email}")
            return DashboardLoginResponse(success=True, message="Login successful", token=token)
        else:
            logger.warning(f"Dashboard login failed: {login_request.email}")
            return DashboardLoginResponse(success=False, message="Invalid email or password")
    except Exception as e:
        logger.error(f"Dashboard login error: {str(e)}"); return DashboardLoginResponse(success=False, message="Login failed due to server error")

@app.get("/api/dashboard/records", response_model=DashboardResponse)
async def get_dashboard_records(authorization: Optional[str] = Header(None)):
    try:
        user_email = validate_dashboard_token(authorization)
        if not user_email: raise HTTPException(status_code=401, detail="Unauthorized access")
        records = await dashboard_analytics.get_dashboard_records(limit=500); stats = await dashboard_analytics.get_dashboard_stats()
        logger.info(f"Real-time dashboard data requested by: {user_email} - {len(records)} records, {stats.total_files} total files")
        return DashboardResponse(success=True, records=records, stats=stats)
    except HTTPException: raise
    except Exception as e: logger.error(f"Dashboard records error: {str(e)}"); raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@app.get("/api/dashboard/export")
async def export_dashboard_data(authorization: Optional[str] = Header(None)):
    try:
        user_email = validate_dashboard_token(authorization)
        if not user_email: raise HTTPException(status_code=401, detail="Unauthorized access")
        records = await dashboard_analytics.get_dashboard_records(limit=1000)
        csv_lines = ["Email,Date,Time,File Type,File Name,Document Type,Batch,Branch,Semester"]
        for record in records:
            line_data = [f'"{record.get("email", "")}"', f'"{record.get("date", "")}"', f'"{record.get("time", "")}"', f'"{record.get("file_type", "")}"', f'"{record.get("file_name", "").replace('"', '""')}"', f'"{record.get("document_type", "")}"', f'"{record.get("batch", "")}"', f'"{record.get("branch", "")}"', f'"{record.get("semester", "")}"']
            csv_lines.append(",".join(line_data))
        csv_content = "\n".join(csv_lines)
        logger.info(f"Dashboard export requested by: {user_email} - {len(records)} records exported")
        return {"success": True, "csv_data": csv_content, "filename": f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv", "record_count": len(records)}
    except HTTPException: raise
    except Exception as e: logger.error(f"Dashboard export error: {str(e)}"); raise HTTPException(status_code=500, detail="Failed to export dashboard data")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "services": {"embeddings": embedding_manager.is_loaded, "groq_api": client_initialized, "dashboard_analytics": dashboard_analytics.collection is not None}, "version": "3.4.1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)