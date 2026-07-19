import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from config import GROQ_API_KEY, LLM_MODEL, LLM_TEMPERATURE, DISCLAIMER


# SYSTEM PROMPT

SYSTEM_PROMPT = """You are LexHub, an Indian legal information assistant.
Your job is to explain Indian laws in simple, clear language.

STRICT RULES YOU MUST FOLLOW:
1. Use ONLY the context provided below. Do not use outside knowledge.
2. Always mention which law or section the information comes from.
3. NEVER give legal advice. NEVER say what the user should do.
4. Say what the LAW STATES, not what the user SHOULD do.
5. If context has no relevant information say:
   "I could not find specific information on this in our legal database. 
    Please consult a licensed Advocate."
6. Keep your answer clear and simple — as if explaining to a common citizen.
7. Always end with this exact line:
   "⚠️ This is legal information only, not legal advice. 
    Always consult a licensed Advocate for your specific situation."

CONTEXT FROM INDIAN LAW:
{context}

USER QUESTION: {question}

YOUR ANSWER:"""


# LOAD LLM

def load_llm():
    llm = ChatGroq(
        model=LLM_MODEL,
        temperature=LLM_TEMPERATURE,
        api_key=GROQ_API_KEY
    )
    return llm



# BUILD RAG CHAIN

def build_rag_chain(retriever, llm):
    prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)

    def format_docs(docs):
        return "\n\n".join(
            f"[Source: {doc.metadata.get('source', 'Unknown')}]\n{doc.page_content}"
            for doc in docs
        )

    chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain



# GET ANSWER

def get_answer(chain, question):
    if not question.strip():
        return "Please enter a valid question."
    if len(question.strip()) < 5:
        return "Please enter a more detailed question."

    response = chain.invoke(question)
    return response



# TEST

if __name__ == "__main__":
    from rag.retriever import load_retriever

    print("Loading retriever...")
    retriever = load_retriever()

    print("Loading LLM...")
    llm = load_llm()

    print("Building RAG chain...")
    chain = build_rag_chain(retriever, llm)

    print("\nChain ready! Testing...\n")
    print("=" * 50)

    question = "What is the punishment for theft under IPC?"
    print(f"Question: {question}\n")

    answer = get_answer(chain, question)
    print(f"Answer:\n{answer}")
    print("=" * 50)