# RAG Assistant

A multi-user RAG (Retrieval-Augmented Generation) system built with:
## KnowLix (RAG Assistant)

AI assistant for private knowledge: upload documents, build embeddings, and chat with your content.

## What is KnowLix?

KnowLix is a Retrieval-Augmented Generation (RAG) assistant that allows users to upload documents and chat with them using AI-powered semantic search. It's designed for privacy-first use cases where you want to keep sensitive data local while benefiting from intelligent document querying and analysis.

The system combines document management, semantic embeddings, and an LLM interface to enable users to ask questions about their uploaded content and receive accurate, context-aware responses.

## Key Features

- **Document Upload & Management** — Users can upload text, PDF, Word, and PowerPoint documents
- **Semantic Search** — AI-powered embeddings enable intelligent document retrieval
- **Chat Interface** — Ask questions and receive AI-generated responses based on your documents
- **User Authentication** — Secure login and multi-user support
- **Private & Local** — Keep your data secure with local vector storage

## Repository Layout

- `backend/` — FastAPI application with routers, models, services, tests, and alembic migrations.
- `frontend/` — Next.js application (App Router) used for the UI.
- `chroma_db/` — Chroma vector DB files used by the application.
- `uploads/` — Example or persisted uploaded documents.
- `tests/` — Backend tests.

## Backend Technology Stack

**Framework:** FastAPI — Modern, fast Python web framework
**ORM:** SQLAlchemy — For database models and queries
**Authentication:** JWT tokens with bcrypt password hashing
**Embeddings:** sentence-transformers for local embedding generation
**LLM Integration:** Groq API for fast inference
**Rate Limiting:** slowapi for request throttling

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:

```
# Database
DATABASE_URL=sqlite:///./test_db.sqlite3

# JWT Auth
SECRET_KEY=your-secret-key-here        # Generate with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Groq AI
GROQ_API_KEY=your-groq-api-key         # From: console.groq.com

# Mail (Gmail example)
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password        # Gmail App Password (not account password)
MAIL_FROM=your@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587

# URLs (local dev)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000



```

To run the backend:

```bash
uvicorn app.main:app --reload
```

### API Endpoints

All endpoints require authentication with a valid JWT token in the Authorization header.

**Authentication Endpoints:**
- `POST /auth/register` — Create new user account
- `POST /auth/login` — Log in and receive JWT token
- `GET /auth/verify` — Verify email with token
- `POST /auth/resend-verification` — Resend verification email
- `POST /auth/forgot-password` — Request password reset
- `POST /auth/reset-password` — Reset password with token
- `GET /auth/me` — Get current user profile
- `PATCH /auth/me` — Update user profile and settings
- `DELETE /auth/me` — Delete user account and all data

**Admin Endpoints:**
- `GET /auth/admin/stats` — Get admin statistics (total users, documents, tokens)
- `GET /auth/admin/users` — List all users with stats
- `GET /auth/admin/users/{user_id}` — Get specific user details
- `DELETE /auth/admin/users/{user_id}` — Delete user account

**Document Endpoints:**
- `POST /documents/upload` — Upload a document (multipart/form-data: PDF, TXT, DOCX, PPTX)
- `GET /documents/` — Get user's documents
- `DELETE /documents/{document_id}` — Delete a document

**Chat Endpoints:**
- `POST /chat/ask` — Send a query and receive AI response (20 requests/minute limit)
- `GET /chat/usage` — Get token usage statistics
- `GET /chat/quota` — Get user quota information
- `GET /chat/history` — Get all chat messages
- `DELETE /chat/history` — Clear all chat history

Run tests:

```bash
pytest -q
```

## Frontend Technology Stack

**Framework:** Next.js 16 — React framework with app router
**Styling:** Tailwind CSS for responsive design
**Animation:** Framer Motion for smooth interactions
**Icons:** Lucide React for UI components
**UI Components:** Shadcn/ui and Radix UI primitives

### Installation

```bash
cd frontend
npm install
npm run dev
```

The frontend provides:
- Landing page with project overview
- User registration and login flows
- Document upload interface
- Interactive chat with documents
- Account and document management

## Databases & Authentication

**Relational Database (SQLite/PostgreSQL)** — Stores user accounts, document metadata, chat history, and application state. Migrations are managed with Alembic for version control.

**Vector Database (Chroma)** — Stores document embeddings for semantic search and retrieval. Enables fast, accurate matching of user queries to relevant document chunks.

**Authentication** — JWT-based token authentication with secure password hashing. Users register, log in, and receive auth tokens for subsequent API requests. Session management is handled server-side.

## Contributing

- Run unit tests before opening PRs.
- Keep environment secrets out of commits; use `.env` and `.env.example`.

## User Guide

### Getting Started
Visit the landing page and click "Get Started" to register a new account. Provide your email and password to create your account.

### Upload Documents
After logging in, navigate to the documents section and upload files (TXT, PDF, DOCX, PPTX). The system will process and create embeddings automatically.

### Chat with Documents
Go to the chat interface, select documents if needed, and ask questions about your content. The AI will search through embeddings and provide relevant answers.

### Manage Documents
View, organize, and delete documents from your library. Each document's metadata is displayed for easy reference.

## Where to Look in the Code

- Backend app root: `backend/app/main.py`
- Routers: `backend/app/routers/`
- Frontend entry: `frontend/app/page.tsx`
- Landing hero component: `frontend/components/landing/hero.tsx`
- Documentation page: `frontend/app/docs/page.tsx`

For the full interactive documentation with detailed sections, visit the `/docs` page in the application.