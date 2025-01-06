# logic.py

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from schemas import ProgressCreate, BulkUpdate, ProgressRead
from typing import List
from datetime import date

def log_error(error_message: str):
    """Logs an error with a standardized format."""
    logging.error(f"[LOGIC ERROR]: {error_message}")


# -----------------------------------------------------------------
# 1. Helper functions to fetch data from DB (no streak calculation)
# -----------------------------------------------------------------

async def fetch_progress_by_date_and_habit(db: AsyncSession, date: date, habit: str):
    """
    Fetch a progress record for a specific date and habit.
    Returns None if not found.
    """
    try:
        result = await db.execute(
            text("""
                SELECT id, date, habit, status, streak
                FROM progress
                WHERE date = :date AND habit = :habit
            """),
            {"date": date, "habit": habit}
        )
        return result.fetchone()
    except Exception as e:
        log_error(f"Error fetching progress for date={date}, habit={habit}: {e}")
        return None


async def fetch_all_progress_by_date(db: AsyncSession, date: date):
    """
    Fetch all progress records for a specific date, returning a dict keyed by habit.
    Example: {"Breakfast": <Row>, "Workout": <Row>, ...}
    """
    try:
        result = await db.execute(
            text("""
                SELECT id, date, habit, status, streak
                FROM progress
                WHERE date = :date
            """),
            {"date": date}
        )
        rows = result.fetchall()
        return {row.habit: row for row in rows}
    except Exception as e:
        log_error(f"Error fetching all progress for date={date}: {e}")
        return {}


# -----------------------------------------------------------------
# 2. Primary Endpoints
# -----------------------------------------------------------------

async def get_progress_by_date(date: date, db: AsyncSession, allowed_habits: List[str]) -> List[ProgressRead]:
    """
    Returns the progress for the specified date from the database.
    Ensures each habit has a row for that date (status=False, streak=0 if missing).
    Then returns the stored streak without recalculating it.
    """
    # 1) Fetch all progress for this date
    records = await fetch_all_progress_by_date(db, date)

    # 2) Insert missing habits with defaults if needed
    existing_habits = set(records.keys())
    missing_habits = [h for h in allowed_habits if h not in existing_habits]
    if missing_habits:
        for habit in missing_habits:
            await db.execute(
                text("""
                    INSERT INTO progress (date, habit, status, streak)
                    VALUES (:date, :habit, false, 0)
                """),
                {"date": date, "habit": habit}
            )
        await db.commit()
        # Reload after insertion
        records = await fetch_all_progress_by_date(db, date)

    # 3) Build the result using DB's stored streak
    progress_data = []
    for habit in allowed_habits:
        row = records.get(habit)
        if row:
            progress_data.append(
                ProgressRead(
                    id=row.id,
                    date=row.date,
                    habit=row.habit,
                    status=row.status,
                    streak=row.streak  # use DB value
                )
            )
        else:
            # Should not happen if we just inserted missing rows, but as a fallback:
            progress_data.append(
                ProgressRead(
                    id=0,
                    date=date,
                    habit=habit,
                    status=False,
                    streak=0
                )
            )

    return progress_data


async def update_progress(progress: ProgressCreate, db: AsyncSession):
    """
    Updates a single habit's status for a given date, then recalculates
    the streak for *all* dates of that habit in ascending order.
    """
    try:
        # 1) Check if today's row exists
        result = await db.execute(
            text("""
                SELECT id FROM progress
                WHERE date = :date AND habit = :habit
            """),
            {"date": progress.date, "habit": progress.habit}
        )
        existing = result.fetchone()

        # 2) Insert or Update today's row
        if not existing:
            await db.execute(
                text("""
                    INSERT INTO progress (date, habit, status, streak)
                    VALUES (:date, :habit, :status, 0)
                """),
                {"date": progress.date, "habit": progress.habit, "status": progress.status}
            )
        else:
            await db.execute(
                text("""
                    UPDATE progress
                    SET status = :status
                    WHERE date = :date AND habit = :habit
                """),
                {"status": progress.status, "date": progress.date, "habit": progress.habit}
            )

        # 3) Recompute streak for all rows of this habit
        rows_result = await db.execute(
            text("""
                SELECT id, date, status
                FROM progress
                WHERE habit = :habit
                ORDER BY date ASC
            """),
            {"habit": progress.habit}
        )
        rows = rows_result.fetchall()

        streak_counter = 0
        for row in rows:
            db_id = row.id
            db_status = row.status

            # Convert to bool if needed (if row.status is bool, int, or str)
            if isinstance(db_status, bool):
                status_bool = db_status
            elif isinstance(db_status, int):
                status_bool = (db_status == 1)
            elif isinstance(db_status, str):
                status_bool = db_status.lower() in ["true", "1"]
            else:
                status_bool = False

            if status_bool:
                streak_counter += 1
            else:
                streak_counter = 0

            await db.execute(
                text("""
                    UPDATE progress
                    SET streak = :streak
                    WHERE id = :id
                """),
                {"streak": streak_counter, "id": db_id}
            )

        # 4) Commit changes
        await db.commit()

    except Exception as e:
        log_error(f"Error updating progress (habit={progress.habit}, date={progress.date}): {e}")
        await db.rollback()
        raise


async def bulk_update_progress(data: BulkUpdate, db: AsyncSession, allowed_habits: List[str]):
    """
    Bulk-updates multiple habits' statuses for a single date,
    then recalculates streak for each changed habit.
    """
    try:
        updated_habits = set()

        # 1) Update each habit's status or insert a new row if missing
        for item in data.updates:
            if item.habit not in allowed_habits:
                logging.warning(f"Invalid habit in bulk update: {item.habit}")
                continue

            # Check if row exists
            row_check = await db.execute(
                text("""
                    SELECT id FROM progress
                    WHERE date = :date AND habit = :habit
                """),
                {"date": data.date, "habit": item.habit}
            )
            existing = row_check.fetchone()

            if not existing:
                await db.execute(
                    text("""
                        INSERT INTO progress (date, habit, status, streak)
                        VALUES (:date, :habit, :status, 0)
                    """),
                    {"date": data.date, "habit": item.habit, "status": item.status}
                )
            else:
                await db.execute(
                    text("""
                        UPDATE progress
                        SET status = :status
                        WHERE date = :date AND habit = :habit
                    """),
                    {"status": item.status, "date": data.date, "habit": item.habit}
                )

            updated_habits.add(item.habit)

        # 2) Recalculate streak for each habit that was updated
        for habit in updated_habits:
            rows_result = await db.execute(
                text("""
                    SELECT id, date, status
                    FROM progress
                    WHERE habit = :habit
                    ORDER BY date ASC
                """),
                {"habit": habit}
            )
            rows = rows_result.fetchall()

            streak_counter = 0
            for row in rows:
                db_id = row.id
                db_status = row.status

                if isinstance(db_status, bool):
                    status_bool = db_status
                elif isinstance(db_status, int):
                    status_bool = (db_status == 1)
                elif isinstance(db_status, str):
                    status_bool = db_status.lower() in ["true", "1"]
                else:
                    status_bool = False

                if status_bool:
                    streak_counter += 1
                else:
                    streak_counter = 0

                await db.execute(
                    text("""
                        UPDATE progress
                        SET streak = :streak
                        WHERE id = :id
                    """),
                    {"streak": streak_counter, "id": db_id}
                )

        await db.commit()

    except Exception as e:
        log_error(f"Error performing bulk update for date={data.date}: {e}")
        await db.rollback()
        raise


# -----------------------------------------------------------------
# 3. Maintenance: recalc_all_streaks
# -----------------------------------------------------------------

async def recalc_all_streaks(db: AsyncSession):
    """
    Recalculate streaks for EVERY habit in the database from day one to the latest entry.
    Useful as a "maintenance" or "emergency" fix if data ever goes out of sync.
    """
    try:
        # 1) Fetch all distinct habits
        habits_result = await db.execute(
            text("SELECT DISTINCT habit FROM progress")
        )
        distinct_habits = [row[0] for row in habits_result.fetchall()]

        # 2) For each habit, fetch rows in ascending date order and recalc
        for habit in distinct_habits:
            rows_result = await db.execute(
                text("""
                    SELECT id, date, status
                    FROM progress
                    WHERE habit = :habit
                    ORDER BY date ASC
                """),
                {"habit": habit}
            )
            rows = rows_result.fetchall()

            streak_counter = 0
            for row in rows:
                db_id = row.id
                db_status = row.status

                # Convert to bool if needed
                if isinstance(db_status, bool):
                    status_bool = db_status
                elif isinstance(db_status, int):
                    status_bool = (db_status == 1)
                elif isinstance(db_status, str):
                    status_bool = db_status.lower() in ["true", "1"]
                else:
                    status_bool = False

                if status_bool:
                    streak_counter += 1
                else:
                    streak_counter = 0

                await db.execute(
                    text("""
                        UPDATE progress
                        SET streak = :streak
                        WHERE id = :id
                    """),
                    {"streak": streak_counter, "id": db_id}
                )

        await db.commit()
        logging.info("All streaks have been recalculated successfully.")

    except Exception as e:
        logging.error(f"Error while recalculating streaks: {e}")
        await db.rollback()
        raise
