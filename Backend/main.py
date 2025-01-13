import uvicorn
from fastapi import FastAPI, APIRouter, Depends
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
    return await get_weekly_progress(db, Config.ALLOWED_HABITS)

@progress_router.get("/{date}", response_model=list[ProgressRead])
async def get_progress(date: str, db: AsyncSession = Depends(get_db)):
    parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
    return await get_progress_by_date(parsed_date, db, Config.ALLOWED_HABITS)

@progress_router.post("/", status_code=201)
async def post_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    return await update_progress(progress, db)

@progress_router.post("/bulk", status_code=201)
async def post_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    return await bulk_update_progress(data, db, Config.ALLOWED_HABITS)

# Include Progress Router
app.include_router(progress_router, prefix="/api")

# Run the application
if __name__ == "__main__":
    uvicorn.run("main:app", host=Config.HOST, port=Config.PORT, reload=Config.DEBUG)
