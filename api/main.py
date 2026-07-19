import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pydantic import BaseModel
import pdfplumber
import json
from rag.retriever import load_retriever
from rag.qa_chain import load_llm, build_rag_chain, get_answer
from config import DISCLAIMER, PROJECT_NAME, TAGLINE


# ─────────────────────────────────────────
# STARTUP — Load models once
# ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting LexHub API...")
    print("Loading retriever...")
    app.state.retriever = load_retriever()
    print("Loading LLM...")
    app.state.llm = load_llm()
    print("Building RAG chain...")
    app.state.chain = build_rag_chain(
        app.state.retriever,
        app.state.llm
    )
    print("LexHub API ready!")
    yield
    print("Shutting down LexHub API...")


# ─────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────
app = FastAPI(
    title=f"{PROJECT_NAME} API",
    description=TAGLINE,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────
class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    disclaimer: str
    status: str


# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": PROJECT_NAME,
        "tagline": TAGLINE
    }


@app.post("/api/question", response_model=QuestionResponse)
async def answer_question(req: QuestionRequest, request_obj:__import__('fastapi').Request):
    if not req.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    if len(req.question.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="Question too short. Please be more specific."
        )

    if len(req.question) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Question too long. Please keep it under 1000 characters."
        )

    try:
        chain = request_obj.app.state.chain
        answer = get_answer(chain, req.question)
        return QuestionResponse(
            answer=answer,
            disclaimer=DISCLAIMER,
            status="success"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Service temporarily unavailable. Please try again."
        )


@app.post("/api/summarize")
async def summarize_document(request_obj: __import__('fastapi').Request, file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading PDF file.")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
    prompt = f"""You are a legal document summarizer. Summarize the following document in plain English.
Extract the document type, a summary, and actionable steps.
Return the output EXACTLY as a JSON object with this structure:
{{
  "document_type": "Type of Document (e.g. Non-Disclosure Agreement)",
  "summary": "Detailed plain English summary paragraph",
  "action_items": ["Step 1", "Step 2", "Step 3"],
  "disclaimer": "{DISCLAIMER}"
}}

Document Text:
{text[:4000]}
"""
    try:
        llm = request_obj.app.state.llm if request_obj else None
        if llm:
            response = llm.invoke(prompt)
            content = response.content
            # Extract JSON from potential markdown blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        else:
            raise Exception("LLM not loaded")
    except Exception as e:
        print("Error in summarization:", e)
        raise HTTPException(status_code=500, detail="Error generating summary.")


@app.post("/api/analyze-contract")
async def analyze_contract(request_obj: __import__('fastapi').Request, file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error reading PDF file.")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
    prompt = f"""You are a legal contract analyzer. Analyze the following contract clauses.
Identify key clauses and assign a risk level (Safe, Risky, Potentially Illegal).
Provide a plain English explanation and a confidence score between 0 and 100.
Also determine the overall risk score (0-100) and risk level (Low, Medium, High).
Return the output EXACTLY as a JSON object with this structure:
{{
  "risk_score": 75,
  "risk_level": "Medium",
  "total_clauses": 3,
  "clauses": [
    {{
      "clause": "Text of the clause",
      "label": "Safe" | "Risky" | "Potentially Illegal",
      "confidence": 95.5,
      "explanation": "Why this is safe/risky"
    }}
  ]
}}

Contract Text:
{text[:4000]}
"""
    try:
        llm = request_obj.app.state.llm if request_obj else None
        if llm:
            response = llm.invoke(prompt)
            content = response.content
            # Extract JSON from potential markdown blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        else:
            raise Exception("LLM not loaded")
    except Exception as e:
        print("Error in contract analysis:", e)
        raise HTTPException(status_code=500, detail="Error analyzing contract.")


# ─────────────────────────────────────────
# STATIC FILES (Must be at the end)
# ─────────────────────────────────────────
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")