from sqlalchemy import Boolean, Column, String, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id                      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email                   = Column(String, unique=True, index=True, nullable=False)
    full_name               = Column(String, nullable=True)
    password                = Column(String, nullable=False)
    is_verified             = Column(Boolean, default=False, nullable=False)
    verification_token      = Column(String, nullable=True)
    reset_token             = Column(String, nullable=True)
    reset_token_expires     = Column(DateTime, nullable=True)
    is_admin                = Column(Boolean, default=False, nullable=False)
    security_alerts_enabled = Column(Boolean, default=True, nullable=False)
    model                   = Column(String, default="llama-3.1-8b-instant", nullable=False)
    temperature             = Column(Float, default=0.3, nullable=False)
    top_k                   = Column(Integer, default=5, nullable=False)
    chunk_size              = Column(Integer, default=800, nullable=False)
    created_at              = Column(DateTime, default=datetime.utcnow)

    documents   = relationship("Document", back_populates="owner")
    messages    = relationship("ChatMessage", back_populates="owner")
    sessions    = relationship("ConversationSession", back_populates="owner")
    token_usage = relationship("TokenUsage", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
    file_path   = Column(String, nullable=True)
    status      = Column(String, default="processing")
    chunk_count = Column(Integer, default=0)
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner       = relationship("User", back_populates="documents")


class ConversationSession(Base):
    __tablename__ = "conversation_sessions"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title       = Column(String, default="New Conversation")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner       = relationship("User", back_populates="sessions")
    messages    = relationship("ChatMessage", back_populates="session")
    token_usage = relationship("TokenUsage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id  = Column(UUID(as_uuid=True), ForeignKey("conversation_sessions.id"), nullable=False)
    question    = Column(Text, nullable=False)
    answer      = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner       = relationship("User", back_populates="messages")
    session     = relationship("ConversationSession", back_populates="messages")


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id     = Column(UUID(as_uuid=True), ForeignKey("conversation_sessions.id"), nullable=True)
    prompt_tokens  = Column(Integer, default=0)
    answer_tokens  = Column(Integer, default=0)
    total_tokens   = Column(Integer, default=0)
    created_at     = Column(DateTime, default=datetime.utcnow)

    owner          = relationship("User", back_populates="token_usage")
    session        = relationship("ConversationSession", back_populates="token_usage")
