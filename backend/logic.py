import logging
from datetime import date, timedelta
from typing import List, Optional, Any, Tuple

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from models import (
    fetch_progress_by_date_and_habit,
    fetch_all_progress_by_date,
    fetch_progress_date_range,  # Added this function for date range queries
    update_progress_status as update_progress_status_in_db,
    fetch_all_habits,
)
from schemas import ProgressCreate, ProgressRead, BulkUpdate, ALLOWED_HABITS, HabitEnum

logger = logging.getLogger(__name__)


async def update_progress(progress: ProgressCreate, db: AsyncSession, user_id: int) -> None:
    """
    Update a single habit progress entry.
    
    Args:
        progress (ProgressCreate): The progress data to update.
        db (AsyncSession): Database session.
        user_id (int): The ID of the user.
        
    Raises:
        HTTPException: If the habit is invalid or the update fails.
    """
    if not ALLOWED_HABITS:
        logger.error("No allowed habits configured")
        raise HTTPException(status_code=500, detail="No habits configured in the system")
        
    if progress.habit.value not in ALLOWED_HABITS:
        raise HTTPException(status_code=400, detail=f"Invalid habit: {progress.habit.value}")
    
    try:
        await update_progress_status_in_db(
            db=db,
            date_obj=progress.date,
            habit=progress.habit.value,  # Convert HabitEnum to string
            user_id=user_id,
            updates={"status": progress.status},
        )
        logger.info(f"Updated progress for {progress.habit} on {progress.date}")
    except Exception as e:
        logger.error(f"Error updating progress for {progress.habit} on {progress.date}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, user_id: int) -> None:
    """
    Update multiple habit progress entries for a specific date.
    
    Args:
        data (BulkUpdate): The bulk update data containing date and habit updates.
        db (AsyncSession): Database session.
        user_id (int): The ID of the user.
        
    Raises:
        HTTPException: If any habit is invalid or the update fails.
    """
    if not ALLOWED_HABITS:
        logger.error("No allowed habits configured")
        raise HTTPException(status_code=500, detail="No habits configured in the system")
        
    # Validate all habits first before making any changes
    for update in data.updates:
        if update.habit.value not in ALLOWED_HABITS:
            raise HTTPException(status_code=400, detail=f"Invalid habit: {update.habit.value}")

    try:
        for update in data.updates:
            existing_record = await db.execute(
                text("SELECT id FROM progress WHERE date = :date AND habit = :habit AND user_id = :user_id"),
                {"date": data.date, "habit": update.habit.value, "user_id": user_id},
            )
            row = existing_record.fetchone()

            if row:
                await db.execute(
                    text("UPDATE progress SET status = :status WHERE id = :id"),
                    {"status": update.status, "id": row[0]},
                )
            else:
                await db.execute(
                    text("INSERT INTO progress (date, habit, status, streak, user_id) VALUES (:date, :habit, :status, 0, :user_id)"),
                    {"date": data.date, "habit": update.habit.value, "status": update.status, "user_id": user_id},
                )

        await db.commit()
        logger.info(f"Bulk update successful for date {data.date}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk update failed for date {data.date}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk update progress: {str(e)}")


async def get_progress_by_date(date_obj: date, db: AsyncSession, user_id: int) -> List[ProgressRead]:
    """
    Get progress for all habits on a specific date.
    
    Args:
        date_obj (date): The date to get progress for.
        db (AsyncSession): Database session.
        user_id (int): The ID of the user.
        
    Returns:
        List[ProgressRead]: List of progress entries for all habits.
        
    Raises:
        HTTPException: If fetching progress fails.
    """
    if not ALLOWED_HABITS:
        logger.error("No allowed habits configured")
        raise HTTPException(status_code=500, detail="No habits configured in the system")
        
    try:
        rows = await fetch_all_progress_by_date(db, date_obj, user_id)
        
        # Calculate completion percentage
        completed = sum(1 for r in rows if r.status)
        total_habits = len(ALLOWED_HABITS)
        completion_pct = round((completed / total_habits) * 100) if total_habits > 0 else 0

        # Create a map for quick lookup of existing records
        row_map = {r.habit: r for r in rows}

        results: List[ProgressRead] = []
        
        # Process existing and missing habits
        transaction_started = False
        
        try:
            for habit in ALLOWED_HABITS:
                if habit in row_map:
                    # Use existing record
                    row = row_map[habit]
                    results.append(ProgressRead(
                        id=row.id,
                        date=row.date,
                        habit=HabitEnum(row.habit),  # Convert string to HabitEnum
                        status=row.status,
                        streak=row.streak,
                        completion_pct=completion_pct,
                    ))
                else:
                    # Create a new record for missing habit
                    if not transaction_started:
                        transaction_started = True
                        
                    await db.execute(
                        text("INSERT INTO progress (date, habit, status, streak, user_id) VALUES (:date, :habit, :status, 0, :user_id)"),
                        {"date": date_obj, "habit": habit, "status": False, "user_id": user_id},
                    )
                    
                    # Fetch the newly created record
                    new_record = await db.execute(
                        text("SELECT id, date, habit, status, streak FROM progress WHERE date = :date AND habit = :habit AND user_id = :user_id"),
                        {"date": date_obj, "habit": habit, "user_id": user_id},
                    )
                    row = new_record.fetchone()
                    
                    if row:
                        results.append(ProgressRead(
                            id=row[0],
                            date=row[1],
                            habit=HabitEnum(row[2]),  # Convert string to HabitEnum
                            status=row[3],
                            streak=row[4],
                            completion_pct=completion_pct,
                        ))
                    else:
                        logger.error(f"Failed to retrieve newly created record for habit {habit}")
                        
            if transaction_started:
                await db.commit()
                
            return results
        except Exception as inner_e:
            if transaction_started:
                await db.rollback()
            raise inner_e
            
    except Exception as e:
        logger.error(f"Error fetching progress for {date_obj}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")


async def get_weekly_progress(
    db: AsyncSession, user_id: int, start_date: Optional[date] = None
) -> List[ProgressRead]:
    """
    Fetch progress for the last 7 days for each habit in allowed_habits.

    Args:
        db (AsyncSession): Database session.
        user_id (int): The ID of the user.
        start_date (Optional[date]): The start date for the weekly progress. Defaults to 7 days ago.

    Returns:
        List[ProgressRead]: A list of progress records for each day in the last 7 days for each habit.
        
    Raises:
        HTTPException: If fetching weekly progress fails.
    """
    if not ALLOWED_HABITS:
        logger.error("No allowed habits configured")
        raise HTTPException(status_code=500, detail="No habits configured in the system")
        
    logger.debug(f"Fetching weekly progress for user ID {user_id}")
    
    # Handle user_id validation first
    if isinstance(user_id, list):
        logger.error(f"Invalid user_id type: got list instead of integer")
        raise HTTPException(status_code=400, detail="Invalid user_id: must be a single integer value")
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        logger.error(f"Failed to convert user_id to integer: {user_id}")
        raise HTTPException(status_code=400, detail=f"Invalid user_id: must be an integer value")

    try:
        today = date.today()
        week_start = start_date or (today - timedelta(days=6))
        
        # Validate dates
        if not isinstance(week_start, date):
            logger.error(f"Invalid start_date type: {type(week_start)}")
            raise HTTPException(status_code=400, detail="Invalid start_date format")

        # Use the fetch_progress_date_range function instead
        rows = await fetch_progress_date_range(db, week_start, today, user_id)
        logger.debug(f"Fetched {len(rows)} rows for weekly progress")

        # Map rows with key as (date, habit) for quick lookup.
        row_map = {(row.date, row.habit): row for row in rows}

        all_progress: List[ProgressRead] = []
        for i in range(7):
            current_date = week_start + timedelta(days=i)
            for habit in ALLOWED_HABITS:
                key = (current_date, habit)
                if key in row_map:
                    row = row_map[key]
                    all_progress.append(ProgressRead(
                        id=row.id,
                        date=row.date,
                        habit=HabitEnum(row.habit),  # Convert string to HabitEnum
                        status=row.status,
                        streak=row.streak,
                        completion_pct=None,  # Not calculating for weekly view
                    ))
                else:
                    # Create a default progress record if missing.
                    all_progress.append(ProgressRead(
                        id=0,
                        date=current_date,
                        habit=HabitEnum(habit),  # Convert string to HabitEnum
                        status=False,
                        streak=0,
                        completion_pct=None,  # Not calculating for weekly view
                    ))
        logger.info("Weekly progress fetched successfully")
        return all_progress
    except ValueError as ve:
        logger.error(f"Invalid parameter type: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
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
        
        logger.warning(f"No progress record found with ID {habit_id}")
        return None
    except Exception as e:
        logger.error(f"Error updating habit ID {habit_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update progress record by ID: {str(e)}")


async def recalc_all_streaks(db: AsyncSession) -> None:
    """
    Recalculate streaks for all habits in the database using window functions.
    
    This function groups consecutive True statuses by habit and assigns streak counts.
    It uses SQL window functions for efficient calculation:
    
    1. ranked_data CTE:
       - Groups records by habit
       - Identifies streak groups by subtracting row numbers
       - When status is True, consecutive dates will have the same streak_group value
    
    2. streak_updates CTE:
       - Counts the number of records in each streak group
       - This gives us the streak length
    
    3. Final UPDATE:
       - Updates the streak value for each record based on the calculated streaks
    
    Args:
        db (AsyncSession): Database session.
        
    Raises:
        HTTPException: If streak recalculation fails.
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
        raise HTTPException(status_code=500, detail=f"Failed to recalculate streaks: {str(e)}")