from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.vectorstore import retrieve_chunks
from app.services.llm import generate_answer
import uuid

router = APIRouter()

@router.post("/ask", response_model=schemas.ChatResponse)
def ask(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    chunks = retrieve_chunks(
        query=request.question,
        user_id=str(current_user.id),
        k=4
    )

    recent_history = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.created_at.desc()).limit(4).all()

    history = [
        {"question": m.question, "answer": m.answer}
        for m in reversed(recent_history)
    ]

    answer = generate_answer(
        question=request.question,
        context_chunks=chunks,
        history=history
    )

    message = models.ChatMessage(
        id=uuid.uuid4(),
        user_id=current_user.id,
        question=request.question,
        answer=answer
    )
    db.add(message)
    db.commit()

    return schemas.ChatResponse(
        answer=answer,
        sources=[f"chunk {i+1}" for i in range(len(chunks))]
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