import os
from dotenv import load_dotenv

load_dotenv()

# Project
PROJECT_NAME        = "LexHub"
TAGLINE             = "Know your rights. Not legal advice."

# Paths
FAISS_INDEX_PATH    = "vector_store/faiss_index"
RAW_DATA_PATH       = "data/raw"
MODELS_PATH         = "models"

# Embedding
EMBEDDING_MODEL     = "sentence-transformers/all-MiniLM-L6-v2"

# LLM
GROQ_API_KEY        = os.getenv("GROQ_API_KEY")
LLM_MODEL           = LLM_MODEL = "llama-3.1-8b-instant"
LLM_TEMPERATURE     = 0.2

# Chunking
CHUNK_SIZE          = 500
CHUNK_OVERLAP       = 50
TOP_K_RESULTS       = 5

# Contract
CONTRACT_MODEL_PATH = "models/contract_model.pkl"
LABEL_ENCODER_PATH  = "models/label_encoder.pkl"

# Disclaimer
DISCLAIMER = (
    "⚠️ This is legal information only, not legal advice. "
    "Always consult a licensed Advocate for advice specific "
    "to your situation. Free legal aid: NALSA helpline 15100."
)