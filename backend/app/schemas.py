from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    security_alerts_enabled: Optional[bool] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    top_k: Optional[int] = None
    chunk_size: Optional[int] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: Optional[str]
    is_verified: bool
    is_admin: bool
    security_alerts_enabled: bool
    model: str
    temperature: float
    top_k: int
    chunk_size: int
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenUsageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    prompt_tokens: int
    answer_tokens: int
    total_tokens: int
    created_at: datetime

class TokenStatsResponse(BaseModel):
    total_tokens_used: int
    total_requests: int
    groq_limits: dict

class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    status: str
    chunk_count: int
    created_at: datetime

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []
    tokens_used: int = 0

class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question: str
    answer: str
    created_at: datetime

class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageOut]
    total: int


class ChatQuotaWindowResponse(BaseModel):
    window: str
    limit_requests: int
    limit_tokens: int
    used_requests: int
    used_tokens: int
    remaining_requests_global: int
    remaining_tokens_global: int
    registered_users: int
    active_users: int
    per_user_requests_allocated: int
    per_user_tokens_allocated: int
    user_used_requests: int
    user_used_tokens: int
    user_available_requests: int
    user_available_tokens: int


class ChatQuotaResponse(BaseModel):
    model: str
    minute: ChatQuotaWindowResponse
    day: ChatQuotaWindowResponse

class AdminStatsResponse(BaseModel):
    total_users: int
    total_documents: int
    total_tokens_consumed: int
    total_conversations: int

class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    is_verified: bool
    is_admin: bool
    created_at: datetime
    document_count: int
    conversation_count: int
    message_count: int
    token_usage_count: int

class AdminDeleteManyResponse(BaseModel):
    message: str
    deleted_users: int
    scope: str