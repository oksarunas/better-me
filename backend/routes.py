from datetime import date, datetime, timedelta
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi import Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

# Import your local modules
from database import get_db
from logic import (
    get_progress_by_date,
    get_weekly_progress,
    update_progress,
    bulk_update_progress,
)
from schemas import (
    ProgressCreate,
    ProgressRead,
    ProgressUpdate,
    BulkUpdate,
    ALLOWED_HABITS,
)
from application_status import ApplicationStatus

logger = logging.getLogger(__name__)

# Create a central APIRouter instance for progress and health endpoints
router = APIRouter()

# -----------------------------
# Weekly Progress Endpoint (static route)
# -----------------------------
@router.get("/progress/weekly", response_model=List[ProgressRead])
async def weekly_progress(db: AsyncSession = Depends(get_db)):
    """
    Get progress for the last 7 days.
    """
    try:
        return await get_weekly_progress(db, ALLOWED_HABITS)
    except Exception as e:
        logger.error(f"Error in weekly_progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weekly progress")

# -----------------------------
# Progress Endpoint by Date (dynamic route)
# -----------------------------
@router.get("/progress/{progress_date}", response_model=List[ProgressRead])
async def get_progress(progress_date: date, db: AsyncSession = Depends(get_db)):
    """
    Get progress for a specific date.
    """
    try:
        progress_entries = await get_progress_by_date(progress_date, db, ALLOWED_HABITS)
        return progress_entries
    except Exception as e:
        logger.error(f"Error in get_progress for {progress_date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")

@router.post("/progress", status_code=201)
async def create_or_update_progress(
    progress: ProgressCreate, db: AsyncSession = Depends(get_db)
):
    """
    Create or update a progress record.
    """
    try:
        await update_progress(progress, db)
        return {"message": "Progress updated successfully"}
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")

@router.put("/progress/bulk", status_code=200)
async def bulk_update(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    """
    Bulk update progress records.
    """
    try:
        await bulk_update_progress(data, db, ALLOWED_HABITS)
        return {"message": "Bulk update completed successfully"}
    except Exception as e:
        logger.error(f"Bulk update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk update progress")

@router.patch("/progress/{progress_id}", response_model=ProgressRead)
async def patch_progress(
    progress_id: int,
    progress_update: ProgressUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Partially update a progress record by its ID.
    """
    try:
        result = await db.execute(text("SELECT * FROM progress WHERE id = :id"), {"id": progress_id})
        record = result.fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="Progress record not found")
        
        updates = {k: v for k, v in progress_update.dict().items() if v is not None}
        if updates:
            update_query = text("UPDATE progress SET " +
                ", ".join([f"{key} = :{key}" for key in updates.keys()]) +
                " WHERE id = :id RETURNING *")
            updates["id"] = progress_id
            updated_result = await db.execute(update_query, updates)
            updated_record = updated_result.fetchone()
            await db.commit()
            if updated_record:
                return updated_record
        raise HTTPException(status_code=400, detail="No fields provided for update")
    except Exception as e:
        logger.error(f"Error updating progress record {progress_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update progress record")

# -----------------------------
# Health Endpoint
# -----------------------------
@router.get("/health", response_model=dict)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Perform a health check by verifying the database connection and uptime.
    """
    try:
        await db.execute(text("SELECT 1"))
        database_status = "healthy"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        database_status = "unhealthy"

    uptime_seconds = (datetime.now() - ApplicationStatus.startup_time).total_seconds()
    status = {
        "status": "healthy" if database_status == "healthy" else "unhealthy",
        "database": database_status,
        "uptime": uptime_seconds,
    }

    if database_status == "unhealthy":
        raise HTTPException(status_code=503, detail=status)
    return status
