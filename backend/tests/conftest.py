import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

import anyio
import fastapi.dependencies.utils
import fastapi.routing
import httpx
import pytest
import starlette.concurrency
from fastapi import FastAPI
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList
from sqlalchemy.sql import operators


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("MAIL_USERNAME", "test@example.com")
os.environ.setdefault("MAIL_PASSWORD", "test-password")
os.environ.setdefault("MAIL_FROM", "test@example.com")
os.environ.setdefault("MAIL_SERVER", "localhost")


def utc_now():
    return datetime.now(timezone.utc)


class LocalASGIClient:
    def __init__(self, app):
        self.app = app

    def request(self, method, url, **kwargs):
        async def send_request():
            transport = httpx.ASGITransport(app=self.app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                return await client.request(method, url, **kwargs)

        return anyio.run(send_request)

    def get(self, url, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url, **kwargs):
        return self.request("POST", url, **kwargs)

    def patch(self, url, **kwargs):
        return self.request("PATCH", url, **kwargs)

    def delete(self, url, **kwargs):
        return self.request("DELETE", url, **kwargs)


class FakeQuery:
    def __init__(self, db, target):
        self.db = db
        self.target = target
        self.filters = []
        self.limit_value = None
        self.descending = False

    def filter(self, *expressions):
        self.filters.extend(expressions)
        return self

    def order_by(self, expression):
        self.descending = "DESC" in str(expression).upper()
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def first(self):
        results = self.all()
        return results[0] if results else None

    def all(self):
        rows = list(self.db.rows_for(self.target))
        rows = [row for row in rows if all(self.matches(row, expr) for expr in self.filters)]

        if rows and hasattr(rows[0], "created_at"):
            rows.sort(key=lambda row: row.created_at or datetime.min, reverse=self.descending)

        if self.limit_value is not None:
            rows = rows[: self.limit_value]

        return rows

    def scalar(self):
        target = str(self.target)
        if "count" in target:
            if "users.id" in target:
                return len(self.db.users)
            if "documents.id" in target:
                return len(self.db.documents)
            if "conversation_sessions.id" in target:
                return len(self.db.sessions)
        if "sum" in target and "token_usage.total_tokens" in target:
            return sum(record.total_tokens for record in self.db.token_usage)
        return None

    def delete(self):
        rows = self.all()
        self.db.delete_rows(self.target, rows)
        return len(rows)

    def matches(self, row, expression):
        if isinstance(expression, BooleanClauseList):
            return all(self.matches(row, child) for child in expression.clauses)

        if not isinstance(expression, BinaryExpression):
            return True

        key = expression.left.key
        left = getattr(row, key)
        right = getattr(expression.right, "value", expression.right)

        if expression.operator is operators.eq:
            return str(left) == str(right)
        if expression.operator is operators.gt:
            return left > right

        return True


class FakeDB:
    def __init__(self, models):
        self.models = models
        self.users = []
        self.documents = []
        self.sessions = []
        self.messages = []
        self.token_usage = []

    def query(self, target):
        return FakeQuery(self, target)

    def add(self, row):
        self.apply_defaults(row)
        collection = self.collection_for(type(row))
        if row not in collection:
            collection.append(row)

    def commit(self):
        return None

    def refresh(self, row):
        self.apply_defaults(row)

    def rows_for(self, target):
        return self.collection_for(target) if isinstance(target, type) else []

    def delete(self, row):
        self.delete_rows(type(row), [row])

    def delete_rows(self, target, rows):
        collection = self.collection_for(target)
        for row in rows:
            if row in collection:
                collection.remove(row)

    def collection_for(self, target):
        if target is self.models.User:
            return self.users
        if target is self.models.Document:
            return self.documents
        if target is self.models.ConversationSession:
            return self.sessions
        if target is self.models.ChatMessage:
            return self.messages
        if target is self.models.TokenUsage:
            return self.token_usage
        return []

    def apply_defaults(self, row):
        if getattr(row, "id", None) is None:
            row.id = uuid.uuid4()

        if hasattr(row, "created_at") and row.created_at is None:
            row.created_at = utc_now()

        if isinstance(row, self.models.User):
            if row.is_verified is None:
                row.is_verified = False
            if row.is_admin is None:
                row.is_admin = False
            # ensure new settings fields exist with defaults
            if getattr(row, "security_alerts_enabled", None) is None:
                row.security_alerts_enabled = True
            if getattr(row, "model", None) is None:
                row.model = "llama-3.1-8b-instant"
            if getattr(row, "temperature", None) is None:
                row.temperature = 0.3
            if getattr(row, "top_k", None) is None:
                row.top_k = 5
            if getattr(row, "chunk_size", None) is None:
                row.chunk_size = 800

        if isinstance(row, self.models.Document):
            if row.status is None:
                row.status = "processing"
            if row.chunk_count is None:
                row.chunk_count = 0

        if isinstance(row, self.models.ConversationSession):
            if row.title is None:
                row.title = "New Conversation"
            if row.updated_at is None:
                row.updated_at = row.created_at or utc_now()

        if isinstance(row, self.models.TokenUsage):
            row.prompt_tokens = row.prompt_tokens or 0
            row.answer_tokens = row.answer_tokens or 0
            row.total_tokens = row.total_tokens or 0


@pytest.fixture()
def api_context(monkeypatch, tmp_path):
    from app import models
    from app import auth as auth_module
    from app.database import get_db
    from passlib.context import CryptContext

    monkeypatch.setattr(
        auth_module,
        "pwd_context",
        CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=4),
    )
    async def run_inline(func, *args, **kwargs):
        return func(*args, **kwargs)

    monkeypatch.setattr(fastapi.routing, "run_in_threadpool", run_inline)
    monkeypatch.setattr(fastapi.dependencies.utils, "run_in_threadpool", run_inline)
    monkeypatch.setattr(starlette.concurrency, "run_in_threadpool", run_inline)
    hash_password = auth_module.hash_password

    service_stubs = SimpleNamespace(
        store_document=lambda **kwargs: 2,
        delete_document_chunks=lambda document_id: None,
        retrieve_chunks=lambda query, user_id, k=8, initial_k=8: ([], []),
    )
    llm_stub = SimpleNamespace(
        generate_answer=lambda question, context_chunks, history=None, model=None, temperature=None: {
            "answer": f"Answer for: {question}",
            "prompt_tokens": 10,
            "answer_tokens": 5,
            "total_tokens": 15,
        },
        get_groq_limits=lambda: {"requests_per_minute": 30},
    )
    reranker_stub = SimpleNamespace(
        rerank=lambda query, chunks, doc_ids, top_k=4: (chunks[:top_k], doc_ids[:top_k]),
    )
    monkeypatch.setitem(sys.modules, "app.services.vectorstore", service_stubs)
    monkeypatch.setitem(sys.modules, "app.services.llm", llm_stub)
    monkeypatch.setitem(sys.modules, "app.services.reranker", reranker_stub)

    from app.routers import auth, chat, documents

    db = FakeDB(models)
    user = models.User(
        id=uuid.uuid4(),
        email="verified@example.com",
        password=hash_password("StrongPass1"),
        is_verified=True,
        is_admin=False,
        created_at=utc_now(),
    )
    admin = models.User(
        id=uuid.uuid4(),
        email="admin@example.com",
        password=hash_password("StrongPass1"),
        is_verified=True,
        is_admin=True,
        created_at=utc_now(),
    )
    unverified = models.User(
        id=uuid.uuid4(),
        email="unverified@example.com",
        password=hash_password("StrongPass1"),
        is_verified=False,
        is_admin=False,
        verification_token="verify-token",
        created_at=utc_now(),
    )
    reset_user = models.User(
        id=uuid.uuid4(),
        email="reset@example.com",
        password=hash_password("StrongPass1"),
        is_verified=True,
        reset_token="reset-token",
        reset_token_expires=utc_now() + timedelta(hours=1),
        created_at=utc_now(),
    )

    for row in [user, admin, unverified, reset_user]:
        db.add(row)

    uploaded_files = tmp_path / "uploads"
    uploaded_files.mkdir()
    monkeypatch.setattr(documents, "UPLOAD_DIR", str(uploaded_files))
    monkeypatch.setattr(documents, "store_document", lambda **kwargs: 2)
    deleted_chunks = []
    monkeypatch.setattr(documents, "delete_document_chunks", lambda document_id: deleted_chunks.append(document_id))

    sent_emails = []

    async def fake_send_email(email, token):
        sent_emails.append((email, token))

    monkeypatch.setattr(auth, "send_verification_email", fake_send_email)
    monkeypatch.setattr(auth, "send_password_reset_email", fake_send_email)

    retrieval_calls = []

    def fake_retrieve_chunks(query, user_id, k=8):
        retrieval_calls.append((query, user_id, k))
        return ["retrieved context"], [str(db.documents[0].id)] if db.documents else []

    monkeypatch.setattr(chat, "retrieve_chunks", fake_retrieve_chunks)
    monkeypatch.setattr(chat, "rerank", lambda query, chunks, doc_ids, top_k=4: (chunks[:top_k], doc_ids[:top_k]))
    monkeypatch.setattr(
        chat,
        "generate_answer",
        lambda question, context_chunks, history=None: {
            "answer": f"Answer for: {question}",
            "prompt_tokens": 10,
            "answer_tokens": 5,
            "total_tokens": 15,
        },
    )
    monkeypatch.setattr(chat, "get_groq_limits", lambda: {"requests_per_minute": 30})

    app = FastAPI()
    app.state.limiter = chat.limiter
    app.include_router(auth.router, prefix="/auth")
    app.include_router(documents.router, prefix="/documents")
    app.include_router(chat.router, prefix="/chat")
    app.dependency_overrides[get_db] = lambda: db

    return SimpleNamespace(
        app=app,
        client=LocalASGIClient(app),
        db=db,
        user=user,
        admin=admin,
        unverified=unverified,
        reset_user=reset_user,
        deleted_chunks=deleted_chunks,
        sent_emails=sent_emails,
        retrieval_calls=retrieval_calls,
        upload_dir=uploaded_files,
    )
