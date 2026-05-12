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
4. Run database migrations from the backend folder:
   ```bash
   alembic upgrade head
   ```
5. Run the API from the backend folder:
   ```bash
   uvicorn app.main:app --reload
   ```
6. Run backend tests from the backend folder:
   ```bash
   pytest
   ```

frontend packages/libraris:
npx shadcn@latest init
npm install lucide-react framer-motion






curl -X POST "http://localhost:8000/auth/dev-make-admin?email=email@gmail.com"

Admin test
nespujakke@necub.com