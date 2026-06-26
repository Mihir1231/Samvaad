import os
import re
import chromadb
import ollama
from unstructured.partition.auto import partition

# --- CONFIGURATION ---
OLLAMA_EMBEDDING_MODEL = "embeddinggemma"
OLLAMA_LLM_MODEL = "gemma3:4b"
RELEVANCE_THRESHOLD = 7 # The score a chunk must meet to be considered a "direct hit".

# --- HELPER: TEXT EXTRACTION (NOW USING UNSTRUCTURED) ---
class TextExtractor:
    """Extracts text from various file types using the 'unstructured' library."""
    def extract(self, file_path: str) -> str | None:
        """
        Extracts text from a file using the unstructured.io library, which
        automatically handles different file types like PDF, DOCX, and images (with OCR).
        """
        print(f"TextExtractor: Extracting content from {os.path.basename(file_path)} using 'unstructured'.")
        try:
            # 'unstructured' automatically detects the file type and uses the best parser.
            # For images, it will still require Tesseract to be installed on the system.
            elements = partition(filename=file_path)
            
            # Join the text from all extracted elements to form a single document string.
            # Using a double newline helps preserve paragraph-like structures for chunking.
            content = "\n\n".join([str(el) for el in elements])
            return content
        except Exception as e:
            print(f"TextExtractor: Error processing file {os.path.basename(file_path)} with 'unstructured': {e}")
            # This can happen if a required dependency for a file type (e.g., tesseract for images,
            # or poppler for PDFs) is not installed on the system.
            return None

# --- CORE RAG PIPELINE ---
class RAGPipeline:
    """Manages the connection to ChromaDB, embedding generation, and querying."""
    def __init__(self, db_base_path: str):
        self.db_base_path = db_base_path
        self._clients = {}

    def get_collection(self, batch: str):
        db_path = os.path.join(self.db_base_path, f"batch_{batch}")
        if not os.path.exists(db_path): raise FileNotFoundError(f"Database for Batch '{batch}' not found at: {db_path}")
        if batch not in self._clients: self._clients[batch] = chromadb.PersistentClient(path=db_path)
        return self._clients[batch].get_collection("documents")

    def generate_embedding(self, text: str) -> list[float] | None:
        try:
            response = ollama.embeddings(model=OLLAMA_EMBEDDING_MODEL, prompt=text)
            return response["embedding"]
        except Exception as e: print(f"Error generating Ollama embedding: {e}"); return None

    def query_collection(self, collection, query_embedding: list[float], filter_metadata: dict):
        return collection.query(query_embeddings=[query_embedding], n_results=5, where=filter_metadata)

# --- SPECIALIZED AGENT DEFINITIONS ---

class BatchAgent:
    def __init__(self, rag_pipeline: RAGPipeline): self.rag_pipeline = rag_pipeline
    def select_database(self, batch: str):
        print(f"Batch Agent: Selecting database for batch '{batch}'.")
        return self.rag_pipeline.get_collection(batch)

class DepartmentAgent:
    def add_filter(self, branch: str) -> dict: return {"branch": {"$eq": branch}}

class SemesterAgent:
    def add_filter(self, semester: str) -> dict: return {"semester": {"$eq": semester}}

class DocumentTypeAgent:
    def add_filter(self, doc_type: str) -> dict: return {"document_type": {"$eq": doc_type}}

# --- UPGRADED: QUERY DECONSTRUCTION AGENT ---
class QueryAnalysisAgent:
    """Deconstructs the user's query to understand intent and find key entities."""
    def analyze(self, prompt: str) -> dict:
        print("QueryAnalysisAgent: Deconstructing user query.")
        system_prompt = """You are an expert query analyst. Analyze the user's question and break it down into a JSON object with two keys: 'keywords' and 'entities'.
- 'keywords' should be a list of simple, lower-case words for a broad search.
- 'entities' should be a list of specific, named things (like "computer engineering", "semester 1", "fees notice"). Preserve their original casing and form.
- Be concise and accurate. Example: for "what is the fee for sem 1 of cse?", respond with {"keywords": ["fee", "sem", "1", "cse"], "entities": ["sem 1", "cse"]}.
Respond with only the JSON object."""
        
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}]
        try:
            response = ollama.chat(model=OLLAMA_LLM_MODEL, messages=messages)
            # Robustly extract JSON from the model's response
            json_str = re.search(r'\{.*\}', response['message']['content'], re.DOTALL).group(0)
            analysis = eval(json_str) # Using eval for simplicity, for production consider json.loads
            print(f"  - Analysis complete: {analysis}")
            return analysis
        except Exception as e:
            print(f"QueryAnalysisAgent: Error analyzing query. Falling back to basic keywords. Error: {e}")
            # Fallback to simple keyword extraction if LLM fails
            words = re.findall(r'\b\w+\b', prompt.lower())
            return {"keywords": words, "entities": words}


class ChunkingAgent:
    """Breaks down texts using a context-aware hybrid strategy to preserve tables."""
    def chunk_text(self, text: str) -> list[str]:
        print("Chunking Agent: Splitting document with context-aware strategy.")
        # Attempt to split by paragraphs first
        chunks = text.split('\n\n')
        # Further split any long chunks by single newlines, preserving table-like rows
        final_chunks = []
        for chunk in chunks:
            if len(chunk) > 1500: # If a chunk is very long, it's likely not a paragraph
                sub_chunks = chunk.split('\n')
                current_chunk = ""
                for line in sub_chunks:
                    if len(current_chunk) + len(line) + 1 < 1000:
                        current_chunk += line + "\n"
                    else:
                        final_chunks.append(current_chunk.strip())
                        current_chunk = line + "\n"
                if current_chunk: final_chunks.append(current_chunk.strip())
            elif chunk.strip():
                final_chunks.append(chunk.strip())

        return final_chunks if final_chunks else [text]

class ReRankingAgent:
    """Uses an LLM to score the relevance of each text chunk."""
    def rank_chunk(self, chunk: str, prompt: str) -> int:
        system_prompt = f"""As a relevance expert, score the 'Context Chunk' from 1-10 based on how likely it is to contain a direct answer to the 'User's Question'. Respond with only a single number. User's Question: {prompt}"""
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Context Chunk:\n---\n{chunk}"}]
        try:
            response = ollama.chat(model=OLLAMA_LLM_MODEL, messages=messages)
            match = re.search(r'\d+', response['message']['content'])
            return int(match.group(0)) if match else 0
        except Exception: return 0

# --- FINAL, ROBUST ORCHESTRATOR ---
class ChiefAgent:
    """Orchestrates the workflow using the Analyze -> Chunk -> Scan -> Filter -> Re-Rank -> Answer pipeline."""
    def __init__(self, rag_pipeline: RAGPipeline):
        self.rag_pipeline = rag_pipeline
        self.batch_agent = BatchAgent(rag_pipeline)
        self.dept_agent = DepartmentAgent()
        self.sem_agent = SemesterAgent()
        self.doc_type_agent = DocumentTypeAgent()
        self.query_agent = QueryAnalysisAgent()
        self.chunking_agent = ChunkingAgent()
        self.reranking_agent = ReRankingAgent()

    def process_query(self, prompt: str, batch: str, branch: str, semester: str, doc_type: str) -> str:
        try:
            results, response_prefix = self._retrieve_documents(prompt, batch, branch, semester, doc_type)
            if not self._is_valid_results(results):
                return f"I performed a broad search but could not find any relevant documents for your query related to Batch {batch}, {branch}."

            llm_response = self._rerank_and_generate_answer(prompt, results)
            return response_prefix + llm_response
        except FileNotFoundError as e: return str(e)
        except Exception as e:
            print(f"An unexpected error occurred in ChiefAgent: {e}")
            return "An unexpected error occurred. Please check the application logs for details."
    
    def _retrieve_documents(self, prompt, batch, branch, semester, doc_type):
        collection = self.batch_agent.select_database(batch)
        query_embedding = self.rag_pipeline.generate_embedding(prompt)
        if not query_embedding: raise Exception("Failed to generate query embedding.")
        
        primary_filter = {"$and": [self.dept_agent.add_filter(branch), self.sem_agent.add_filter(semester), self.doc_type_agent.add_filter(doc_type)]}
        results = self.rag_pipeline.query_collection(collection, query_embedding, primary_filter)
        response_prefix = ""

        if not self._is_valid_results(results):
            response_prefix = f"I couldn't find a specific '{doc_type}' document, so I broadened my search to other relevant materials. "
            fallback_filter = {"$and": [self.dept_agent.add_filter(branch), self.sem_agent.add_filter(semester)]}
            results = self.rag_pipeline.query_collection(collection, query_embedding, fallback_filter)
        
        return results, response_prefix

    def _rerank_and_generate_answer(self, prompt: str, results: dict) -> str:
        query_analysis = self.query_agent.analyze(prompt)
        keywords = query_analysis['keywords']
        entities = query_analysis['entities']
        original_documents = results['documents'][0]
        
        # Pass 1 & 2: Keyword Sweep and Entity Filter
        candidate_chunks = []
        print("Chief Agent: Starting Passes 1 & 2 - Keyword Sweep and Entity Filter.")
        for doc_text in original_documents:
            chunks = self.chunking_agent.chunk_text(doc_text)
            for chunk in chunks:
                chunk_lower = chunk.lower()
                # Must contain at least one keyword AND one entity to be a strong candidate
                if any(kw in chunk_lower for kw in keywords) and any(en in chunk_lower for en in entities):
                    candidate_chunks.append(chunk)
        
        if not candidate_chunks:
             print("  - No chunks passed the initial filters. Falling back to a broader keyword search.")
             for doc_text in original_documents:
                chunks = self.chunking_agent.chunk_text(doc_text)
                for chunk in chunks:
                    if any(kw in chunk.lower() for kw in keywords):
                        candidate_chunks.append(chunk)

        if not candidate_chunks:
            filename = results['metadatas'][0][0].get('filename', 'the retrieved document')
            return f"I reviewed a relevant document ({filename}), but could not find any section related to your specific question."

        # Pass 3: Final LLM Re-Ranking on the filtered candidates
        print(f"Chief Agent: Starting Pass 3 - Re-Ranking {len(candidate_chunks)} candidate chunks.")
        scored_chunks = [{'score': self.reranking_agent.rank_chunk(chunk, prompt), 'text': chunk} for chunk in candidate_chunks]
        
        # Adaptive Context Building
        scored_chunks.sort(key=lambda x: x['score'], reverse=True)
        top_chunks, high_confidence = [], False
        for chunk in scored_chunks:
            if chunk['score'] >= RELEVANCE_THRESHOLD:
                top_chunks.append(chunk['text'])
                high_confidence = True
        
        if not top_chunks: # If no chunk meets the high threshold, take the top 3 scored chunks
             print("  - No chunks met the high-confidence threshold. Building context from the best available chunks.")
             top_chunks = [chunk['text'] for chunk in scored_chunks[:3] if chunk['score'] > 2]

        if not top_chunks: # Final failsafe
            filename = results['metadatas'][0][0].get('filename', 'the retrieved document')
            return f"I performed a detailed analysis of the document ({filename}), but could not isolate a specific answer. The information may be absent or in an unreadable format."

        final_context = "\n\n---\n\n".join(top_chunks)
        return self._generate_final_llm_response(prompt, final_context, results['metadatas'][0], high_confidence)

    def _generate_final_llm_response(self, prompt: str, context: str, sources_metadata: list, high_confidence: bool) -> str:
        print(f"Chief Agent: Generating final answer. High confidence: {high_confidence}")
        if high_confidence:
            system_prompt = "You are a precise and helpful assistant. Synthesize a direct and concise answer to the user's question based *only* on the highly relevant context provided below."
        else:
            system_prompt = "You are a helpful assistant. The provided context contains the best available clues, but may not be a perfect answer. Synthesize the most likely answer to the user's question based *only* on the context. If you cannot, state that you found related information but not a specific answer."

        user_prompt = f"Context:\n===\n{context}\n===\n\nQuestion: {prompt}"
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]

        response = ollama.chat(model=OLLAMA_LLM_MODEL, messages=messages)
        response_text = response['message']['content']

        source_list, filenames_seen = "\n\n---\n*📚 Sources Consulted:*\n", set()
        for source_meta in sources_metadata:
            filename = source_meta.get('filename', 'Unknown File')
            if filename not in filenames_seen: source_list += f"  - {filename}\n"; filenames_seen.add(filename)
        response_text += source_list
        return response_text

    def _is_valid_results(self, results: dict) -> bool:
        return bool(results and results.get('documents') and results['documents'][0])