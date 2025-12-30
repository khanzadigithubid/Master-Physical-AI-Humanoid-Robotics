"""
Authentication API routes.

Endpoints:
- POST /auth/signup: Create new user account
- POST /auth/signin: Authenticate user and return JWT token
- POST /auth/signout: Invalidate session (placeholder for better-auth)
- GET /auth/me: Get current user profile
- PUT /auth/profile: Update user profile (background preferences)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import timedelta
import structlog

from src.db.database import get_db
from src.db.models import User, SoftwareLevel, HardwareLevel
from src.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from src.config import settings

logger = structlog.get_logger()
router = APIRouter()


# Request/Response Models
class SignupRequest(BaseModel):
    """Signup request payload."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    software_background: SoftwareLevel = SoftwareLevel.INTERMEDIATE
    hardware_background: HardwareLevel = HardwareLevel.NONE


class SigninRequest(BaseModel):
    """Signin request payload."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserProfileResponse(BaseModel):
    """User profile response."""
    id: str
    email: str
    software_background: SoftwareLevel
    hardware_background: HardwareLevel
    prefer_urdu: bool
    personalization_enabled: bool


class UpdateProfileRequest(BaseModel):
    """Update profile request."""
    software_background: Optional[SoftwareLevel] = None
    hardware_background: Optional[HardwareLevel] = None
    prefer_urdu: Optional[bool] = None
    personalization_enabled: Optional[bool] = None


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create new user account.

    Args:
        request: Signup details (email, password, background)
        db: Database session

    Returns:
        JWT token and user info

    Raises:
        HTTPException 400: Email already registered
    """
    logger.info("Signup attempt", email=request.email)

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        logger.warning("Signup failed: email already exists", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        software_background=request.software_background,
        hardware_background=request.hardware_background,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("User created successfully", user_id=str(user.id), email=user.email)

    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        user_id=str(user.id),
        email=user.email
    )


@router.post("/signin", response_model=TokenResponse)
async def signin(
    request: SigninRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    Args:
        request: Signin credentials (email, password)
        db: Database session

    Returns:
        JWT token and user info

    Raises:
        HTTPException 401: Invalid credentials
    """
    logger.info("Signin attempt", email=request.email)

    # Fetch user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning("Signin failed: user not found", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not verify_password(request.password, user.hashed_password):
        logger.warning("Signin failed: incorrect password", email=request.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    logger.info("User authenticated successfully", user_id=str(user.id), email=user.email)

    # Generate access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        user_id=str(user.id),
        email=user.email
    )


@router.post("/signout")
async def signout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Sign out user (invalidate session).

    Note: In JWT-based auth, signout is handled client-side by discarding the token.
    This endpoint is a placeholder for better-auth integration or token blacklisting.
    """
    logger.info("User signed out", user_id=str(current_user.id))

    return {"message": "Signed out successfully"}


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user profile.

    Args:
        current_user: Authenticated user

    Returns:
        User profile information
    """
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        software_background=current_user.software_background,
        hardware_background=current_user.hardware_background,
        prefer_urdu=current_user.prefer_urdu,
        personalization_enabled=current_user.personalization_enabled,
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile.

    Args:
        request: Profile updates
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated user profile
    """
    logger.info("Updating user profile", user_id=str(current_user.id))

    # Update fields if provided
    if request.software_background is not None:
        current_user.software_background = request.software_background

    if request.hardware_background is not None:
        current_user.hardware_background = request.hardware_background

    if request.prefer_urdu is not None:
        current_user.prefer_urdu = request.prefer_urdu

    if request.personalization_enabled is not None:
        current_user.personalization_enabled = request.personalization_enabled

    await db.commit()
    await db.refresh(current_user)

    logger.info("Profile updated successfully", user_id=str(current_user.id))

    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        software_background=current_user.software_background,
        hardware_background=current_user.hardware_background,
        prefer_urdu=current_user.prefer_urdu,
        personalization_enabled=current_user.personalization_enabled,
    )
