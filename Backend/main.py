import os
import logging
from typing import List, Optional
from datetime import date, datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from datetime import date as dt_date


from database import async_session_maker, init_db
from logic import (
    get_progress_by_date,
    update_progress,
    bulk_update_progress,
    get_weekly_progress,
)
from schemas import ProgressRead, ProgressCreate, BulkUpdate, HabitEnum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Application Configuration
class Config:
    """Application configuration class."""
    ALLOWED_HABITS = HabitEnum.list_values()
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8001))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")

class ApplicationStatus:
    """Track application status and metrics."""
    startup_time: Optional[datetime] = None
    request_count: int = 0
    error_count: int = 0

    @classmethod
    def increment_request(cls):
        cls.request_count += 1

    @classmethod
    def increment_error(cls):
        cls.error_count += 1

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    logger.info("Starting up application...")
    try:
        await init_db()
        ApplicationStatus.startup_time = datetime.now()
        logger.info("Database initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    finally:
        logger.info("Shutting down application...")

async def get_db() -> AsyncSession:
    """Database session dependency."""
    async with async_session_maker() as db:
        try:
            yield db
        finally:
            await db.close()

# Middleware
async def request_middleware(request: Request, call_next):
    """Log requests and track metrics."""
    start_time = datetime.now()
    ApplicationStatus.increment_request()
    
    try:
        response = await call_next(request)
        duration = (datetime.now() - start_time).total_seconds()
        
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {duration:.3f}s"
        )
        return response
    except Exception as e:
        ApplicationStatus.increment_error()
        logger.error(f"Request error: {str(e)}")
        raise

def create_app() -> FastAPI:
    """Factory function to create and configure FastAPI application."""
    app = FastAPI(
        title="Habit Tracker API",
        description="API for tracking daily habits and progress",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=Config.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add request logging middleware
    app.middleware("http")(request_middleware)

    return app

# Exception Handlers
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body,
            "message": "Request validation failed"
        },
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"},
    )

# Create router for progress endpoints
progress_router = APIRouter(prefix="/progress", tags=["progress"])

@progress_router.get(
    "/weekly",
    response_model=List[ProgressRead],
    summary="Get Weekly Progress",
    description="Retrieve progress for the past 7 days for all habits."
)
async def get_weekly_progress_endpoint(db: AsyncSession = Depends(get_db)):
    try:
        logger.info("Fetching weekly progress...")
        progress = await get_weekly_progress(db, Config.ALLOWED_HABITS)
        return progress
    except Exception as e:
        logger.exception("Error retrieving weekly progress")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve weekly progress"
        )

@progress_router.get(
    "/{date}",
    response_model=List[ProgressRead],
    summary="Get Daily Progress",
    description="Retrieve progress for a specific date for all habits."
)
async def get_progress(date: str, db: AsyncSession = Depends(get_db)):
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        if parsed_date > dt_date.today():
            raise HTTPException(
                status_code=400,
                detail="Cannot fetch progress for future dates"
            )
        return await get_progress_by_date(parsed_date, db, Config.ALLOWED_HABITS)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        logger.error(f"Error getting progress for date {date}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve progress"
        )

@progress_router.post(
    "/",
    status_code=201,
    summary="Update Progress",
    description="Update progress for a specific habit on a specific date."
)
async def post_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await update_progress(progress, db)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        return {"message": "Progress updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update progress"
        )

@progress_router.post(
    "/bulk",
    status_code=201,
    summary="Bulk Update Progress",
    description="Update progress for multiple habits on a specific date."
)
async def post_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    try:
        result = await bulk_update_progress(data, db, Config.ALLOWED_HABITS)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        return {"message": "Bulk progress updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing bulk update: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update bulk progress"
        )

# Health check endpoint
@progress_router.get(
    "/health",
    summary="Health Check",
    description="Check the health status of the application and its dependencies."
)
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "uptime": (datetime.now() - ApplicationStatus.startup_time).total_seconds(),
        "requests": ApplicationStatus.request_count,
        "errors": ApplicationStatus.error_count,
        "version": app.version,
        "timestamp": datetime.now().isoformat()
    }

# Initialize application
app = create_app()
app.include_router(progress_router, prefix="/api")
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=Config.DEBUG
    )