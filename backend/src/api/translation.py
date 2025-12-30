"""
Translation API routes.

Endpoints:
- POST /translate/urdu: Translate content to Urdu while preserving technical terms
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import structlog

from src.db.models import User
from src.auth.security import get_current_active_user
from src.services.ai_service import ai_service

logger = structlog.get_logger()
router = APIRouter()


class TranslateRequest(BaseModel):
    """Translation request."""
    chapter_id: str
    markdown_content: str
    target_language: str = "ur"


class TranslateResponse(BaseModel):
    """Translation response."""
    translated_markdown: str


@router.post("/urdu", response_model=TranslateResponse)
async def translate_to_urdu(
    request: TranslateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Translate content to Urdu while preserving technical terms.
    """
    logger.info(
        "Translation requested",
        user_id=str(current_user.id),
        chapter_id=request.chapter_id,
        content_length=len(request.markdown_content),
        target_language=request.target_language
    )

    translated_content = await ai_service.translate_to_urdu(content=request.markdown_content)

    return TranslateResponse(
        translated_markdown=translated_content
    )
