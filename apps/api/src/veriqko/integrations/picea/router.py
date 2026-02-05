from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from veriqko.db.base import get_session
from veriqko.integrations.picea.service import PiceaService
from veriqko.users.models import User
from veriqko.auth.dependencies import get_current_user

router = APIRouter(prefix="/picea", tags=["integrations", "picea"])

@router.post("/sync/{job_id}", status_code=status.HTTP_200_OK)
async def sync_diagnostics(
    job_id: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a manual sync of diagnostics data from Picea for a given Job.
    """
    service = PiceaService(db)
    success = await service.sync_job_diagnostics(job_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to sync diagnostics from Picea. Ensure device identifier is correct and Picea API is reachable."
        )
    
    return {"message": "Diagnostics synchronized successfully."}
