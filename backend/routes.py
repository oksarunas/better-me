import logging
from datetime import date
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import timedelta
from typing import Optional
from streak_calculations import recalc_all_streaks, recalculate_streaks_for_habit

from auth import (
    get_current_user, register_user, login_user, google_login_user,
    GoogleLoginRequest, LoginRequest, RegisterRequest
)
from database import get_db
from logic import (
    get_progress_by_date, get_weekly_progress, update_progress,
    bulk_update_progress, get_completion_stats, patch_progress_record
)
from streak_calculations import recalc_all_streaks
from schemas import ProgressCreate, ProgressRead, ProgressUpdate, BulkUpdate, HabitCreate, AnalyticsResponse
from application_status import ApplicationStatus
from models import User, Progress

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")



# --- Auth Routes ---
@router.post("/auth/register")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    return await register_user(request, db)

@router.post("/auth/login")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate a user with email and password."""
    return await login_user(request, db)

@router.post("/auth/google")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth2 or demo login."""
    return await google_login_user(request, db)

@router.get("/auth/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    """Test protected route."""
    return {"message": f"Hello, {current_user.name or current_user.email}!"}

# --- Progress Routes ---
@router.get("/progress/weekly", response_model=List[ProgressRead])
async def weekly_progress(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get progress for the last 7 days."""
    try:
        return await get_weekly_progress(db, current_user.id)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in weekly_progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weekly progress")

@router.get("/progress/{progress_date}", response_model=List[ProgressRead])
async def get_progress(progress_date: date, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get progress for a specific date."""
    try:
        return await get_progress_by_date(progress_date, db, current_user.id)
    except Exception as e:
        logger.error(f"Error in get_progress for {progress_date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")

@router.post("/progress", status_code=201)
async def create_or_update_progress(
    progress: ProgressCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Create or update a progress record."""
    try:
        await update_progress(progress, db, current_user.id)
        return {"message": "Progress updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")

@router.put("/progress/bulk", status_code=200)
async def bulk_update(
    data: BulkUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Bulk update progress records."""
    try:
        await bulk_update_progress(data, db, current_user.id)
        return {"message": "Bulk update completed successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Bulk update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk update progress")

@router.patch("/progress/{progress_id}", response_model=ProgressRead)
async def patch_progress(
    progress_id: int,
    progress_update: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get the raw SQLAlchemy Progress object first
        result = await db.execute(
            select(Progress).where(Progress.id == progress_id, Progress.user_id == current_user.id)
        )
        progress_record = result.scalar_one_or_none()
        if not progress_record:
            raise HTTPException(status_code=404, detail="Progress record not found or unauthorized")

        # Apply updates
        updates_dict = progress_update.dict(exclude_unset=True)
        if not updates_dict:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        for key, value in updates_dict.items():
            setattr(progress_record, key, value)
        await db.commit()

        # Recalculate streaks and refresh
        await recalculate_streaks_for_habit(db, progress_record.habit, current_user.id)
        await db.refresh(progress_record)  # Refresh the SQLAlchemy object

        # Convert to ProgressRead for response
        return ProgressRead.model_validate(progress_record)  # Or .from_orm() for Pydantic v1
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating progress {progress_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress record")
    
# --- Analytics Routes ---
@router.get("/analytics/completion", response_model=AnalyticsResponse)
async def completion_stats(
    start: Optional[date] = None,
    end: Optional[date] = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get habit completion percentages for a date range or last N days."""
    try:
        if start and end:
            start_date = start
            end_date = end
            if start_date > end_date:
                raise HTTPException(status_code=400, detail="Start date must be before end date")
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=days - 1)
        return await get_completion_stats(db, current_user.id, start_date, end_date)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in completion_stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch completion stats")
    
# --- Profile Routes ---
class ProfileUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None

@router.get("/profile", response_model=dict)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatar_url": current_user.avatar_url,
    }

@router.put("/profile", response_model=dict)
async def update_profile(
    profile: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile."""
    try:
        updates = profile.dict(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        for key, value in updates.items():
            setattr(current_user, key, value)
        await db.commit()
        await db.refresh(current_user)
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "avatar_url": current_user.avatar_url,
        }
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")

# --- Health Check ---
@router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """Check application and database health."""
    try:
        await db.execute(select(1))
        database_status = "healthy"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        database_status = "unhealthy"

    status = ApplicationStatus.get_status()
    app_status = {"status": database_status, "uptime_seconds": status["uptime_seconds"]}

    if database_status == "unhealthy":
        raise HTTPException(status_code=503, detail=app_status)
    return app_status

@router.post("/habits", response_model=ProgressRead, status_code=201)
async def create_habit(
    habit: HabitCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Creating habit: {habit.habit} for user {habit.user_id}")
    db_progress = Progress(
        habit=habit.habit,
        category=habit.category,
        user_id=habit.user_id,
        date=habit.date,
        status=False,
        streak=0
    )
    db.add(db_progress)
    try:
        await db.commit()
        await db.refresh(db_progress)
        # Recalculate streaks after creating the habit
        await recalc_all_streaks(db)
        # Refresh again to get the updated streak value
        await db.refresh(db_progress)
        return ProgressRead.model_validate(db_progress)  # Or .from_orm() for Pydantic v1
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create habit: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create habit")

# --- Root Endpoint ---
@router.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Welcome to the Habit Tracker API",
        "health_check": "/api/health",
        "documentation": "/docs",
    }