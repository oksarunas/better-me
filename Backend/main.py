import os
import logging
from typing import List
from datetime import date, datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

from database import async_session_maker, init_db
from logic import get_progress_by_date, update_progress, bulk_update_progress
from schemas import ProgressRead, ProgressCreate, BulkUpdate

# Initialize logging with format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Allowed habits - Consider moving to config file
ALLOWED_HABITS = [
    "7 hours of sleep",
    "Breakfast",
    "Workout",
    "Code",
    "Creatine",
    "Read",
    "Vitamins",
    "No drink",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    logger.info("Starting up application...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    finally:
        logger.info("Shutting down application...")

def create_app() -> FastAPI:
    """Factory function to create and configure FastAPI application."""
    app = FastAPI(
        title="Habit Tracker API",
        description="API for tracking daily habits and progress",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS configuration
    origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app

async def get_db() -> AsyncSession:
    """Dependency for database session management."""
    async with async_session_maker() as db:
        try:
            yield db
        finally:
            await db.close()

# Initialize FastAPI app
app = create_app()

# Create router for progress endpoints
progress_router = APIRouter(prefix="/progress", tags=["progress"])

@progress_router.get("/{date}", response_model=List[ProgressRead])
async def get_progress(date: date, db: AsyncSession = Depends(get_db)):
    """Get progress for a specific date."""
    try:
        return await get_progress_by_date(date, db, ALLOWED_HABITS)
    except Exception as e:
        logger.error(f"Error getting progress for date {date}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving progress")

@progress_router.post("/", status_code=201)
async def post_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    """Update progress for a specific habit."""
    try:
        await update_progress(progress, db)
        return {"message": "Progress updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail="Error updating progress")

@progress_router.post("/bulk", status_code=201)
async def post_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    """Bulk update progress entries."""
    try:
        await bulk_update_progress(data, db, ALLOWED_HABITS)
        return {"message": "Bulk progress updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error performing bulk update: {e}")
        raise HTTPException(status_code=500, detail="Error updating bulk progress")

# Register progress router
app.include_router(progress_router, prefix="/api")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": app.version,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
