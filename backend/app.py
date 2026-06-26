import streamlit as st
import pytesseract
from pdf2image import convert_from_path
import os
import chromadb
from chromadb.config import Settings
import hashlib
from datetime import datetime
import tempfile
import pandas as pd

# Page configuration
st.set_page_config(
    page_title="PDF OCR with ChromaDB",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from all pages of a PDF file using Tesseract OCR.
    Args:
        pdf_path (str): The file path to the PDF.
    Returns:
        str: The extracted text from the entire PDF, with page separators.
             Returns an error message if the file is not found or another error occurs.
    """
    # Check if the PDF file exists
    if not os.path.exists(pdf_path):
        return f"Error: The file '{pdf_path}' was not found."
   
    st.info(f"🔄 Starting OCR process for: {os.path.basename(pdf_path)}")
   
    # --- Troubleshooting Section ---
    # If Tesseract is not in your system's PATH, uncomment the following line
    # and provide the full path to the tesseract.exe file.
    # On Windows, it might be:
    # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    # On Linux, it's often already in the path, but could be:
    # pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'
   
    try:
        # Convert PDF pages to a list of PIL Image objects.
        # For Windows, you might need to specify the poppler path if it's not in your PATH.
        # e.g., pages = convert_from_path(pdf_path, poppler_path=r'C:\path\to\poppler-xx\bin')
        pages = convert_from_path(pdf_path)
        full_text = ""
       
        # Create a progress bar
        progress_bar = st.progress(0)
        status_text = st.empty()
       
        # Iterate through each page image
        for i, page_image in enumerate(pages):
            status_text.text(f"Processing page {i + 1}/{len(pages)}...")
            progress_bar.progress((i + 1) / len(pages))
           
            # Use Tesseract to perform OCR on the image
            text = pytesseract.image_to_string(page_image)
            # Append the extracted text and a page separator to the full text
            full_text += f"\n\n--- Page {i + 1} ---\n\n{text}"
       
        status_text.text("✅ OCR process completed successfully!")
        return full_text
    except Exception as e:
        return f"An error occurred during the OCR process: {e}"

@st.cache_resource
def setup_chromadb(chromadb_path):
    """
    Initialize ChromaDB client and collection.
    Args:
        chromadb_path (str): Path to ChromaDB data directory.
    Returns:
        tuple: (client, collection) ChromaDB client and collection objects.
    """
    try:
        # Initialize ChromaDB client with persistent storage
        client = chromadb.PersistentClient(path=chromadb_path)
       
        # Get or create a collection for PDF documents
        collection = client.get_or_create_collection(
            name="pdf_documents",
            metadata={"description": "Collection for storing OCR extracted text from PDF documents"}
        )
       
        st.success(f"✅ ChromaDB initialized successfully at: {chromadb_path}")
        return client, collection
    except Exception as e:
        st.error(f"❌ Error initializing ChromaDB: {e}")
        return None, None

def store_in_chromadb(collection, pdf_path, extracted_text, filename):
    """
    Store the extracted text in ChromaDB.
    Args:
        collection: ChromaDB collection object.
        pdf_path (str): Path to the PDF file.
        extracted_text (str): The extracted text from the PDF.
        filename (str): Original filename of the PDF.
    """
    try:
        # Create a unique ID for the document using file path hash
        file_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        doc_id = f"pdf_{file_hash}"
       
        # Prepare metadata
        metadata = {
            "filename": filename,
            "file_path": pdf_path,
            "processed_date": datetime.now().isoformat(),
            "file_size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
        }
       
        # Store the document in ChromaDB
        collection.upsert(
            documents=[extracted_text],
            metadatas=[metadata],
            ids=[doc_id]
        )
       
        st.success(f"✅ Document stored in ChromaDB with ID: {doc_id}")
        st.info(f"📊 Collection now contains {collection.count()} documents")
       
        return doc_id
       
    except Exception as e:
        st.error(f"❌ Error storing document in ChromaDB: {e}")
        return None

def search_chromadb(collection, query, n_results=5):
    """
    Search for documents in ChromaDB.
    Args:
        collection: ChromaDB collection object.
        query (str): Search query.
        n_results (int): Number of results to return.
    Returns:
        dict: Search results from ChromaDB.
    """
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results
    except Exception as e:
        st.error(f"❌ Error searching ChromaDB: {e}")
        return None

def display_search_results(results):
    """
    Display search results in a formatted way.
    Args:
        results (dict): Search results from ChromaDB.
    """
    if results and results['documents'][0]:
        st.subheader("🔍 Search Results")
       
        for i, (doc, metadata, distance) in enumerate(zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        )):
            with st.expander(f"📄 Result {i+1}: {metadata['filename']} (Score: {1-distance:.3f})"):
                st.write(f"**Filename:** {metadata['filename']}")
                st.write(f"**Processed Date:** {metadata['processed_date']}")
                st.write(f"**File Size:** {metadata['file_size']} bytes")
                st.write("**Content Preview:**")
                # Show first 500 characters
                preview = doc[:500] + "..." if len(doc) > 500 else doc
                st.text_area("", preview, height=150, key=f"result_{i}")
    else:
        st.warning("🔍 No results found for your query.")

# Main Streamlit App
def main():
    st.title("📄 PDF OCR with ChromaDB Integration")
    st.markdown("---")
   
    # Sidebar for configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
       
        # ChromaDB path configuration
        chromadb_path = st.text_input(
            "ChromaDB Path",
            value="D:/LDRP ITR/backend/chromadb_data",
            help="Path where ChromaDB data will be stored"
        )
       
        # Tesseract configuration (optional)
        st.subheader("Tesseract Configuration (Optional)")
        tesseract_cmd = st.text_input(
            "Tesseract Command Path",
            placeholder="Leave empty if tesseract is in PATH",
            help="Full path to tesseract.exe if not in system PATH"
        )
       
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            st.success("✅ Tesseract path set!")
   
    # Initialize ChromaDB
    if chromadb_path:
        client, collection = setup_chromadb(chromadb_path)
    else:
        st.error("❌ Please provide a ChromaDB path in the sidebar.")
        return
   
    # Create tabs for different functionalities
    tab1, tab2, tab3 = st.tabs(["📤 Upload & Process", "🔍 Search Documents", "📊 View Collection"])
   
    with tab1:
        st.header("📤 Upload and Process PDF")
       
        # File upload option
        uploaded_file = st.file_uploader(
            "Choose a PDF file",
            type="pdf",
            help="Upload a PDF file to extract text using OCR"
        )
       
        # Or file path input (keeping your original functionality)
        st.markdown("**OR**")
        pdf_path = st.text_input(
            "Enter PDF file path",
            value="C:/Users/HENY/Downloads/SiH2025H/backend/uploads/2022-26/computer_engineering/Semester 1/GeneralInformation/Mihir_s_Resume (1).pdf",
            help="Full path to the PDF file on your system"
        )
       
        if st.button("🚀 Process PDF", type="primary"):
            if collection is None:
                st.error("❌ ChromaDB not available. Please check your configuration.")
                return
           
            # Determine which input to use
            if uploaded_file is not None:
                # Save uploaded file to temporary location
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                    tmp_file.write(uploaded_file.getvalue())
                    temp_pdf_path = tmp_file.name
               
                current_pdf_path = temp_pdf_path
                filename = uploaded_file.name
            elif pdf_path and os.path.exists(pdf_path):
                current_pdf_path = pdf_path
                filename = os.path.basename(pdf_path)
            else:
                st.error("❌ Please upload a file or provide a valid file path.")
                return
           
            # Extract text
            with st.spinner("🔄 Extracting text from PDF..."):
                extracted_text = extract_text_from_pdf(current_pdf_path)
           
            # Display results
            if not extracted_text.startswith("Error:") and not extracted_text.startswith("An error occurred"):
                st.subheader("📄 Extracted Text")
               
                # Display text in expandable sections by page
                pages = extracted_text.split("--- Page ")
                for i, page_content in enumerate(pages[1:], 1):  # Skip empty first element
                    with st.expander(f"📄 Page {i}"):
                        st.text_area(f"Page {i} Content", page_content, height=200, key=f"page_{i}")
               
                # Store in ChromaDB
                st.subheader("💾 Storing in ChromaDB")
                with st.spinner("🔄 Storing document in ChromaDB..."):
                    doc_id = store_in_chromadb(collection, current_pdf_path, extracted_text, filename)
               
                if doc_id:
                    st.balloons()
               
                # Clean up temporary file if used
                if uploaded_file is not None and os.path.exists(temp_pdf_path):
                    os.unlink(temp_pdf_path)
            else:
                st.error(f"❌ {extracted_text}")
   
    with tab2:
        st.header("🔍 Search Documents")
       
        if collection is None:
            st.error("❌ ChromaDB not available. Please check your configuration.")
            return
       
        search_query = st.text_input(
            "Enter search query",
            placeholder="e.g., 'python programming', 'machine learning', 'resume'"
        )
       
        col1, col2 = st.columns([3, 1])
        with col1:
            n_results = st.slider("Number of results", 1, 10, 5)
       
        if st.button("🔍 Search", type="primary") and search_query:
            with st.spinner("🔄 Searching documents..."):
                results = search_chromadb(collection, search_query, n_results)
           
            if results:
                display_search_results(results)
       
        if not search_query and st.button("🔍 Search"):
            st.warning("⚠️ Please enter a search query.")
   
    with tab3:
        st.header("📊 Collection Overview")
       
        if collection is None:
            st.error("❌ ChromaDB not available. Please check your configuration.")
            return
       
        if st.button("🔄 Refresh Collection Info"):
            try:
                # Get collection info
                count = collection.count()
                st.metric("📄 Total Documents", count)
               
                if count > 0:
                    # Get all documents (limited to first 100 for performance)
                    all_docs = collection.get(limit=min(100, count))
                   
                    # Create a DataFrame for better display
                    df_data = []
                    for i, (doc_id, metadata) in enumerate(zip(all_docs['ids'], all_docs['metadatas'])):
                        df_data.append({
                            'ID': doc_id,
                            'Filename': metadata.get('filename', 'N/A'),
                            'Processed Date': metadata.get('processed_date', 'N/A'),
                            'File Size': f"{metadata.get('file_size', 0)} bytes"
                        })
                   
                    df = pd.DataFrame(df_data)
                    st.subheader("📋 Documents in Collection")
                    st.dataframe(df, use_container_width=True)
                   
                    # Option to clear collection
                    st.subheader("⚠️ Danger Zone")
                    if st.button("🗑️ Clear All Documents", type="secondary"):
                        if st.button("✅ Confirm Clear Collection"):
                            collection.delete(ids=all_docs['ids'])
                            st.success("🗑️ Collection cleared!")
                            st.experimental_rerun()
                else:
                    st.info("📭 No documents in the collection yet.")
                   
            except Exception as e:
                st.error(f"❌ Error getting collection info: {e}")

if __name__ == "__main__":
    main()