"""Device database models."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from veriqko.db.base import Base, TimestampMixin, UUIDMixin


class Device(Base, UUIDMixin, TimestampMixin):
    """Device model - catalog of console types."""

    __tablename__ = "devices"

    brand: Mapped[str] = mapped_column(String(50), nullable=False)  # Apple, Samsung, Sony
    device_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Mobile, Tablet, Console
    model: Mapped[str] = mapped_column(String(100), nullable=False)  # iPhone 13, Galaxy S21, PS5
    model_number: Mapped[str | None] = mapped_column(String(50), nullable=True)  # A2633, SM-G991B, CFI-1015A

    # Device-specific test configuration
    test_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Relationships
    jobs = relationship("Job", back_populates="device")
    test_steps = relationship("TestStep", back_populates="device")

    __table_args__ = (
        {"schema": None},
    )

    def __repr__(self) -> str:
        return f"<Device {self.brand} {self.model}>"
