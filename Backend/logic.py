# logic.py
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from schemas import ProgressCreate, BulkUpdate, ProgressRead
from typing import List
from datetime import date

async def get_progress_by_date(date: date, db: AsyncSession, allowed_habits: List[str]) -> List[ProgressRead]:
    """
    Retrieve progress for a specific date, including streak calculations.
    If no progress exists, return default habits with streak = 0.
    """
    progress_data = []

    for habit in allowed_habits:
        # Fetch the current day's record
        result = await db.execute(
            text("SELECT id, date, habit, status FROM progress WHERE date = :date AND habit = :habit"),
            {"date": date, "habit": habit}
        )
        current_record = result.fetchone()

        # Calculate the streak for this habit
        streak_query = """
            SELECT COUNT(*) AS streak
            FROM (
                SELECT date, status,
                       LAG(status) OVER (ORDER BY date DESC) AS prev_status
                FROM progress
                WHERE habit = :habit
                  AND date <= :date
            ) sub
            WHERE status = 1 AND (prev_status = 1 OR prev_status IS NULL)
        """
        streak_result = await db.execute(
            text(streak_query),
            {"habit": habit, "date": date}
        )
        streak = streak_result.scalar() or 0

        if current_record:
            # Append the existing record with the calculated streak
            progress_data.append(
                ProgressRead(
                    id=current_record.id,
                    date=current_record.date,
                    habit=current_record.habit,
                    status=current_record.status,
                    streak=streak
                )
            )
        else:
            # Default entry with streak = 0
            progress_data.append(
                ProgressRead(id=0, date=date, habit=habit, status=False, streak=0)
            )

    return progress_data



async def update_progress(progress: ProgressCreate, db: AsyncSession):
    """
    Update progress for a specific habit.
    """
    result = await db.execute(
        text("SELECT * FROM progress WHERE date = :date AND habit = :habit"),
        {"date": progress.date, "habit": progress.habit}
    )
    db_record = result.fetchone()

    if db_record:
        await db.execute(
            text("UPDATE progress SET status = :status WHERE date = :date AND habit = :habit"),
            {"status": progress.status, "date": progress.date, "habit": progress.habit}
        )
    else:
        await db.execute(
            text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
            {"date": progress.date, "habit": progress.habit, "status": progress.status}
        )
    await db.commit()

async def initialize_progress(date: date, db: AsyncSession, allowed_habits: List[str]):
    """
    Initialize default progress for all habits on a given date.
    """
    result = await db.execute(
        text("SELECT habit FROM progress WHERE date = :date"), {"date": date}
    )
    existing_habits = {row.habit for row in result.fetchall()}

    for habit in allowed_habits:
        if habit not in existing_habits:
            await db.execute(
                text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
                {"date": date, "habit": habit, "status": False}
            )
    await db.commit()

async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, allowed_habits: List[str]):
    """
    Bulk update progress for multiple habits.
    """
    for update in data.updates:
        if update.habit not in allowed_habits:
            logging.warning(f"Invalid habit in bulk update: {update.habit}")
            continue

        result = await db.execute(
            text("SELECT * FROM progress WHERE date = :date AND habit = :habit"),
            {"date": data.date, "habit": update.habit}
        )
        db_record = result.fetchone()

        if db_record:
            await db.execute(
                text("UPDATE progress SET status = :status WHERE date = :date AND habit = :habit"),
                {"status": update.status, "date": data.date, "habit": update.habit}
            )
        else:
            await db.execute(
                text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
                {"date": data.date, "habit": update.habit, "status": update.status}
            )
    await db.commit()
