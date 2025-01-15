# fix.py
import asyncio
import logging
from database import async_session_maker, init_db
from logic import recalc_all_streaks

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

async def main():
    try:
        # Initialize the database
        logger.info("Initializing the database...")
        await init_db()

        # Recalculate streaks
        logger.info("Starting streak recalculation...")
        async with async_session_maker() as db:  # Correctly use async_session_maker
            await recalc_all_streaks(db)
        logger.info("Streak recalculation completed successfully.")
    except Exception as e:
        logger.error(f"An error occurred during streak recalculation: {e}")

if __name__ == "__main__":
    asyncio.run(main())
