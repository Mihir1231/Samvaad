from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import os
import httpx
from typing import List, Dict, Any

# --- Page Setup & Basic App Initialization ---
app = FastAPI(
    title="College Document RAG API (Ollama)",
    description="Backend API to connect to local ChromaDB and Ollama models.",
    version="1.0.0",
)

# --- CORS Middleware ---
# Allows the React frontend (running on a different port) to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- CONFIGURATION (Adapted for Ollama) ---
class Config:
    CHROMADB_DIR = "D:/LDRP ITR/backend/chromadb_data"
    ALL_BATCHES_CHROMADB_DIR = os.path.join("chromadb_data", "all_batches")
    STUDENT_CHROMADB_DIR = os.path.join("chromadb_data", "student_visitor")
    OLLAMA_EMBEDDING_MODEL = "embeddinggemma"
    OLLAMA_CHAT_MODEL = "gemma3:4b"
    OLLAMA_BASE_URL = "http://localhost:11434"

config = Config()

# --- CORE LOGIC (Singleton Instances) ---

class EmbeddingManager:
    """Handles text vectorization using a local Ollama model."""
    def generate_embeddings(self, text: str) -> List[float]:
        """Generates embeddings by calling the Ollama API."""
        if not text.strip():
            return []
        try:
            payload = {"model": config.OLLAMA_EMBEDDING_MODEL, "prompt": text}
            response = httpx.post(f"{config.OLLAMA_BASE_URL}/api/embeddings", json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json().get("embedding", [])
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Ollama embedding service unavailable: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")

class ChromaDBManager:
    """Handles connections to the local ChromaDB persistent storage."""
    def __init__(self):
        self._clients = {}

    def get_collection(self, client_key: str, collection_name: str = "documents"):
        """Gets the correct DB collection based on the agent's key."""
        if client_key not in self._clients:
            if client_key == "all_batches":
                db_path = config.ALL_BATCHES_CHROMADB_DIR
            elif client_key == "student_visitor":
                db_path = config.STUDENT_CHROMADB_DIR
            else:
                db_path = os.path.join(config.CHROMADB_DIR, f"batch_{client_key}")

            if not os.path.exists(db_path):
                raise HTTPException(status_code=404, detail=f"Database path not found for key: {client_key}")
            
            self._clients[client_key] = chromadb.PersistentClient(path=db_path)
        
        client = self._clients[client_key]
        return client.get_or_create_collection(name=collection_name, metadata={"hnsw:space": "cosine"})

# Initialize singleton managers
embedding_manager = EmbeddingManager()
db_manager = ChromaDBManager()

# --- Pydantic Models for API Requests ---
class SearchRequest(BaseModel):
    query: str
    batch: str
    branch: str
    semester: str
    document_type: str
    limit: int = 10

class AnswerRequest(BaseModel):
    query: str
    context: List[str]

# --- API ENDPOINTS ---

@app.post("/api/search")
async def search_documents(request: SearchRequest) -> Dict[str, Any]:
    """Performs a local search in ChromaDB."""
    collection = db_manager.get_collection(client_key=request.batch)
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found for the given batch.")

    query_embedding = embedding_manager.generate_embeddings(request.query)
    if not query_embedding:
        raise HTTPException(status_code=500, detail="Could not generate query embeddings.")

    where_filter = {}
    filters_to_apply = []
    if request.branch != "ALL":
        filters_to_apply.append({"branch": {"$eq": request.branch}})
    if request.semester != "ALL":
        formatted_semester = f"Semester {request.semester.strip()}"
        filters_to_apply.append({"semester": {"$eq": formatted_semester}})
    if request.document_type != "ALL":
        filters_to_apply.append({"document_type": {"$eq": request.document_type}})

    if len(filters_to_apply) > 1:
        where_filter["$and"] = filters_to_apply
    elif len(filters_to_apply) == 1:
        where_filter = filters_to_apply[0]

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=request.limit,
            where=where_filter if where_filter else None,
            include=["metadatas", "documents", "distances"]
        )
        
        formatted_results = []
        if results and results.get('ids')[0]:
            for i in range(len(results['ids'][0])):
                formatted_results.append({
                    "metadata": results['metadatas'][0][i],
                    "document": results['documents'][0][i],
                    "distance": results['distances'][0][i]
                })
        
        return {
            "success": True,
            "results": formatted_results,
            "total_results": len(formatted_results),
            "query": request.query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during search: {e}")

@app.post("/api/answer-query")
async def generate_answer(request: AnswerRequest) -> Dict[str, Any]:
    """Generates an answer using a local Ollama model."""
    system_prompt = "You are a helpful assistant for a college. Answer the user's query based ONLY on the provided context documents. If the context doesn't contain the answer, state that clearly. Do not use outside knowledge. Be concise and direct."
    context_str = "\n\n---\n\n".join(request.context)
    full_prompt = f"CONTEXT:\n{context_str}\n\nQUERY:\n{request.query}"

    payload = {
        "model": config.OLLAMA_CHAT_MODEL,
        "prompt": full_prompt,
        "stream": False,
        "options": {"temperature": 0.2}
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{config.OLLAMA_BASE_URL}/api/generate", json=payload, timeout=60.0)
            response.raise_for_status()
        data = response.json()
        return {"answer": data.get("response", "No response content from Ollama.")}
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Connection error to Ollama API: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {e}")

@app.get("/")
def read_root():
    return {"message": "Ollama RAG Backend is running."}
