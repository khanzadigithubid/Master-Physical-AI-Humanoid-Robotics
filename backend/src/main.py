"""
FastAPI Backend for Physical AI & Humanoid Robotics Platform

Main application entry point with middleware, CORS, and route registration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog

from src.api import auth, rag, personalization, translation
from src.db.database import init_db
from src.config import settings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Starting Physical AI Backend", version="1.0.0")

    # Initialize database connection pool
    await init_db()
    logger.info("Database initialized")

    # TODO: Initialize Qdrant client connection
    # TODO: Warm up AI models if needed

    yield

    # Shutdown
    logger.info("Shutting down Physical AI Backend")


# Create FastAPI app
app = FastAPI(
    title="Physical AI & Humanoid Robotics API",
    description="Backend API for AI-native textbook platform with RAG, personalization, and translation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Request ID Middleware
@app.middleware("http")
async def add_request_id(request, call_next):
    import uuid
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(personalization.router, prefix="/api/personalize", tags=["Personalization"])
app.include_router(translation.router, prefix="/api/translate", tags=["Translation"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint."""
    return {
        "message": "Physical AI & Humanoid Robotics API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Actual DB check
        "qdrant": "connected",    # TODO: Actual Qdrant check
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )
