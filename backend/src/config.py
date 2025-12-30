"""
Configuration management using Pydantic Settings.

Loads environment variables from .env file and provides type-safe configuration.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import List, Union, Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL connection URL")

    # Qdrant Vector Database
    QDRANT_URL: str = Field(..., description="Qdrant Cloud URL")
    QDRANT_API_KEY: str = Field(..., description="Qdrant API key")
    QDRANT_COLLECTION_NAME: str = Field(default="physical-ai-book", description="Qdrant collection name")

    # AI APIs
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API key")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API key")
    GOOGLE_API_KEY: Optional[str] = Field(default=None, description="Google AI API key")

    # Authentication
    SECRET_KEY: str = Field(..., min_length=32, description="JWT secret key")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=10080, description="Token expiration (7 days)")

    # Encryption
    ENCRYPTION_KEY: str = Field(..., description="Fernet encryption key")

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    # Server
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    RELOAD: bool = Field(default=False, description="Enable auto-reload in development")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # RAG Configuration
    EMBEDDING_MODEL: str = Field(default="text-embedding-004", description="Embedding model")
    EMBEDDING_DIMENSION: int = Field(default=768, description="Embedding vector dimension (768 for Gemini, 1536 for OpenAI)")
    RAG_TOP_K: int = Field(default=5, description="Number of chunks to retrieve")
    RAG_SCORE_THRESHOLD: float = Field(default=0.7, description="Minimum similarity score")

    # AI Model Configuration
    GPT_MODEL: str = Field(default="gpt-4", description="OpenAI chat model")
    CLAUDE_MODEL: str = Field(default="claude-3-5-sonnet-20241022", description="Anthropic model")


# Global settings instance
settings = Settings()
