"""
Personalization API routes.

Endpoints:
- POST /personalize: Generate personalized content based on user background
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
import structlog

from src.db.models import User, SoftwareLevel, HardwareLevel
from src.auth.security import get_current_active_user
from src.services.ai_service import ai_service

logger = structlog.get_logger()
router = APIRouter()


class PersonalizeRequest(BaseModel):
    """Personalization request."""
    chapter_id: str
    original_markdown: str


class Adaptation(BaseModel):
    """Content adaptation."""
    reason: str
    content_preview: str
    type: str  # "code_example", "explanation", "reference"


class PersonalizeResponse(BaseModel):
    """Personalization response."""
    chapter_id: str
    content: str
    summary: str
    adaptations: List[Adaptation]
    software_level: str
    hardware_level: str
    error: str | None = None


@router.post("", response_model=PersonalizeResponse)
async def personalize_content(
    request: PersonalizeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate personalized content based on user background.
    """
    logger.info(
        "Personalization requested",
        user_id=str(current_user.id),
        chapter_id=request.chapter_id,
        software=current_user.software_background,
        hardware=current_user.hardware_background
    )

    try:
        result = await ai_service.personalize_chapter(
            original_markdown=request.original_markdown,
            software_background=current_user.software_background,
            hardware_background=current_user.hardware_background
        )

        # Check if personalization actually happened (not fallback)
        if "adaptation error" in result["summary"].lower() or result["content"] == request.original_markdown:
            return PersonalizeResponse(
                chapter_id=request.chapter_id,
                content=result["content"],
                summary="Personalization service unavailable - showing original content",
                adaptations=[],
                software_level=current_user.software_background,
                hardware_level=current_user.hardware_background,
                error="AI personalization service temporarily unavailable"
            )

        return PersonalizeResponse(
            chapter_id=request.chapter_id,
            content=result["content"],
            summary=result["summary"],
            adaptations=[
                Adaptation(
                    reason=f"Adapted for {current_user.software_background} software and {current_user.hardware_background} hardware background.",
                    content_preview=result["content"][:100] + "...",
                    type="explanation"
                )
            ],
            software_level=current_user.software_background,
            hardware_level=current_user.hardware_background
        )

    except Exception as e:
        logger.error("Personalization endpoint error", error=str(e))
        # Return original content with clear error instead of failing
        return PersonalizeResponse(
            chapter_id=request.chapter_id,
            content=request.original_markdown,
            summary="Original content (personalization failed)",
            adaptations=[],
            software_level=current_user.software_background,
            hardware_level=current_user.hardware_background,
            error=str(e)
        )
