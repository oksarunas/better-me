import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List
from datetime import date
from contextlib import asynccontextmanager

from database import async_session, init_db
from logic import get_progress_by_date, update_progress, bulk_update_progress
from schemas import ProgressRead, ProgressCreate, BulkUpdate

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

# Allowed habits
ALLOWED_HABITS = [
    "7 hours of sleep", "Breakfast", "Workout", "Code",
    "Creatine", "Read", "Vitamins", "No drink",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    await init_db()
    yield
    # Shutdown: Add cleanup code here if needed
    pass

# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
async def get_db():
    async with async_session() as db:
        yield db

# API Router for progress-related routes
progress_router = APIRouter(prefix="/progress", tags=["progress"])

@progress_router.get("/{date}", response_model=List[ProgressRead])
async def get_progress(date: date, db: AsyncSession = Depends(get_db)):
    return await get_progress_by_date(date, db, ALLOWED_HABITS)

@progress_router.post("/")
async def post_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    await update_progress(progress, db)
    return {"message": "Progress updated successfully"}

@progress_router.post("/init")
async def post_initialize_progress(date: date, db: AsyncSession = Depends(get_db)):
    await initialize_progress(date, db, ALLOWED_HABITS)
    return {"message": "Progress initialized successfully"}

@progress_router.post("/bulk")
async def post_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    await bulk_update_progress(data, db, ALLOWED_HABITS)
    return {"message": "Bulk progress updated successfully"}

# Register progress router
app.include_router(progress_router, prefix="/api")

@app.get("/health", summary="Health check endpoint")
async def health_check():
    return {"status": "healthy"}
