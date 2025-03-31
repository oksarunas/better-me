import asyncio
import logging
from database import async_session_maker, init_db
from logic import fill_missing_data
from streak_calculations import recalc_all_streaks
from schemas import ALLOWED_HABITS

logger = logging.getLogger(__name__)

async def run_fix(user_id: int = 2) -> None:
    """Run data consistency fixes and streak recalculation for a user."""
    try:
        await init_db()  # Ensure tables are created
        async with async_session_maker() as db:
            logger.info(f"Starting fix for user {user_id}")
            await fill_missing_data(db, ALLOWED_HABITS, user_id)
            logger.info("Missing data filled; recalculating streaks...")
            await recalc_all_streaks(db)
            logger.info(f"Fix completed successfully for user {user_id}")
    except Exception as e:
        logger.error(f"Fix failed for user {user_id}: {e}")
        raise  # Re-raise to exit with error code

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    asyncio.run(run_fix())