import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from config import FAISS_INDEX_PATH, EMBEDDING_MODEL, TOP_K_RESULTS

def load_retriever():
    print("Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    print("Loading FAISS index...")
    vectorstore = FAISS.load_local(
        FAISS_INDEX_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": TOP_K_RESULTS}
    )

    print("Retriever ready!")
    return retriever


if __name__ == "__main__":
    retriever = load_retriever()
    results = retriever.invoke("What is bail under CrPC?")
    print(f"\nFound {len(results)} relevant chunks:")
    for i, doc in enumerate(results):
        print(f"\n--- Chunk {i+1} ---")
        print(f"Source: {doc.metadata['source']}")
        print(doc.page_content[:200])