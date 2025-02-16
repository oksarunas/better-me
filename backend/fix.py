# fix.py
import asyncio
import logging
from datetime import date, timedelta, datetime  
from database import async_session_maker, init_db
from logic import recalc_all_streaks, bulk_update_progress
from schemas import BulkUpdate, ProgressUpdate
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def fetch_all_habits(db) -> List[str]:
    """Fetch all unique habits from the database."""
    try:
        result = await db.execute("SELECT DISTINCT habit FROM progress")
        habits = [row[0] for row in result.fetchall()]
        logger.info(f"Fetched habits: {habits}")
        return habits
    except Exception as e:
        logger.error(f"Error fetching habits: {e}")
        raise


from datetime import datetime, date, timedelta
from database import async_session_maker, init_db
from logic import recalc_all_streaks, bulk_update_progress
from schemas import BulkUpdate, ProgressUpdate
import logging

logger = logging.getLogger(__name__)

async def fill_missing_data(db, allowed_habits):
    """Ensure all habits are present for every date from the earliest DB date up to today."""
    try:
        # 1. Find the earliest date in the DB
        result = await db.execute("SELECT MIN(date) FROM progress")
        earliest_db_date = result.fetchone()[0]
        
        if earliest_db_date is None:
            # If there's no data in the DB at all, start from today
            earliest_db_date = date.today()
        else:
            # If earliest_db_date is a string, parse it
            if isinstance(earliest_db_date, str):
                # Adjust the format below if your DB string format is different
                earliest_db_date = datetime.strptime(earliest_db_date, "%Y-%m-%d").date()

        # 2. Determine today's date
        end_date = date.today()

        # 3. Iterate day by day from earliest_db_date to today
        current_date = earliest_db_date
        while current_date <= end_date:
            # Fetch existing habits for the current date
            existing_result = await db.execute(
                "SELECT habit FROM progress WHERE date = :date",
                {"date": current_date.isoformat()}  # pass as string if your DB column is text
            )
            existing_habits = {row[0] for row in existing_result.fetchall()}

            # Identify missing habits
            missing_habits = set(allowed_habits) - existing_habits

            # If we have missing habits for this date, fill them
            if missing_habits:
                updates = [
                    ProgressUpdate(habit=habit, status=False)
                    for habit in missing_habits
                ]
                bulk_data = BulkUpdate(date=current_date, updates=updates)
                await bulk_update_progress(
                    data=bulk_data,
                    db=db
                )
                logger.info(f"Filled missing habits for date {current_date}.")
            else:
                logger.info(f"All habits are already present for date {current_date}.")

            # Move on to the next day
            current_date += timedelta(days=1)

        logger.info("Finished checking and filling missing data for all dates.")
    except Exception as e:
        logger.error(f"Error while filling missing data: {e}")
        raise



async def main():
    try:
        # Initialize the database
        logger.info("Initializing the database...")
        await init_db()

        async with async_session_maker() as db:
            # Fetch all habits dynamically
            logger.info("Fetching all habits...")
            allowed_habits = await fetch_all_habits(db)

            # Fill missing data
            logger.info("Filling missing data...")
            await fill_missing_data(db=db, allowed_habits=allowed_habits)

        # Recalculate streaks
        logger.info("Starting streak recalculation...")
        async with async_session_maker() as db:
            await recalc_all_streaks(db)
        logger.info("Streak recalculation completed successfully.")
    except Exception as e:
        logger.error(f"An error occurred: {e}")


if __name__ == "__main__":
    asyncio.run(main())
