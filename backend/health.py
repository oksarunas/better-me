from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from datetime import datetime
import logging
from application_status import ApplicationStatus


logger = logging.getLogger(__name__)

health_router = APIRouter(prefix="/health", tags=["health"])

@health_router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Perform a health check for the application.

    Verifies the database connection and provides system uptime.
    Returns a JSON response with the health status.

    Args:
        db: AsyncSession - The database session dependency.

    Returns:
        dict: A JSON response containing the health status and uptime.

    Raises:
        HTTPException: If the database check fails.
    """
    try:
        # Verify database connection
        await db.execute("SELECT 1")
        database_status = "healthy"
    except SQLAlchemyError as e:
        logger.error(f"Health check failed: Database connection error - {str(e)}")
        database_status = "unhealthy"

    # Application health status
    app_status = {
        "status": "healthy" if database_status == "healthy" else "unhealthy",
        "database": database_status,
        "uptime": (datetime.now() - ApplicationStatus.startup_time).total_seconds(),
    }

    # Log the health check result
    logger.info(f"Health check status: {app_status['status']}, uptime: {app_status['uptime']:.2f}s")

    # Return the health status
    if database_status == "unhealthy":
        raise HTTPException(status_code=503, detail=app_status)

    return app_status
