from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text  # Importing text for SQL queries
from database import get_db
from datetime import datetime
import logging
from application_status import ApplicationStatus

logger = logging.getLogger(__name__)

health_router = APIRouter(prefix="/health", tags=["Health"])

@health_router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Perform a health check for the application.

    Verifies the database connection and provides system uptime.
    Returns a JSON response with the health status.

    Args:
        db (AsyncSession): The database session dependency.

    Returns:
        dict: A JSON response containing the health status and uptime.

    Raises:
        HTTPException: If the database check fails.
    """
    try:
        # Verify database connection using a SQLAlchemy text query.
        await db.execute(text("SELECT 1"))
        database_status = "healthy"
    except SQLAlchemyError as e:
        logger.error(f"Health check failed: Database connection error - {str(e)}")
        database_status = "unhealthy"

    # Calculate uptime in seconds.
    uptime_seconds = (datetime.now() - ApplicationStatus.startup_time).total_seconds()

    app_status = {
        "status": "healthy" if database_status == "healthy" else "unhealthy",
        "database": database_status,
        "uptime": uptime_seconds,
    }

    logger.info(f"Health check status: {app_status['status']}, uptime: {uptime_seconds:.2f}s")

    if database_status == "unhealthy":
        raise HTTPException(status_code=503, detail=app_status)

    return app_status
