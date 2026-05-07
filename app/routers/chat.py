from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.vectorstore import retrieve_chunks
from app.services.llm import generate_answer
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/ask", response_model=schemas.ChatResponse)
@limiter.limit("20/minute")
async def ask(
    request: Request,
    body: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    chunks, doc_ids = retrieve_chunks(
        query=body.question,
        user_id=str(current_user.id),
        k=4
    )

    sources = []
    seen = set()
    for doc_id in doc_ids:
        if doc_id and doc_id not in seen:
            doc = db.query(models.Document).filter(
                models.Document.id == doc_id
            ).first()
            if doc:
                sources.append(doc.filename)
                seen.add(doc_id)

    recent_history = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.desc()).limit(4).all()

    history = [
        {"question": m.question, "answer": m.answer}
        for m in reversed(recent_history)
    ]

    answer = generate_answer(
        question=body.question,
        context_chunks=chunks,
        history=history
    )

    message = models.ChatMessage(
        id=uuid.uuid4(),
        user_id=current_user.id,
        question=body.question,
        answer=answer
    )
    db.add(message)
    db.commit()

    return schemas.ChatResponse(
        answer=answer,
        sources=sources if sources else []
    )

@router.get("/history", response_model=schemas.ChatHistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.desc()).all()

    return schemas.ChatHistoryResponse(
        messages=messages,
        total=len(messages)
    )

@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}