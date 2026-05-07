from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base
from app import models
from app.routers import auth, documents, chat
from dotenv import load_dotenv
import os

load_dotenv()

required_env_vars = ["DATABASE_URL", "SECRET_KEY", "GROQ_API_KEY"]
for var in required_env_vars:
    if not os.getenv(var):
        raise RuntimeError(f"Missing required environment variable: {var}")

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="RAG Assistant")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."}
    )

app.include_router(auth.router,      prefix="/auth",      tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(chat.router,      prefix="/chat",      tags=["chat"])

@app.get("/")
def root():
    return {"status": "running"}