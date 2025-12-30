"""
SQLAlchemy ORM models for Neon Postgres database.

Models:
- User: User accounts with authentication credentials
- UserProfile: Extended user information (software/hardware background)
- RAGQuery: Logged RAG queries for analytics and improvement
- PersonalizationCache: Cached personalized content
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from src.db.database import Base


class SoftwareLevel(str, enum.Enum):
    """Software background levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class HardwareLevel(str, enum.Enum):
    """Hardware background levels."""
    NONE = "none"
    HOBBYIST = "hobbyist"
    PROFESSIONAL = "professional"


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # User background
    software_background = Column(SQLEnum(SoftwareLevel), default=SoftwareLevel.INTERMEDIATE)
    hardware_background = Column(SQLEnum(HardwareLevel), default=HardwareLevel.NONE)

    # Preferences
    prefer_urdu = Column(Boolean, default=False)
    personalization_enabled = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    rag_queries = relationship("RAGQuery", back_populates="user", cascade="all, delete-orphan")
    personalization_caches = relationship("PersonalizationCache", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class Session(Base):
    """User session model (for token management)."""

    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id})>"


class RAGQuery(Base):
    """Logged RAG queries for analytics and improvement."""

    __tablename__ = "rag_queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Query details
    query = Column(Text, nullable=False)
    mode = Column(String(50), nullable=False)  # "full-book" or "selected-text"
    selected_text = Column(Text, nullable=True)

    # Response
    answer = Column(Text, nullable=True)
    chunks_retrieved = Column(Integer, nullable=True)
    confidence = Column(Integer, nullable=True)  # 0-100

    # Metadata
    sources = Column(JSONB, nullable=True)  # List of chapter/section references
    latency_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    cost_usd = Column(Integer, nullable=True)  # In cents (to avoid floating point)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="rag_queries")

    def __repr__(self):
        return f"<RAGQuery(id={self.id}, mode={self.mode})>"


class PersonalizationCache(Base):
    """Cached personalized content (30-minute TTL)."""

    __tablename__ = "personalization_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Content identification
    chapter_id = Column(String(255), nullable=False, index=True)

    # Personalized content
    content = Column(Text, nullable=False)
    adaptations = Column(JSONB, nullable=True)  # List of Adaptation objects

    # Metadata
    software_level = Column(SQLEnum(SoftwareLevel))
    hardware_level = Column(SQLEnum(HardwareLevel))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="personalization_caches")

    def __repr__(self):
        return f"<PersonalizationCache(id={self.id}, chapter_id={self.chapter_id})>"
