from datetime import datetime, timedelta
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
    Fetch and process analytics data between given dates.
    """
    query = select(Progress).where(Progress.date.between(start_date, end_date))
    result = await db.execute(query)
    progress_data = result.scalars().all()

    # Initialize data structures
    dates = []
    habits = {}
    daily_completion = []
    current_date = start_date

    # Create a list of all dates in range
    while current_date <= end_date:
        dates.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)

    # Initialize habits with zeros for all dates
    for progress in progress_data:
        habit = progress.habit
        if habit not in habits:
            habits[habit] = [0] * len(dates)

    # Process progress data
    for progress in progress_data:
        date_str = progress.date.strftime("%Y-%m-%d")
        date_index = dates.index(date_str)
        
        # Update habit data
        if progress.status:
            habits[progress.habit][date_index] += 1

    # Calculate daily completion percentage
    for date_str in dates:
        date_data = [p for p in progress_data if p.date.strftime("%Y-%m-%d") == date_str]
        if date_data:
            completed = sum(1 for p in date_data if p.status)
            total = len(date_data)
            daily_completion.append((completed / total) * 100 if total > 0 else 0)
        else:
            daily_completion.append(0)

    return {
        "dates": dates,
        "stackedData": habits,
        "lineData": daily_completion
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

    return {
        "message": "Analytics data retrieved",
        "start_date": start_date,
        "end_date": end_date,
        **analytics_data
    }
