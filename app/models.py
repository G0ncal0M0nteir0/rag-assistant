from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email               = Column(String, unique=True, index=True, nullable=False)
    password            = Column(String, nullable=False)
    is_verified         = Column(String, default="false")
    verification_token  = Column(String, nullable=True)
    reset_token         = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    is_admin            = Column(String, default="false")
    created_at          = Column(DateTime, default=datetime.utcnow)

    documents   = relationship("Document", back_populates="owner")
    messages    = relationship("ChatMessage", back_populates="owner")
    sessions    = relationship("ConversationSession", back_populates="owner")
    token_usage = relationship("TokenUsage", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
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
