import uvicorn
import logging
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from config import Config
from logic import (
    get_progress_by_date,
    update_progress,
    bulk_update_progress,
    get_weekly_progress,
)
from schemas import ProgressRead, ProgressCreate, BulkUpdate
from database import get_db
from health import health_router
from application_status import ApplicationStatus


# Initialize logging
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Habit Tracker API",
    description="API for tracking daily habits and progress",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Progress Router
progress_router = APIRouter(prefix="/progress", tags=["progress"])

@progress_router.get("/weekly", response_model=list[ProgressRead])
async def get_weekly_progress_endpoint(db: AsyncSession = Depends(get_db)):
    """
    Fetch progress for the last 7 days for all allowed habits.
    """
    logger.info("Fetching weekly progress")
    return await get_weekly_progress(db, Config.ALLOWED_HABITS)

@progress_router.get("/{date}", response_model=list[ProgressRead])
async def get_progress(date: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch progress for a specific date.
    """
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        logger.info(f"Fetching progress for date: {parsed_date}")
    except ValueError:
        logger.error(f"Invalid date format: {date}")
        raise HTTPException(status_code=422, detail="Invalid date format. Expected YYYY-MM-DD.")
    return await get_progress_by_date(parsed_date, db, Config.ALLOWED_HABITS)

@progress_router.post("/", status_code=201, response_model=ProgressRead)
async def post_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    """
    Update progress for a specific habit and date.
    """
    logger.info(f"Updating progress: {progress}")
    return await update_progress(progress, db)

@progress_router.post("/bulk", status_code=201, response_model=dict)
async def post_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    """
    Bulk-update progress for multiple habits on a specific date.
    """
    logger.info(f"Bulk updating progress for date: {data.date}")
    updated_count = await bulk_update_progress(data, db, Config.ALLOWED_HABITS)
    return {"message": f"{updated_count} progress records updated successfully."}

# Include Health Router
app.include_router(health_router)

# Include Progress Router
app.include_router(progress_router, prefix="/api")

# Run the application
if __name__ == "__main__":
    logger.info(f"Starting server at {Config.HOST}:{Config.PORT} with debug={Config.DEBUG}")
    uvicorn.run("main:app", host=Config.HOST, port=Config.PORT, reload=Config.DEBUG)
