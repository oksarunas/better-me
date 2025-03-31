import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def recalculate_streaks_for_habit(db: AsyncSession, habit: str) -> None:
    """Recalculate streaks for a specific habit."""
    try:
        logger.info(f"Recalculating streaks for habit '{habit}'")
        await db.execute(
            text("""
                WITH ranked_data AS (
                    SELECT id, habit, date, status,
                           ROW_NUMBER() OVER (PARTITION BY habit ORDER BY date)
                           - ROW_NUMBER() OVER (PARTITION BY habit, status ORDER BY date) AS streak_group
                    FROM progress
                    WHERE habit = :habit AND status = true
                )
                UPDATE progress
                SET streak = COALESCE((
                    SELECT COUNT(*) 
                    FROM ranked_data 
                    WHERE ranked_data.id = progress.id AND ranked_data.streak_group IS NOT NULL
                ), 0)
                WHERE habit = :habit;
            """),
            {"habit": habit}
        )
        await db.commit()
        logger.info(f"Streaks recalculated for habit '{habit}'")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error recalculating streaks for habit '{habit}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to recalculate streaks for '{habit}': {str(e)}")

async def recalc_all_streaks(db: AsyncSession) -> None:
    """Recalculate streaks for all habits."""
    try:
        logger.info("Starting streak recalculation for all habits")
        await db.execute(
            text("""
                WITH ranked_data AS (
                    SELECT id, habit, date, status,
                           ROW_NUMBER() OVER (PARTITION BY habit ORDER BY date)
                           - ROW_NUMBER() OVER (PARTITION BY habit, status ORDER BY date) AS streak_group
                    FROM progress
                    WHERE status = true
                )
                UPDATE progress
                SET streak = COALESCE((
                    SELECT COUNT(*) 
                    FROM ranked_data 
                    WHERE ranked_data.id = progress.id AND ranked_data.streak_group IS NOT NULL
                ), 0);
            """)
        )
        await db.commit()
        logger.info("Streak recalculation completed successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during streak recalculation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to recalculate streaks: {str(e)}")