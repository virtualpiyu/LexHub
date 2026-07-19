# ⚖️ LexHub — AI Legal Aid for India

**Making legal understanding free, instant, and accessible for every citizen.**

---

## 🎯 The Problem

India has **1.5 crore+** pending court cases, just **3 lawyers per 10,000 people**, and legal consultation fees starting at **₹5,000/hour**. For roughly **80% of citizens**, understanding their own legal rights is out of reach — not because the law is unavailable, but because no one has made it usable.

**LexHub** closes that gap with an AI-powered legal assistant built specifically around Indian law.

---

## ✨ What LexHub Does

| Module | Status | Description |
|---|---|---|
| 🗣️ **Legal Q&A Chatbot** (RAG) | ✅ Live | Ask a real-world legal question and get a plain-English answer, with exact citations from the Constitution, IPC, and CrPC |
| 📄 **Contract Risk Analyzer** | 🚧 In progress | Upload a rental/employment/service contract and get each clause flagged Safe / Risky / Illegal, with a plain-English reason |
| 🔍 **Case Insight Analyzer** | 🗺️ Planned | Surfaces similar past cases and statistical patterns — *not* a win/loss predictor, since case outcomes are a judicial matter, not something a model should determine |
| 📑 **Judgment Summarizer** | 🗺️ Planned | Turns a lengthy court judgment, FIR, or notice into a short summary with a "what you need to do next" action list |

---

## 🏗️ Architecture

```
User Input (text / document)
        ↓
┌─────────────────────────────────────────┐
│           INGESTION LAYER               │
│  IPC · CrPC · Constitution · Bare Acts  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         VECTOR STORE (FAISS)            │
│  Chunked + Embedded Legal Documents     │
└────────────────┬────────────────────────┘
                 ↓
      ┌──────────┴──────────┐
      ↓                     ↓
┌──────────────┐    ┌──────────────────────┐
│  RAG Engine  │    │   ML Models Layer    │
│  LLM + Laws  │    │  Contract Analyzer   │
│  Legal Q&A   │    │  Case Insight        │
└──────┬───────┘    └──────────┬───────────┘
       └──────────┬────────────┘
                  ↓
       ┌──────────────────────┐
       │   Response Layer     │
       │  Plain English +     │
       │  Section citations   │
       └──────────────────────┘
```

### Contract Risk Analyzer pipeline (in progress)

```
Contract PDF uploaded
        ↓
Extract all clauses
        ↓
KMeans Clustering              ← unsupervised (clause type/group)
        ↓
Feature extraction per clause  ← word count, power words, cluster
        ↓                        label, penalty mentions, termination
                                  language
XGBoost Classifier              ← supervised (Safe / Risky / Illegal)
        ↓
Groq LLM explanation             ← generative (plain-English reason) ✅ done
        ↓
Risk score + results
```

---

## 🧠 Tech Stack

| Layer | Tools |
|---|---|
| LLM | Groq (Llama 3) / Gemini Flash API |
| RAG | LangChain + FAISS |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| ML Models | XGBoost, Scikit-learn |
| PDF Parsing | PyMuPDF / pdfplumber |
| Backend | FastAPI |
| Frontend | Streamlit / React |

---

## 📂 Repository Structure

```
LexHub/
├── api/            ← FastAPI backend
├── contract/       ← Contract Risk Analyzer module
├── data/           ← Legal text corpus, datasets
├── frontend/       ← User-facing app
├── models/         ← Trained model artifacts
├── notebooks/      ← EDA + model training
├── rag/            ← RAG ingestion, retriever, QA chain
├── vector_store/   ← FAISS embeddings index
├── .gitignore
├── config
└── requirement     ← Python dependencies
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/virtualpiyu/LexHub.git
cd LexHub

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirement

# Add your API keys to a .env file
# GROQ_API_KEY=your_key_here
# GEMINI_API_KEY=your_key_here

# Run the app
```

---

## 🗺️ Roadmap

- [x] Legal Q&A Chatbot (RAG) with frontend
- [x] Contract Risk Analyzer — Groq LLM explanation layer
- [ ] Contract Risk Analyzer — KMeans clustering + feature extraction
- [ ] Contract Risk Analyzer — XGBoost classifier
- [ ] Case Insight Analyzer (similar-case pattern analysis)
- [ ] Judgment Summarizer
- [ ] Deployment (Hugging Face Spaces / Render)

---

## ⚠️ Disclaimer

LexHub is an educational and informational tool. It does not provide legal advice, does not predict or guarantee case outcomes, and is not a substitute for consulting a licensed advocate. All case-related insights are statistical observations from past data, not a determination of any court's future decision.

---

## 👤 Author

**Piyush** — Data Science & Generative AI
