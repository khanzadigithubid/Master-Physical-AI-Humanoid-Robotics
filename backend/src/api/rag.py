"""
RAG API routes.

Endpoints:
- POST /rag/query: Query the RAG system (full-book or selected-text mode)
- GET /rag/stats: Get RAG statistics (total chunks, query count)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog

from src.db.database import get_db
from src.db.models import User, RAGQuery
from src.auth.security import get_current_active_user
from src.services.rag_service import rag_service
from src.db.qdrant_client import qdrant_service

logger = structlog.get_logger()
router = APIRouter()


# Request/Response Models
class RAGQueryRequest(BaseModel):
    """RAG query request."""
    query: str = Field(..., min_length=1, max_length=500, description="User question")
    mode: str = Field(..., pattern="^(full-book|selected-text)$", description="Query mode")
    selected_text: Optional[str] = Field(None, max_length=5000, description="Selected text for context (selected-text mode)")
    chapter_id: Optional[str] = Field(None, description="Chapter ID for filtering (selected-text mode)")


class Citation(BaseModel):
    """Citation source."""
    chapter: str
    section: str
    score: float
    url: str


class RAGQueryResponse(BaseModel):
    """RAG query response."""
    answer: str
    sources: List[Citation]
    confidence: float
    mode: str
    cached: bool = False


class RAGStatsResponse(BaseModel):
    """RAG statistics."""
    total_chunks: int
    total_queries: int
    avg_confidence: Optional[float]


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Query the RAG system.

    Supports two modes:
    - full-book: Search entire textbook corpus
    - selected-text: Search within specific chapter/section

    Args:
        request: Query details
        current_user: Authenticated user
        db: Database session

    Returns:
        Answer with citations and confidence score
    """
    start_time = datetime.utcnow()

    logger.info(
        "RAG query received",
        user_id=str(current_user.id),
        mode=request.mode,
        query=request.query[:100]  # Log truncated query
    )

    try:
        # Step 1: Embed query
        query_vector = await rag_service.embed_query(request.query)

        # Step 2: Search vector store
        if request.mode == "full-book":
            chunks = await rag_service.search_full_book(query_vector)

        else:  # selected-text mode
            if not request.chapter_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="chapter_id required for selected-text mode"
                )

            chunks = await rag_service.search_selected_text(
                query_vector,
                chapter_filter=request.chapter_id
            )

        # Step 3: Check confidence
        confidence = rag_service.calculate_confidence(chunks)

        if confidence < 0.5:
            logger.warning("Low confidence RAG result", confidence=confidence)

            # Log query
            rag_query = RAGQuery(
                user_id=current_user.id,
                query=request.query,
                mode=request.mode,
                selected_text=request.selected_text,
                answer="I don't have enough information to answer this confidently. Try rephrasing your question or browsing the Table of Contents.",
                chunks_retrieved=len(chunks),
                confidence=int(confidence * 100),
                sources=None,
                latency_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )
            db.add(rag_query)
            await db.commit()

            return RAGQueryResponse(
                answer="I don't have enough information to answer this confidently. Try rephrasing your question or browsing the [Table of Contents](/docs).",
                sources=[],
                confidence=confidence,
                mode=request.mode
            )

        # Step 4: Build prompt and generate answer
        prompt = rag_service.build_prompt(request.query, chunks, request.mode)
        generation_result = await rag_service.generate_answer(prompt)

        # Step 5: Extract citations
        citations = rag_service.extract_citations(chunks)

        # Step 6: Log query
        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        rag_query = RAGQuery(
            user_id=current_user.id,
            query=request.query,
            mode=request.mode,
            selected_text=request.selected_text,
            answer=generation_result["answer"],
            chunks_retrieved=len(chunks),
            confidence=int(confidence * 100),
            sources=citations,  # Store as list of dicts (JSON serializable)
            latency_ms=latency_ms,
            tokens_used=generation_result["tokens_used"],
            cost_usd=int(generation_result["cost_usd"] * 100),  # Store in cents
        )

        db.add(rag_query)
        await db.commit()

        logger.info(
            "RAG query completed",
            user_id=str(current_user.id),
            mode=request.mode,
            confidence=confidence,
            latency_ms=latency_ms,
            cost_usd=f"${generation_result['cost_usd']:.4f}"
        )

        return RAGQueryResponse(
            answer=generation_result["answer"],
            sources=[Citation(**c) for c in citations],
            confidence=confidence,
            mode=request.mode
        )

    except Exception as e:
        logger.error("RAG query failed", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process query"
        )


@router.get("/stats", response_model=RAGStatsResponse)
async def get_rag_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get RAG statistics.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        Statistics about RAG usage
    """
    # Count total chunks in Qdrant
    total_chunks = await qdrant_service.count_chunks()

    # Count total queries (could add user-specific filtering)
    from sqlalchemy import func, select
    result = await db.execute(select(func.count(RAGQuery.id)))
    total_queries = result.scalar() or 0

    # Calculate average confidence
    result = await db.execute(select(func.avg(RAGQuery.confidence)))
    avg_confidence_raw = result.scalar()
    avg_confidence = float(avg_confidence_raw / 100) if avg_confidence_raw else None

    return RAGStatsResponse(
        total_chunks=total_chunks,
        total_queries=total_queries,
        avg_confidence=avg_confidence
    )
