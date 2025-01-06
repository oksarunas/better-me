# fix_streaks.py
import asyncio
import logging
from database import async_session, init_db
from logic import recalc_all_streaks

async def main():
    # Initialize DB (creates tables if needed)
    await init_db()

    # Use a session for the recalc function
    async with async_session() as db:
        await recalc_all_streaks(db)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
