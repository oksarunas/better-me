from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

from models import (
    fetch_progress_by_date_and_habit,
    fetch_all_progress_by_date,
    update_progress_status,
    fetch_all_habits,
)
from schemas import ProgressCreate, ProgressRead, BulkUpdate, ALLOWED_HABITS


async def update_progress(progress: ProgressCreate, db: AsyncSession) -> None:
    """Update progress for a specific habit and date."""
    if progress.habit not in ALLOWED_HABITS:
        raise HTTPException(status_code=400, detail=f"Invalid habit: {progress.habit}")
    try:
        await update_progress_status(
            db=db,
            date=progress.date,
            habit=progress.habit,
            status=progress.status,
        )
        logger.info(f"Updated progress for {progress.habit} on {progress.date}")
    except Exception as e:
        logger.error(f"Error updating progress for {progress.habit} on {progress.date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")


async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, allowed_habits: List[str]) -> None:
    """Bulk-update multiple habits for a specific date."""
    try:
        invalid_habits = [
            update.habit for update in data.updates if update.habit not in allowed_habits
        ]
        if invalid_habits:
            raise HTTPException(status_code=400, detail=f"Invalid habits: {invalid_habits}")

        for update in data.updates:
            await update_progress_status(
                db=db,
                date=data.date,
                habit=update.habit,
                status=update.status,
            )
        logger.info(f"Bulk update successful for date {data.date}")
    except Exception as e:
        logger.error(f"Bulk update failed for date {data.date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk update progress")


async def get_progress_by_date(
    date_obj: date,
    db: AsyncSession,
    allowed_habits: List[str],
) -> List[ProgressRead]:
    """Fetch progress for a single date."""
    try:
        rows = await fetch_all_progress_by_date(db, date_obj)
        row_map = {r.habit: r for r in rows}

        results = [
            ProgressRead(
                id=row_map[habit].id if habit in row_map else 0,
                date=row_map[habit].date if habit in row_map else date_obj,
                habit=habit,
                status=row_map[habit].status if habit in row_map else False,
                streak=row_map[habit].streak if habit in row_map else 0,
            )
            for habit in allowed_habits
        ]
        logger.info(f"Progress fetched for {date_obj}")
        return results
    except Exception as e:
        logger.error(f"Error fetching progress for {date_obj}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")


async def get_weekly_progress(db: AsyncSession, allowed_habits: List[str]) -> List[ProgressRead]:
    """Fetch progress for the last 7 days."""
    try:
        today = date.today()
        week_start = today - timedelta(days=6)

        rows = await fetch_all_progress_by_date(db, week_start, today)  # Batch-fetch data
        row_map = {f"{r.date}_{r.habit}": r for r in rows}

        all_progress = [
            ProgressRead(
                id=row_map[key].id if key in row_map else 0,
                date=row_map[key].date if key in row_map else week_start + timedelta(days=i),
                habit=habit,
                status=row_map[key].status if key in row_map else False,
                streak=row_map[key].streak if key in row_map else 0,
            )
            for i in range(7)
            for habit in allowed_habits
            for key in [f"{week_start + timedelta(days=i)}_{habit}"]
        ]

        logger.info("Weekly progress fetched successfully")
        return all_progress
    except Exception as e:
        logger.error(f"Error fetching weekly progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weekly progress")
