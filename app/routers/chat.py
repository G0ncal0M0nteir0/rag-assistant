from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.vectorstore import retrieve_chunks
from app.services.llm import generate_answer

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

    answer = generate_answer(
        question=request.question,
        context_chunks=chunks
    )

    return schemas.ChatResponse(
        answer=answer,
        sources=[f"chunk {i+1}" for i in range(len(chunks))]
    )