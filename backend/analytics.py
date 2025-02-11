from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Progress

logging.basicConfig(level=logging.INFO)
router = APIRouter()

async def get_analytics_data(db: AsyncSession, start_date, end_date):
    """
    Fetch analytics data between given dates.
    """
    query = select(Progress).where(Progress.date.between(start_date, end_date))
    result = await db.execute(query)
    progress_data = result.scalars().all()

    return {
        "message": "Analytics data retrieved",
        "start_date": start_date,
        "end_date": end_date,
        "total_entries": len(progress_data),
        "data": progress_data
    }

@router.get("/analytics")
async def analytics(start: str = Query(..., description="Start date (YYYY-MM-DD)"),
                    end: str = Query(..., description="End date (YYYY-MM-DD)"),
                    db: AsyncSession = Depends(get_db)):
    """
    Get analytics data for a given date range.
    """
    try:
        start_date = datetime.strptime(start, "%Y-%m-%d").date()
        end_date = datetime.strptime(end, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date.")

    logging.info(f"Received start date: {start_date}, end date: {end_date}")

    analytics_data = await get_analytics_data(db, start_date, end_date)

    logging.info(f"Analytics data fetched: {analytics_data}")

    return analytics_data
