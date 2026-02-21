"""Multi-Factor Authentication (MFA) utilities."""

import pyotp

from veriqko.config import get_settings
from veriqko.users.models import User


def generate_mfa_secret() -> str:
    """Generate a new random MFA secret."""
    return pyotp.random_base32()


def get_mfa_uri(user: User, secret: str) -> str:
    """Generate the provisioning URI for an authenticator app."""
    settings = get_settings()
    totp = pyotp.totp.TOTP(secret)
    return totp.provisioning_uri(
        name=user.email,
        issuer_name=settings.brand_name,
    )


def verify_mfa_code(secret: str, code: str) -> bool:
    """Verify a TOTP code against a secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)
