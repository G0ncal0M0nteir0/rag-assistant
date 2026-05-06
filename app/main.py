from fastapi import FastAPI
from app.database import engine, Base
from app import models
from app.routers import auth, documents, chat


Base.metadata.create_all(bind=engine)

app = FastAPI(title="RAG Assistant")

app.include_router(auth.router,      prefix="/auth",      tags=["auth"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(chat.router,      prefix="/chat",      tags=["chat"])

@app.get("/")
def root():
    return {"status": "running"}