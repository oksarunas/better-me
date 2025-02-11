import logging
from datetime import date, timedelta
from typing import List, Optional, Any

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from models import (
    fetch_progress_by_date_and_habit,
    fetch_all_progress_by_date,
    update_progress_status as update_progress_status_in_db,
    fetch_all_habits,
)
from schemas import ProgressCreate, ProgressRead, BulkUpdate, ALLOWED_HABITS, HabitEnum

logger = logging.getLogger(__name__)


async def update_progress(progress: ProgressCreate, db: AsyncSession) -> None:
    if progress.habit.value not in ALLOWED_HABITS:
        raise HTTPException(status_code=400, detail=f"Invalid habit: {progress.habit.value}")
    try:
        await update_progress_status_in_db(
            db=db,
            date_obj=progress.date,
            habit=progress.habit.value,  # ✅ Convert HabitEnum to string
            updates={"status": progress.status},
        )
        logger.info(f"Updated progress for {progress.habit} on {progress.date}")
    except Exception as e:
        logger.error(f"Error updating progress for {progress.habit} on {progress.date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")


async def bulk_update_progress(data: BulkUpdate, db: AsyncSession) -> None:
    for update in data.updates:
        if update.habit.value not in ALLOWED_HABITS:
            raise HTTPException(status_code=400, detail=f"Invalid habit: {update.habit.value}")

    try:
        for update in data.updates:
            existing_record = await db.execute(
                text("SELECT id FROM progress WHERE date = :date AND habit = :habit"),
                {"date": data.date, "habit": update.habit.value},
            )
            row = existing_record.fetchone()

            if row:
                await db.execute(
                    text("UPDATE progress SET status = :status WHERE id = :id"),
                    {"status": update.status, "id": row[0]},
                )
            else:
                await db.execute(
                    text("INSERT INTO progress (date, habit, status, streak) VALUES (:date, :habit, :status, 0)"),
                    {"date": data.date, "habit": update.habit.value, "status": update.status},
                )

        await db.commit()
        logger.info(f"Bulk update successful for date {data.date}")
    except Exception as e:
        logger.error(f"Bulk update failed for date {data.date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to bulk update progress")


async def get_progress_by_date(date_obj: date, db: AsyncSession) -> List[ProgressRead]:
    try:
        rows = await fetch_all_progress_by_date(db, date_obj)
        row_map = {r.habit: r for r in rows}  # ✅ Maps habits to rows

        results: List[ProgressRead] = []
        for habit in ALLOWED_HABITS:
            if habit in row_map:
                row = row_map[habit]  # ✅ Assign `row` correctly
                results.append(ProgressRead(
                    id=row.id,
                    date=row.date,
                    habit=row.habit,
                    status=row.status,
                    streak=row.streak,
                ))
            else:
                results.append(ProgressRead(
                    id=0,
                    date=date_obj,
                    habit=habit,
                    status=False,
                    streak=0,
                ))
        return results
    except Exception as e:
        logger.error(f"Error fetching progress for {date_obj}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")


async def get_weekly_progress(
    db: AsyncSession, allowed_habits: List[str]
) -> List[ProgressRead]:
    """
    Fetch progress for the last 7 days for each habit in allowed_habits.

    Args:
        db (AsyncSession): Database session.
        allowed_habits (List[str]): List of allowed habits.

    Returns:
        List[ProgressRead]: A list of progress records for each day in the last 7 days for each habit.
    """
    try:
        today = date.today()
        week_start = today - timedelta(days=6)
        rows = await fetch_all_progress_by_date(db, week_start, today)
        logger.debug(f"Fetched rows for weekly progress: {rows}")

        # Map rows with key as (date, habit) for quick lookup.
        row_map = {(row.date, row.habit): row for row in rows}

        all_progress: List[ProgressRead] = []
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            for habit in allowed_habits:
                key = (current_date, habit)
                if key in row_map:
                    row = row_map[key]
                    all_progress.append(ProgressRead(
                        id=row.id,
                        date=row.date,
                        habit=HabitEnum(row.habit),
                        status=row.status,
                        streak=row.streak,
                    ))
                else:
                    # Create a default progress record if missing.
                    all_progress.append(ProgressRead(
                        id=0,
                        date=current_date,
                        habit=HabitEnum(habit),
                        status=False,
                        streak=0,
                    ))
        logger.info("Weekly progress fetched successfully")
        return all_progress
    except Exception as e:
        logger.error(f"Error fetching weekly progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly progress: {str(e)}")


async def update_progress_status(
    db: AsyncSession, habit_id: int, status: bool
) -> Optional[Any]:
    """
    Update the status of a habit by its ID.

    Args:
        db (AsyncSession): Database session.
        habit_id (int): The unique identifier for the progress record.
        status (bool): The new status to set (True or False).

    Returns:
        Optional[Any]: The updated progress row, or None if not found.

    Raises:
        HTTPException: If the update fails.
    """
    try:
        result = await db.execute(
            text("UPDATE progress SET status = :status WHERE id = :habit_id RETURNING *"),
            {"status": status, "habit_id": habit_id},
        )
        updated_progress = result.fetchone()
        if updated_progress:
            await db.commit()
            return updated_progress
        return None
    except Exception as e:
        logger.error(f"Error updating habit ID {habit_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update progress record by ID")


async def recalc_all_streaks(db: AsyncSession) -> None:
    """
    Recalculate streaks for all habits in the database using window functions.

    This approach groups consecutive True statuses by habit and assigns streak counts.
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
        raise HTTPException(status_code=500, detail="Failed to recalc streaks")
