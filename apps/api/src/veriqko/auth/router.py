"""Authentication router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from veriqko.auth.jwt import create_access_token, verify_token
from veriqko.auth.schemas import (
    LoginRequest,
    LoginResponse,
    MFALoginRequest,
    MFASetupResponse,
    MFAVerifyRequest,
    RefreshRequest,
    RefreshResponse,
    UserResponse,
)
from veriqko.auth.service import AuthService
from veriqko.auth.mfa import generate_mfa_secret, get_mfa_uri, verify_mfa_code
from veriqko.config import get_settings
from veriqko.db.base import get_db
from veriqko.dependencies import get_current_user
from veriqko.users.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate user and return tokens."""
    auth_service = AuthService(db)
    user = await auth_service.authenticate(request.email, request.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.mfa_enabled:
        from veriqko.auth.jwt import create_mfa_token
        return LoginResponse(
            mfa_required=True,
            mfa_token=create_mfa_token(user.id),
        )

    tokens = auth_service.create_tokens(user)

    return LoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
    )

@router.post("/login/mfa", response_model=LoginResponse)
async def login_mfa(
    request: MFALoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify MFA token and TOTP code to complete login."""
    payload = verify_token(request.mfa_token, token_type="mfa_temp")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired MFA token")
        
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(payload.sub)
    
    if user is None or not user.is_active or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=401, detail="Invalid user state for MFA")
        
    if not verify_mfa_code(user.mfa_secret, request.code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")
        
    tokens = auth_service.create_tokens(user)

    return LoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
    )

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate MFA secret and provisioning URI."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    secret = generate_mfa_secret()
    current_user.mfa_secret = secret
    await db.commit()
    
    uri = get_mfa_uri(current_user, secret)
    return MFASetupResponse(secret=secret, uri=uri)

@router.post("/mfa/verify", response_model=UserResponse)
async def verify_mfa_setup(
    request: MFAVerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify TOTP code and enable MFA."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
        
    if not verify_mfa_code(current_user.mfa_secret, request.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")
        
    current_user.mfa_enabled = True
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Refresh access token using refresh token."""
    payload = verify_token(request.refresh_token, token_type="refresh")

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user still exists and is active
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(payload.sub)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    settings = get_settings()
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
    )

    return RefreshResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
    )
