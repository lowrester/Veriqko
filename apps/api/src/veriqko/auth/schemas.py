"""Authentication schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response schema."""

    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None
    mfa_required: bool = False
    mfa_token: str | None = None


class MFASetupResponse(BaseModel):
    """MFA setup response schema."""

    secret: str
    uri: str


class MFAVerifyRequest(BaseModel):
    """MFA verify request schema."""

    code: str


class MFALoginRequest(BaseModel):
    """MFA login request schema."""

    mfa_token: str
    code: str


class RefreshRequest(BaseModel):
    """Token refresh request schema."""

    refresh_token: str


class RefreshResponse(BaseModel):
    """Token refresh response schema."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Current user response schema."""

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
