from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from datetime import datetime
from main import ApplicationStatus

health_router = APIRouter(prefix="/health", tags=["health"])

@health_router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    await db.execute("SELECT 1")
    return {
        "status": "healthy",
        "uptime": (datetime.now() - ApplicationStatus.startup_time).total_seconds(),
    }
