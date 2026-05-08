from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.vectorstore import retrieve_chunks
from app.services.llm import generate_answer, get_groq_limits
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
from app.services.reranker import rerank
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
    if body.session_id:
        session = db.query(models.ConversationSession).filter(
            models.ConversationSession.id == body.session_id,
            models.ConversationSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
    else:
        session = models.ConversationSession(
            id=uuid.uuid4(),
            user_id=current_user.id,
            title=body.question[:50]
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    chunks, doc_ids = retrieve_chunks(
        query=body.question,
        user_id=str(current_user.id),
        k=8
    )

    chunks, doc_ids = rerank(
        query=body.question,
        chunks=chunks,
        doc_ids=doc_ids,
        top_k=4
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
        models.ChatMessage.session_id == session.id
    ).order_by(models.ChatMessage.created_at.desc()).limit(4).all()

    history = [
        {"question": m.question, "answer": m.answer}
        for m in reversed(recent_history)
    ]

    result = generate_answer(
        question=body.question,
        context_chunks=chunks,
        history=history
    )

    message = models.ChatMessage(
        id=uuid.uuid4(),
        user_id=current_user.id,
        session_id=session.id,
        question=body.question,
        answer=result["answer"]
    )
    db.add(message)

    token_record = models.TokenUsage(
        id=uuid.uuid4(),
        user_id=current_user.id,
        session_id=session.id,
        prompt_tokens=result["prompt_tokens"],
        answer_tokens=result["answer_tokens"],
        total_tokens=result["total_tokens"]
    )
    db.add(token_record)

    session.updated_at = datetime.utcnow()
    db.commit()

    return schemas.ChatResponse(
        answer=result["answer"],
        sources=sources if sources else [],
        tokens_used=result["total_tokens"]
    )

@router.get("/usage", response_model=schemas.TokenStatsResponse)
def get_usage(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    records = db.query(models.TokenUsage).filter(
        models.TokenUsage.user_id == current_user.id
    ).all()

    total_tokens = sum(r.total_tokens for r in records)
    total_requests = len(records)

    return schemas.TokenStatsResponse(
        total_tokens_used=total_tokens,
        total_requests=total_requests,
        groq_limits=get_groq_limits()
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