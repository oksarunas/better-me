from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from fastapi import HTTPException
import logging
from typing import List, Optional
from sqlalchemy.sql import text
from schemas import build_progress_row




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
    invalid_habits = [update.habit for update in data.updates if update.habit not in allowed_habits]
    if invalid_habits:
        raise HTTPException(status_code=400, detail=f"Invalid habits: {invalid_habits}")

    try:
        updates = [
            {"date": data.date, "habit": update.habit, "status": update.status}
            for update in data.updates
        ]
        await db.execute(
            text("""
                INSERT INTO progress (date, habit, status, streak)
                VALUES (:date, :habit, :status, 0)
                ON CONFLICT (date, habit) DO UPDATE
                SET status = EXCLUDED.status
            """),
            updates,
        )
        await db.commit()
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
        # Calculate the date range (last 7 days)
        today = date.today()
        week_start = today - timedelta(days=6)

        # Fetch all progress records in the date range
        rows = await fetch_all_progress_by_date(db, week_start, today)
        
        # Log the fetched rows for debugging
        logger.debug(f"Fetched rows: {rows}")

        # Map rows for quick access by (date, habit)
        row_map = {
            (row.date, row.habit): ProgressRead(
                id=row.id,
                date=row.date,
                habit=row.habit,
                status=row.status,
                streak=row.streak,
            )
            for row in rows
        }

        # Build a complete list of progress entries for each day and habit
        all_progress = []
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            for habit in allowed_habits:
                # Use the mapped data or create a default row
                key = (current_date, habit)
                progress_row = row_map.get(
                    key,
                    ProgressRead(
                        id=0,  # Default ID for missing rows
                        date=current_date,
                        habit=habit,
                        status=False,
                        streak=0,  # Default streak value
                    ),
                )
                all_progress.append(progress_row)

        logger.info("Weekly progress fetched successfully")
        return all_progress
    except Exception as e:
        # Log the detailed error and raise an HTTPException
        logger.error(f"Error fetching weekly progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly progress: {str(e)}")


async def update_progress_status(db: AsyncSession, habit_id: int, status: bool) -> Optional[ProgressRead]:
    """
    Update the status of a habit by its ID.
    """
    try:
        result = await db.execute(
            text("""
                UPDATE progress
                SET status = :status
                WHERE id = :habit_id
                RETURNING id, date, habit, status, streak
            """),
            {"status": status, "habit_id": habit_id},
        )
        row = result.fetchone()
        if not row:
            return None
        await db.commit()
        return ProgressRead(
            id=row.id, date=row.date, habit=row.habit, status=row.status, streak=row.streak
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating habit ID {habit_id}: {str(e)}")
        raise


async def recalc_all_streaks(db: AsyncSession) -> None:
    """
    Recalculate streaks for all habits in the database.
    """
    try:
        logger.info("Starting streak recalculation for all habits...")

        await db.execute(
            text("""
                WITH ranked_data AS (
                    SELECT
                        id,
                        habit,
                        date,
                        status,
                        CASE
                            WHEN status THEN
                                ROW_NUMBER() OVER (PARTITION BY habit ORDER BY date)
                                - ROW_NUMBER() OVER (PARTITION BY habit, status ORDER BY date)
                            ELSE NULL
                        END AS streak_group
                    FROM progress
                ),
                streak_updates AS (
                    SELECT
                        id,
                        COALESCE(COUNT(*) OVER (PARTITION BY habit, streak_group), 0) AS calculated_streak
                    FROM ranked_data
                    WHERE streak_group IS NOT NULL
                )
                UPDATE progress
                SET streak = streak_updates.calculated_streak
                FROM streak_updates
                WHERE progress.id = streak_updates.id;
            """)
        )
        await db.commit()
        logger.info("Streak recalculation completed successfully.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during streak recalculation: {e}")
        raise
