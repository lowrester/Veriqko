"""Printing database models."""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from veriqo.db.base import Base, TimestampMixin, UUIDMixin


class LabelTemplate(Base, UUIDMixin, TimestampMixin):
    """Template for ZPL labels."""
    
    __tablename__ = "label_templates"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    zpl_code: Mapped[str] = mapped_column(Text, nullable=False)
    # E.g., '100x50mm', '50x25mm'
    dimensions: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_default: Mapped[bool] = mapped_column(default=False)

    def __repr__(self) -> str:
        return f"<LabelTemplate {self.name}>"
