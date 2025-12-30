"""
Database connection and session management.

Uses async SQLAlchemy with asyncpg for Neon Postgres.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from src.config import settings
import structlog
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

logger = structlog.get_logger()

def prepare_database_url(url: str) -> str:
    """
    Cleans the database URL for asyncpg compatibility.
    Removes parameters like sslmode and channel_binding that asyncpg doesn't support.
    """
    if not url:
        return url

    # Replace driver
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Use urlparse to handle parameters
    parsed = urlparse(url)
    query = parse_qs(parsed.query)

    # List of parameters to remove
    unsupported = ["sslmode", "channel_binding"]
    for param in unsupported:
        query.pop(param, None)

    # Reconstruct URL without unsupported parameters
    new_query = urlencode(query, doseq=True)
    new_url = urlunparse(parsed._replace(query=new_query))

    return new_url

# Create async engine
engine = create_async_engine(
    prepare_database_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for ORM models
Base = declarative_base()


async def init_db():
    """Initialize database connection and create tables."""
    try:
        async with engine.begin() as conn:
            # Import models to register them
            from src.db import models

            # Create tables
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise


async def get_db() -> AsyncSession:
    """
    Dependency for getting database session.

    Usage:
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
