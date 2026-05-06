# RAG Assistant

A multi-user RAG (Retrieval-Augmented Generation) system built with:
- FastAPI
- PostgreSQL + SQLAlchemy
- ChromaDB (vector store)
- sentence-transformers (local embeddings)
- Groq API (LLM)

## Setup
1. Clone the repo
2. Create a virtual environment and install dependencies
3. Copy .env.example to .env and fill in your values
4. Run with uvicorn app.main:app --reload
