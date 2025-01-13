from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
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
        raise ValueError(f"Invalid habit: {progress.habit}")
    try:
        await update_progress_status(
            db=db,
            date=progress.date,
            habit=progress.habit,
            status=progress.status
        )
        logger.info(f"Updated progress for {progress.habit} on {progress.date}")
    except Exception as e:
        logger.error(f"Error updating progress for {progress.habit} on {progress.date}: {e}")
        raise

async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, allowed_habits: List[str]) -> None:
    """Bulk-update multiple habits for a specific date."""
    try:
        for update in data.updates:
            if update.habit not in allowed_habits:
                raise ValueError(f"Invalid habit: {update.habit}")
            await update_progress_status(
                db=db,
                date=data.date,
                habit=update.habit,
                status=update.status
            )
        logger.info(f"Bulk update successful for date {data.date}")
    except Exception as e:
        logger.error(f"Bulk update failed for date {data.date}: {e}")
        raise

async def get_progress_by_date(
    date_obj: date,
    db: AsyncSession,
    allowed_habits: List[str],
) -> List[ProgressRead]:
    """Fetch progress for a single date."""
    try:
        rows = await fetch_all_progress_by_date(db, date_obj)
        row_map = {r.habit: r for r in rows}

        results = []
        for habit in allowed_habits:
            if habit in row_map:
                row = row_map[habit]
                results.append(
                    ProgressRead(
                        id=row.id,
                        date=row.date,
                        habit=habit,
                        status=row.status,
                        streak=row.streak
                    )
                )
            else:
                results.append(
                    ProgressRead(
                        id=0,
                        date=date_obj,
                        habit=habit,
                        status=False,
                        streak=0
                    )
                )
        logger.info(f"Progress fetched for {date_obj}")
        return results
    except Exception as e:
        logger.error(f"Error fetching progress for {date_obj}: {e}")
        raise

async def get_weekly_progress(db: AsyncSession, allowed_habits: List[str]) -> List[ProgressRead]:
    """Fetch progress for the last 7 days."""
    try:
        today = date.today()
        week_start = today - timedelta(days=6)

        all_progress = []
        rows = await fetch_all_progress_by_date(db, week_start, today)  # Fetch all in one query
        row_map = {f"{r.date}_{r.habit}": r for r in rows}

        for i in range(7):
            current_date = week_start + timedelta(days=i)
            for habit in allowed_habits:
                key = f"{current_date}_{habit}"
                if key in row_map:
                    row = row_map[key]
                    all_progress.append(
                        ProgressRead(
                            id=row.id,
                            date=row.date,
                            habit=habit,
                            status=row.status,
                            streak=row.streak
                        )
                    )
                else:
                    all_progress.append(
                        ProgressRead(
                            id=0,
                            date=current_date,
                            habit=habit,
                            status=False,
                            streak=0
                        )
                    )
        logger.info("Weekly progress fetched successfully")
        return all_progress
    except Exception as e:
        logger.error(f"Error fetching weekly progress: {e}")
        raise
