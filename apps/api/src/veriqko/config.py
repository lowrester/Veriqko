"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=[
            Path(__file__).parent.parent.parent / ".env",
            ".env",
            "/opt/veriqko/app/apps/api/.env"
        ],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Veriqko"
    debug: bool = False
    environment: str = Field(default="development")
    base_url: str = "http://localhost:8000"

    # API
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://veriqko:veriqko@localhost:5432/veriqko"
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Authentication
    jwt_secret_key: str = Field(default="change-me-in-production-min-32-chars!")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # Storage
    storage_backend: str = "local"
    storage_base_path: Path = Field(default=Path("/data/veriqko"))
    storage_max_file_size_mb: int = 100
    azure_storage_connection_string: Optional[str] = None
    azure_storage_container_name: str = "veriqko-assets"

    # Reports
    report_expiry_days: int = 90

    # Picea Integration
    picea_api_url: Optional[str] = None
    picea_api_key: Optional[str] = None
    picea_customer_id: Optional[str] = None

    # Branding (white-label)
    brand_name: str = "Veriqko"
    brand_logo_path: Optional[Path] = None
    brand_primary_color: str = "#2563eb"
    brand_secondary_color: str = "#1e40af"
    brand_footer_text: Optional[str] = None

    # CORS
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173"])

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    @field_validator("storage_base_path", mode="before")
    @classmethod
    def parse_path(cls, v):
        return Path(v) if isinstance(v, str) else v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
