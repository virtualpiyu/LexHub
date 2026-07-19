import os 
import sys
import pickle
from tqdm import tqdm
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter  
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    RAW_DATA_PATH,
    FAISS_INDEX_PATH,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP
)


#extract text from pdf files
def extract_text_from_pdf(pdf_path):
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                full_text += (page.extract_text() or "") + "\n"
    except Exception as e:
        print(f"Error occurred while extracting text from {pdf_path}: {e}")
    return full_text

#Now load All pdfs

def load_pdfs_from_directory(folder_path):
    pdf_texts = {}
    files= [f for f in os.listdir(folder_path) if f.endswith('.pdf')]

    if not files:
        print("No pdf found in/data/raw folder. Please add pdfs to the folder and rerun the script.")
        sys.exit(1)

    print(f"Found {len(files)}PDS (s):{files} ")
    for filename in files:
        path=os.path.join(folder_path, filename)
        text = extract_text_from_pdf(path)
        if text.strip():  # Check if the extracted text is not empty
            pdf_texts[filename] = text
            print(f"{filename} -> {len(text)} characters extracted.")
        else:
            print(f"No text extracted from {filename} (skipped)")

    return pdf_texts

# Now we clean the extracted text

def clean_text(raw_text):
    import re
    # Remove extra whitespace and newlines
    text =re.sub(r"\n{3,}", "\n\n", raw_text)  # Replace 3 or more newlines with 2
    text = re.sub(r"\s{2,}", " ", text)  # Replace
    #remove page numbers patterns like page 1 of 200" oe "1"
    text = re.sub(r'\bPage\s+\d+\s+of\s+\d+\b', '', text, flags=re.IGNORECASE)
    #remove null characters and wieard encodings
    text =text.replace('\x00', '').replace('\uf0b7', '')
    return text.strip()

#Now we split the cleaned text into chunks

def chunk_documents(pdf_texts):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )

    all_documents = []
    for filename, raw_text in pdf_texts.items():
        clean=clean_text(raw_text)
        chunks = splitter.split_text(clean)

        for i ,chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={"source": filename, 
                          "chunk_id": i
                          }
            )
            all_documents.append(doc)
        print(f"{filename} -> {len(chunks)} chunks created.")
    print(f"Total chunks created: {len(all_documents)}")
    return all_documents

#Build And save the FAISS index

def build_vector_store(documents):
    print(f"\n Loading embedding model: {EMBEDDING_MODEL}")
    print("    (First run downloads ~90mb — Please wait...)")

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    print(f"\n Building FAISS index for {len(documents)} chunks...")
    print("    This may take 5-10 minutes on First run.")

    vectorstore= FAISS.from_documents(
        tqdm(documents, desc="Embedding"),
        embeddings
    )

    os.makedirs(FAISS_INDEX_PATH, exist_ok=True)
    vectorstore.save_local(FAISS_INDEX_PATH)
    print(f"\n FAISS index saved to: {FAISS_INDEX_PATH}")
    return vectorstore


#main 

def main():
    print("="*50)
    print("  LecHub - Building Legal Knowledge Base")
    print("="*50)

    #load pdfs 
    print("\nSTEP 1: Loading PDFs...")
    pdf_texts =load_pdfs_from_directory(RAW_DATA_PATH)

    #Chunks documents 
    print("\nSTEP 2: Chunking documents...")
    documents = chunk_documents(pdf_texts)

    #Build FAISS vector store
    print("\nSTEP 3: Building FAISS vector store...")
    build_vector_store(documents)

    print("\n"+"="*50)
    print("   Knowledge base ready!")
    print("   Now you can run the RAG chatbot")
    print("="*50)

if __name__ == "__main__":
    main()