# logic.py
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from schemas import ProgressCreate, BulkUpdate, ProgressRead
from typing import List
from datetime import date

async def get_progress_by_date(date: date, db: AsyncSession, allowed_habits: List[str]) -> List[ProgressRead]:
    """
    Retrieve progress for a specific date. If no progress exists, return defaults.
    """
    result = await db.execute(
        text("SELECT id, date, habit, status FROM progress WHERE date = :date"), {"date": date}
    )
    progress_records = result.fetchall()

    if not progress_records:
        logging.info(f"No records found for {date}. Returning default habits.")
        return [
            ProgressRead(id=0, date=date, habit=habit, status=False)  # Use 0 or a placeholder for id
            for habit in allowed_habits
        ]

    return [
        ProgressRead(id=record.id, date=record.date, habit=record.habit, status=record.status)
        for record in progress_records
    ]


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
