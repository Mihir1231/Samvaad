import streamlit as st
import chromadb
import os
import ollama
from PIL import Image
import pytesseract
import fitz  # PyMuPDF
import docx  # python-docx
from pdf2image import convert_from_path
import hashlib
from datetime import datetime
import tempfile
import pandas as pd

# --- CONFIGURATION ---

# 1. Set the BASE path to your main ChromaDB data directory.
CHROMA_BASE_PATH = "D:/LDRP ITR/backend/chromadb_data"

# 2. Define the subdirectories for each agent's database relative to the base path.
STUDENT_DB_SUBDIR = ""  # Student batch data will be in subfolders like /batch_2022-26
VISITOR_DB_SUBDIR = "student_visitor" # Visitor data will be in a separate folder

# 3. Set the names of the models you are using in Ollama.
OLLAMA_EMBEDDING_MODEL = "embeddinggemma"
OLLAMA_LLM_MODEL = "gemma3:4b"

# 4. Set the path to your Tesseract executable (if it's not in your system's PATH)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Page configuration
st.set_page_config(
    page_title="Multi-Agent OCR RAG Chatbot",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- ENHANCED OCR EXTRACTION FUNCTIONS ---

def extract_text_from_pdf_ocr(pdf_path):
    """
    Enhanced PDF OCR extraction using both direct text extraction and OCR for scanned pages.
    """
    if not os.path.exists(pdf_path):
        return f"Error: The file '{pdf_path}' was not found."
    
    st.info(f"🔄 Starting enhanced OCR process for: {os.path.basename(pdf_path)}")
    
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        pages_needing_ocr = []
        
        for page_num, page in enumerate(doc):
            direct_text = page.get_text()
            if len(direct_text.strip()) < 50:  # Heuristic for a scanned page
                pages_needing_ocr.append(page_num)
            else:
                full_text += f"\n\n--- Page {page_num + 1} ---\n\n{direct_text}"
        
        doc.close()
        
        if pages_needing_ocr:
            st.info(f"🔍 {len(pages_needing_ocr)} page(s) require OCR processing...")
            pages = convert_from_path(pdf_path)
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            for i, page_image in enumerate(pages):
                if i in pages_needing_ocr:
                    status_text.text(f"Processing OCR for page {i + 1}/{len(pages)}...")
                    progress_bar.progress((i + 1) / len(pages))
                    ocr_text = pytesseract.image_to_string(page_image)
                    full_text += f"\n\n--- Page {i + 1} (OCR) ---\n\n{ocr_text}"
            
            status_text.empty()
            progress_bar.empty()

        st.success("✅ Enhanced OCR process completed successfully!")
        return full_text
    except Exception as e:
        st.error(f"An error occurred during the enhanced OCR process: {e}")
        return f"An error occurred during the enhanced OCR process: {e}"

def extract_text_from_image(image_path):
    try:
        with Image.open(image_path) as img:
            return pytesseract.image_to_string(img)
    except Exception as e:
        st.error(f"Error reading image {os.path.basename(image_path)}: {e}")
        return None

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        st.error(f"Error reading DOCX {os.path.basename(file_path)}: {e}")
        return None

def extract_text_from_file(file_path):
    _, file_extension = os.path.splitext(file_path.lower())
    if file_extension == ".pdf":
        return extract_text_from_pdf_ocr(file_path)
    elif file_extension == ".docx":
        return extract_text_from_docx(file_path)
    elif file_extension in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        return extract_text_from_image(file_path)
    else:
        st.warning(f"Unsupported file type: {file_extension}")
        return None

# --- CHROMADB & OLLAMA INTEGRATION ---

@st.cache_resource
def get_student_batch_collection(batch):
    """Connects to the ChromaDB for a specific student batch."""
    db_path = os.path.join(CHROMA_BASE_PATH, STUDENT_DB_SUBDIR, f"batch_{batch}")
    os.makedirs(db_path, exist_ok=True)
    try:
        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_or_create_collection("documents")
        return collection
    except Exception as e:
        st.error(f"Failed to connect to ChromaDB for Batch '{batch}': {e}")
        return None

@st.cache_resource
def get_visitor_collection():
    """Connects to the dedicated ChromaDB for Parents/Visitors."""
    db_path = os.path.join(CHROMA_BASE_PATH, VISITOR_DB_SUBDIR)
    os.makedirs(db_path, exist_ok=True)
    try:
        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_or_create_collection("student_visitor_documents")
        return collection
    except Exception as e:
        st.error(f"Failed to connect to Visitor ChromaDB: {e}")
        return None

def generate_ollama_embedding(text):
    try:
        response = ollama.embeddings(model=OLLAMA_EMBEDDING_MODEL, prompt=text)
        return response["embedding"]
    except Exception as e:
        st.error(f"Error generating embedding with Ollama: {e}")
        return None

def store_document_with_metadata(collection, file_path, extracted_text, filename, metadata_args):
    """Stores a document with flexible metadata for any agent."""
    try:
        file_hash = hashlib.md5(extracted_text.encode()).hexdigest()
        doc_id = f"doc_{file_hash}"
        
        embedding = generate_ollama_embedding(extracted_text)
        if not embedding:
            st.error("Failed to generate embedding, cannot store document.")
            return None
        
        default_metadata = {
            "filename": filename,
            "file_path": file_path,
            "processed_date": datetime.now().isoformat(),
            "file_size": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
            "title": filename
        }
        
        final_metadata = {**default_metadata, **metadata_args}
        
        collection.upsert(
            documents=[extracted_text],
            metadatas=[final_metadata],
            ids=[doc_id],
            embeddings=[embedding]
        )
        
        st.success(f"✅ Document '{filename}' stored with ID: {doc_id}")
        return doc_id
    except Exception as e:
        st.error(f"❌ Error storing document '{filename}': {e}")
        return None

# --- STREAMLIT APP ---

def main():
    st.title("🤖 LDRP-ITR Multi-Agent RAG Chatbot")
    st.markdown("Select an agent, upload relevant documents, and ask questions.")
    st.markdown("---")
    
    try:
        ollama.list()
    except Exception:
        st.error("🚨 Ollama is not running. Please start the Ollama application and refresh this page.")
        st.stop()
    
    # --- SIDEBAR FOR AGENT SELECTION AND CONFIGURATION ---
    with st.sidebar:
        st.header("🔧 Agent Configuration")
        
        agent_type = st.radio("Select Agent:", ("Student", "Parents/Visitor"), key="agent_selector")

        # --- STUDENT AGENT CONFIGURATION ---
        if agent_type == "Student":
            st.subheader("Student Details")
            batches = ["2022-26", "2023-27", "2024-28", "2025-29"]
            branches = ["computer_engineering", "information_technology", "mechanical_engineering",
                        "electrical_communication", "electrical_engineering", "civil_engineering"]
            semesters = [f"Semester {i}" for i in range(1, 9)]
            doc_types = ["ExamForm", "FeesNotice", "ExamTimetable", "Circular", "EventInformation",
                         "ClassTimeTable", "SeminarInformation", "GeneralNotice", "GeneralInformation"]
            
            selected_batch = st.selectbox("Select Batch:", batches)
            selected_branch = st.selectbox("Select Branch:", branches)
            selected_semester = st.selectbox("Select Semester:", semesters)
            selected_doc_type = st.selectbox("Select Document Type:", doc_types)
            
            st.info(f"🎯 Active Agent: {selected_doc_type} for {selected_branch}, {selected_semester} of Batch {selected_batch}")
            collection = get_student_batch_collection(selected_batch)
            agent_id = f"student_{selected_batch}_{selected_branch}_{selected_semester}_{selected_doc_type}"
            
        # --- PARENTS/VISITOR AGENT CONFIGURATION ---
        else: # agent_type == "Parents/Visitor"
            st.info("🎯 Active Agent: Parents/Visitor")
            selected_batch = selected_branch = selected_semester = selected_doc_type = None
            collection = get_visitor_collection()
            agent_id = "parents_visitor"

    # --- MAIN TABS ---
    tab1, tab2, tab3, tab4 = st.tabs(["💬 Chat with Agent", "📤 Upload & Process", "🔍 Search Documents", "📊 Collection Info"])
    
    if not collection:
        st.error("Database connection failed for the selected agent. Please check the base path and permissions.")
        st.stop()
        
    # --- TAB 1: CHAT INTERFACE ---
    with tab1:
        st.header(f"💬 Chat with {agent_type} Agent")
        
        if "messages" not in st.session_state or st.session_state.get("agent_id") != agent_id:
            st.session_state.messages = []
            st.session_state.agent_id = agent_id
        
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        
        if prompt := st.chat_input(f"Ask the {agent_type} agent a question..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            
            with st.chat_message("assistant"):
                with st.spinner(f"🤔 {agent_type} agent is processing..."):
                    query_embedding = generate_ollama_embedding(prompt)
                    
                    if query_embedding:
                        # --- Dynamic RAG Logic based on Agent ---
                        if agent_type == "Student":
                            where_filter = {
                                "$and": [
                                    {"batch": {"$eq": selected_batch}},
                                    {"branch": {"$eq": selected_branch}},
                                    {"semester": {"$eq": selected_semester}},
                                    {"document_type": {"$eq": selected_doc_type}}
                                ]}
                            system_prompt = f"""You are a specialized document assistant for {selected_branch} students in {selected_semester} of Batch {selected_batch}.
                                               You specifically handle {selected_doc_type} related queries. Answer based ONLY on the provided context.
                                               If the information isn't in the context, clearly state that you cannot find it."""
                        else: # Parents/Visitor Agent
                            where_filter = {} # No specific filter needed
                            system_prompt = """You are a helpful assistant for parents and visitors of the LDRP-ITR college.
                                               Answer questions based ONLY on the provided context from the documents.
                                               If the information is not available, state that clearly."""

                        results = collection.query(
                            query_embeddings=[query_embedding],
                            n_results=3,
                            where=where_filter
                        )
                        
                        if not results or not results.get('documents') or not results['documents'][0]:
                            response_text = f"🤷 The {agent_type} agent could not find relevant information in its knowledge base for your query."
                        else:
                            context = "\n\n".join(results['documents'][0])
                            user_prompt = f"Context:\n{context}\n\nQuestion: {prompt}"
                            messages = [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ]
                            response = ollama.chat(model=OLLAMA_LLM_MODEL, messages=messages)
                            response_text = response['message']['content']
                            
                            if results['metadatas'][0]:
                                sources = results['metadatas'][0]
                                source_list = "\n\n---\n*📚 Sources:*\n"
                                for i, source_meta in enumerate(sources):
                                    source_list += f"{i + 1}. {source_meta.get('filename', 'Unknown')}\n"
                                response_text += source_list
                    else:
                        response_text = "❌ Failed to process your query embedding. Please try again."
                    
                    st.markdown(response_text)
                    st.session_state.messages.append({"role": "assistant", "content": response_text})
    
    # --- TAB 2: DOCUMENT UPLOAD ---
    with tab2:
        st.header(f"📤 Upload Documents for {agent_type} Agent")
        
        uploaded_files = st.file_uploader(
            "Choose files",
            type=["pdf", "docx", "png", "jpg", "jpeg", "bmp", "tiff"],
            accept_multiple_files=True
        )
        
        if st.button("🚀 Process & Store Documents", type="primary"):
            if uploaded_files:
                for uploaded_file in uploaded_files:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1]) as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        temp_path = tmp_file.name
                    
                    with st.spinner(f"🔄 Processing {uploaded_file.name}..."):
                        extracted_text = extract_text_from_file(temp_path)
                    
                    if extracted_text and not extracted_text.startswith("Error:"):
                        with st.expander(f"📄 Preview: {uploaded_file.name}"):
                            st.text_area("Extracted Text", extracted_text[:1000] + "...", height=200)
                        
                        if agent_type == "Student":
                            metadata = {
                                "batch": selected_batch,
                                "branch": selected_branch,
                                "semester": selected_semester,
                                "document_type": selected_doc_type
                            }
                        else: 
                            metadata = { "agent_type": "visitor" }
                            
                        store_document_with_metadata(collection, temp_path, extracted_text, uploaded_file.name, metadata)
                    else:
                        st.error(f"Could not extract text from {uploaded_file.name}.")
                    
                    os.unlink(temp_path)
                st.balloons()
            else:
                st.warning("⚠ Please upload at least one file to process.")
    
    # --- TAB 3 & 4 (COMMON LOGIC, DIFFERENT COLLECTION) ---
    with tab3:
        st.header(f"🔍 Search Documents in {agent_type} Collection")
        search_query = st.text_input("Search Query", placeholder="Enter search terms...", key=f"search_query_{agent_id}")
        n_results = st.slider("Number of results", 1, 10, 5, key=f"n_results_{agent_id}")
        
        if st.button("🔍 Search", key=f"search_button_{agent_id}") and search_query:
            with st.spinner("Searching..."):
                query_embedding = generate_ollama_embedding(search_query)
                if query_embedding:
                    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
                    if results and results['documents'][0]:
                        for i, (doc, metadata, dist) in enumerate(zip(results['documents'][0], results['metadatas'][0], results['distances'][0])):
                            with st.expander(f"📄 Result {i+1}: {metadata.get('filename', 'N/A')} (Relevance: {((1-dist)*100):.1f}%)"):
                                st.json(metadata, expanded=False)
                                st.text_area("", doc[:500] + "...", height=150, key=f"search_{agent_id}_{i}")
                    else:
                        st.info("No results found.")

    with tab4:
        st.header(f"📊 {agent_type} Collection Information")
        if st.button("🔄 Refresh Info", key=f"refresh_info_{agent_id}"):
            count = collection.count()
            st.metric("📄 Total Documents", count)
            if count > 0:
                docs = collection.get(limit=min(100, count))
                df_data = [{**{'ID': id}, **meta} for id, meta in zip(docs['ids'], docs['metadatas'])]
                df = pd.DataFrame(df_data)
                st.dataframe(df, use_container_width=True)
                
                with st.expander("⚠ Danger Zone"):
                    st.warning(f"This will delete ALL documents in the {agent_type} collection!")
                    if st.button(f"🗑 Clear All Documents from {agent_type} DB", key=f"delete_all_{agent_id}"):
                        collection.delete(ids=docs['ids'])
                        st.success("All documents cleared!")
                        st.rerun()

if __name__ == "__main__":
    main()
