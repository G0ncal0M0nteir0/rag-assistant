from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: str
    is_verified: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenUsageOut(BaseModel):
    prompt_tokens: int
    answer_tokens: int
    total_tokens: int
    created_at: datetime
    class Config:
        from_attributes = True

class TokenStatsResponse(BaseModel):
    total_tokens_used: int
    total_requests: int
    groq_limits: dict

class DocumentOut(BaseModel):
    id: UUID
    filename: str
    status: str
    chunk_count: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []
    tokens_used: int = 0

class ChatMessageOut(BaseModel):
    id: UUID
    question: str
    answer: str
    created_at: datetime
    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageOut]
    total: int