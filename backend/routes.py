import logging
from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from logic import (
    get_progress_by_date,
    get_weekly_progress,
    update_progress,
    bulk_update_progress,
    recalc_all_streaks,
)
from schemas import (
    ProgressCreate,
    ProgressRead,
    ProgressUpdate,
    BulkUpdate,
    ALLOWED_HABITS,
)
from application_status import ApplicationStatus
from models import Progress

logger = logging.getLogger(__name__)

router = APIRouter()

# -----------------------------
# Weekly Progress Endpoint
# -----------------------------
@router.get("/progress/weekly", response_model=List[ProgressRead])
async def weekly_progress(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Get progress for the last 7 days."""
    try:
        return await get_weekly_progress(db, ALLOWED_HABITS, current_user.id)
    except Exception as e:
        logger.error(f"Error in weekly_progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weekly progress")

# -----------------------------
# Progress Endpoint by Date
# -----------------------------
@router.get("/progress/{progress_date}", response_model=List[ProgressRead])
async def get_progress(progress_date: date, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Get progress for a specific date."""
    try:
        return await get_progress_by_date(progress_date, db, current_user.id)
    except Exception as e:
        logger.error(f"Error in get_progress for {progress_date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")

@router.post("/progress", status_code=201)
async def create_or_update_progress(
    progress: ProgressCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)
):
    """Create or update a progress record."""
    try:
        await update_progress(progress, db, current_user.id)
        return {"message": "Progress updated successfully"}
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")

@router.put("/progress/bulk", status_code=200)
async def bulk_update(data: BulkUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Bulk update progress records."""
    try:
        await bulk_update_progress(data, db, current_user.id)
        return {"message": "Bulk update completed successfully"}
    except Exception as e:
        logger.error(f"Bulk update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk update progress")

@router.patch("/progress/{progress_id}", response_model=ProgressRead)
async def patch_progress(
    progress_id: int,
    progress_update: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Partially update a progress record by its ID."""
    try:
        result = await db.execute(
            select(Progress).where(
                Progress.id == progress_id,
                Progress.user_id == current_user.id
            )
        )
        record = result.scalars().first()
        
        if not record:
            raise HTTPException(status_code=404, detail="Progress record not found or does not belong to current user")

        updates = progress_update.dict(exclude_unset=True)
        if updates:
            for key, value in updates.items():
                setattr(record, key, value)

            await db.commit()
            await db.refresh(record)
            
            # Run fix.py to ensure data consistency and recalculate streaks
            from fix import fill_missing_data, fetch_all_habits
            from logic import recalc_all_streaks
            
            # Fill missing data with current user's ID
            await fill_missing_data(db, ALLOWED_HABITS, current_user.id)
            
            allowed_habits = await fetch_all_habits(db)
            await fill_missing_data(db, allowed_habits)
            await recalc_all_streaks(db)
            
            return record

        raise HTTPException(status_code=400, detail="No fields provided for update")
    except Exception as e:
        logger.error(f"Error updating progress record {progress_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update progress record")

# -----------------------------
# Health Check (Merged from health.py)
# -----------------------------
@router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Perform a health check for the application.
    """
    try:
        await db.execute(select(1))  # Using ORM instead of raw SQL
        database_status = "healthy"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        database_status = "unhealthy"

    uptime_seconds = (datetime.now() - ApplicationStatus.startup_time).total_seconds()

    app_status = {
        "status": database_status,
        "uptime_seconds": uptime_seconds,
    }

    logger.info(f"Health check status: {app_status['status']}, uptime: {uptime_seconds:.2f}s")

    if database_status == "unhealthy":
        raise HTTPException(status_code=503, detail=app_status)

    return app_status
