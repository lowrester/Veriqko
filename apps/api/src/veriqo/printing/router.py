from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

from veriqo.db.base import get_db
from veriqo.printing.models import LabelTemplate
from veriqo.users.dependencies import get_current_active_user
from veriqo.users.models import User, UserRole

router = APIRouter(prefix="/printing", tags=["printing"])

# --- Schemas ---
class LabelTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    zpl_code: str
    dimensions: Optional[str] = None
    is_default: bool = False

class LabelTemplateResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    zpl_code: str
    dimensions: Optional[str]
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/templates", response_model=List[LabelTemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all label templates."""
    query = select(LabelTemplate).order_by(LabelTemplate.name)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/templates", response_model=LabelTemplateResponse)
async def create_template(
    template: LabelTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new label template (Admin only)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_template = LabelTemplate(**template.model_dump())
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template

@router.get("/templates/{template_id}", response_model=LabelTemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific template."""
    template = await db.get(LabelTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template
