from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String, unique=True, index=True, nullable=False)
    password   = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents  = relationship("Document", back_populates="owner")
    messages   = relationship("ChatMessage", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename   = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner      = relationship("User", back_populates="documents")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question   = Column(Text, nullable=False)
    answer     = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner      = relationship("User", back_populates="messages")