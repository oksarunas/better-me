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


async def fill_missing_data(db, allowed_habits):
    """Ensure all habits are present for every date in the database."""
    try:
        # Fetch all unique dates from the database
        result = await db.execute("SELECT DISTINCT date FROM progress ORDER BY date")
        dates = [row[0] for row in result.fetchall()]

        if not dates:
            logger.info("No dates found in the database.")
            return

        # Iterate through each date and ensure all habits are present
        for current_date in dates:
            # Fetch existing habits for the current date
            existing_result = await db.execute(
                "SELECT habit FROM progress WHERE date = :date", {"date": current_date}
            )
            existing_habits = {row[0] for row in existing_result.fetchall()}

            # Identify missing habits
            missing_habits = set(allowed_habits) - existing_habits

            if missing_habits:
                # Prepare default entries for missing habits
                updates = [
                    ProgressUpdate(habit=habit, status=False) for habit in missing_habits
                ]

                # Create BulkUpdate object
                bulk_data = BulkUpdate(date=current_date, updates=updates)

                # Perform bulk update
                await bulk_update_progress(data=bulk_data, db=db, allowed_habits=allowed_habits)
                logger.info(f"Filled missing habits for date {current_date}.")
            else:
                logger.info(f"All habits are already present for date {current_date}.")

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
