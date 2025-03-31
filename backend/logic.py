import logging
from datetime import date, timedelta
from typing import List, Optional, Dict
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from schemas import ProgressCreate, ProgressRead, ProgressUpdate, BulkUpdate, ALLOWED_HABITS, HabitEnum
from user_repository import (
    fetch_all_progress_by_date, fetch_progress_date_range, fetch_all_habits,
    update_progress_status, fetch_progress_by_date_and_habit
)
from models import Progress

logger = logging.getLogger(__name__)

async def update_progress(progress: ProgressCreate, db: AsyncSession, user_id: int) -> None:
    """Update a single habit progress entry."""
    if not ALLOWED_HABITS:
        raise HTTPException(status_code=500, detail="No habits configured in the system")
    habit_str = progress.habit.value
    if habit_str not in ALLOWED_HABITS:
        raise HTTPException(status_code=400, detail=f"Invalid habit: {habit_str}")
    try:
        await update_progress_status(
            db=db, date_obj=progress.date, habit=habit_str, user_id=user_id,
            updates={"status": progress.status}
        )
        logger.info(f"Updated progress for {habit_str} on {progress.date} for user {user_id}")
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, user_id: int) -> None:
    """Update multiple habit progress entries for a specific date."""
    if not ALLOWED_HABITS:
        raise HTTPException(status_code=500, detail="No habits configured in the system")
    for update in data.updates:
        habit_str = update.habit.value
        if habit_str not in ALLOWED_HABITS:
            raise HTTPException(status_code=400, detail=f"Invalid habit: {habit_str}")
    try:
        for update in data.updates:
            await update_progress_status(
                db=db, date_obj=data.date, habit=update.habit.value, user_id=user_id,
                updates={"status": update.status}
            )
        logger.info(f"Bulk update successful for date {data.date} for user {user_id}")
    except Exception as e:
        logger.error(f"Bulk update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to bulk update progress: {str(e)}")

async def get_progress_by_date(date_obj: date, db: AsyncSession, user_id: int) -> List[ProgressRead]:
    """Get progress for all habits on a specific date."""
    if not ALLOWED_HABITS:
        raise HTTPException(status_code=500, detail="No habits configured in the system")
    try:
        rows = await fetch_all_progress_by_date(db, date_obj, user_id)
        row_map = {r.habit: r for r in rows}
        completed = sum(1 for r in rows if r.status)
        completion_pct = round((completed / len(ALLOWED_HABITS)) * 100) if ALLOWED_HABITS else 0

        results: List[ProgressRead] = []
        for habit in ALLOWED_HABITS:
            if habit in row_map:
                row = row_map[habit]
                results.append(ProgressRead(
                    id=row.id, date=row.date, habit=HabitEnum(row.habit),
                    status=row.status, streak=row.streak, completion_pct=completion_pct
                ))
            else:
                await update_progress_status(
                    db=db, date_obj=date_obj, habit=habit, user_id=user_id,
                    updates={"status": False}
                )
                new_record = await fetch_progress_by_date_and_habit(db, date_obj, habit, user_id)
                results.append(ProgressRead(
                    id=new_record.id, date=new_record.date, habit=HabitEnum(new_record.habit),
                    status=new_record.status, streak=new_record.streak, completion_pct=completion_pct
                ))
        return results
    except Exception as e:
        logger.error(f"Error fetching progress for {date_obj}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")

async def get_weekly_progress(db: AsyncSession, user_id: int, start_date: Optional[date] = None) -> List[ProgressRead]:
    """Fetch progress for the last 7 days for each habit."""
    if not ALLOWED_HABITS:
        raise HTTPException(status_code=500, detail="No habits configured in the system")
    today = date.today()
    week_start = start_date or (today - timedelta(days=6))
    try:
        rows = await fetch_progress_date_range(db, week_start, today, user_id)
        row_map = {(row.date, row.habit): row for row in rows}
        results: List[ProgressRead] = []

        for i in range(7):
            current_date = week_start + timedelta(days=i)
            for habit in ALLOWED_HABITS:
                key = (current_date, habit)
                if key in row_map:
                    row = row_map[key]
                    results.append(ProgressRead(
                        id=row.id, date=row.date, habit=HabitEnum(row.habit),
                        status=row.status, streak=row.streak, completion_pct=None
                    ))
                else:
                    # Check if record exists before inserting
                    existing = await fetch_progress_by_date_and_habit(db, current_date, habit, user_id)
                    if not existing:
                        await update_progress_status(
                            db=db, date_obj=current_date, habit=habit, user_id=user_id,
                            updates={"status": False}
                        )
                        new_record = await fetch_progress_by_date_and_habit(db, current_date, habit, user_id)
                        results.append(ProgressRead(
                            id=new_record.id, date=new_record.date, habit=HabitEnum(new_record.habit),
                            status=new_record.status, streak=new_record.streak, completion_pct=None
                        ))
                    else:
                        results.append(ProgressRead(
                            id=existing.id, date=existing.date, habit=HabitEnum(existing.habit),
                            status=existing.status, streak=existing.streak, completion_pct=None
                        ))
        logger.info(f"Weekly progress fetched for user {user_id}")
        return results
    except Exception as e:
        logger.error(f"Error fetching weekly progress: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly progress: {str(e)}")
    
async def get_completion_stats(db: AsyncSession, user_id: int, start_date: date, end_date: date) -> Dict[str, float]:
    """Calculate habit completion percentages for a date range."""
    try:
        rows = await fetch_progress_date_range(db, start_date, end_date, user_id)
        habit_counts = {}
        habit_totals = {}
        for row in rows:
            habit_counts[row.habit] = habit_counts.get(row.habit, 0) + (1 if row.status else 0)
            habit_totals[row.habit] = habit_totals.get(row.habit, 0) + 1
        days = (end_date - start_date).days + 1
        habits = await fetch_all_habits(db, user_id)
        stats = {
            habit: (habit_counts.get(habit, 0) / habit_totals.get(habit, days)) * 100
            for habit in habits
        }
        logger.info(f"Completion stats calculated for user {user_id}")
        return stats
    except Exception as e:
        logger.error(f"Error calculating completion stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate completion stats: {str(e)}")

async def fill_missing_data(db: AsyncSession, habits: List[str], user_id: int) -> None:
    """Fill missing progress records with default status=False for a user."""
    today = date.today()
    try:
        for habit in habits:
            for i in range(31):  # Last 30 days + today
                current_date = today - timedelta(days=i)
                # Let update_progress_status handle existence check
                await update_progress_status(
                    db=db, date_obj=current_date, habit=habit, user_id=user_id,
                    updates={"status": False}
                )
        logger.info(f"Missing data filled for user {user_id}")
    except Exception as e:
        logger.error(f"Error filling missing data for user {user_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to fill missing data: {str(e)}")

async def patch_progress_record(progress_id: int, updates: ProgressUpdate, db: AsyncSession, user_id: int) -> ProgressRead:
    """Patch a specific progress record by ID."""
    try:
        result = await db.execute(select(Progress).where(Progress.id == progress_id, Progress.user_id == user_id))
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Progress record not found or unauthorized")
        updates_dict = updates.dict(exclude_unset=True)
        if not updates_dict:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        for key, value in updates_dict.items():
            setattr(record, key, value)
        await db.commit()
        await db.refresh(record)
        return ProgressRead.from_orm(record)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error patching progress record {progress_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to patch progress record: {str(e)}")