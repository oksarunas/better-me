from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

async def recalculate_streaks_for_habit(db: AsyncSession, habit: str) -> None:
    """
    Recalculate streaks for a specific habit.
    """
    try:
        await db.execute(
            text("""
                WITH habit_data AS (
                    SELECT
                        id,
                        habit,
                        status,
                        date,
                        LAG(date) OVER (PARTITION BY habit ORDER BY date) AS prev_date
                    FROM progress
                    WHERE habit = :habit
                ),
                streak_calculation AS (
                    SELECT
                        id,
                        habit,
                        status,
                        date,
                        CASE 
                            WHEN prev_date IS NULL OR date = prev_date + INTERVAL '1 day' THEN 1
                            ELSE 0
                        END AS streak_status,
                        SUM(
                            CASE 
                                WHEN prev_date IS NULL OR date = prev_date + INTERVAL '1 day' THEN 1
                                ELSE 0
                            END
                        ) OVER (PARTITION BY habit ORDER BY date) AS calculated_streak
                    FROM habit_data
                )
                UPDATE progress
                SET streak = streak_calculation.calculated_streak
                FROM streak_calculation
                WHERE progress.id = streak_calculation.id;
            """),
            {"habit": habit}
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Error recalculating streaks for habit '{habit}': {e}")

async def recalculate_all_streaks(db: AsyncSession) -> None:
    """
    Recalculate streaks for all habits.
    """
    try:
        await db.execute(
            text("""
                WITH habit_data AS (
                    SELECT
                        id,
                        habit,
                        status,
                        date,
                        LAG(date) OVER (PARTITION BY habit ORDER BY date) AS prev_date
                    FROM progress
                ),
                streak_calculation AS (
                    SELECT
                        id,
                        habit,
                        status,
                        date,
                        CASE 
                            WHEN prev_date IS NULL OR date = prev_date + INTERVAL '1 day' THEN 1
                            ELSE 0
                        END AS streak_status,
                        SUM(
                            CASE 
                                WHEN prev_date IS NULL OR date = prev_date + INTERVAL '1 day' THEN 1
                                ELSE 0
                            END
                        ) OVER (PARTITION BY habit ORDER BY date) AS calculated_streak
                    FROM habit_data
                )
                UPDATE progress
                SET streak = streak_calculation.calculated_streak
                FROM streak_calculation
                WHERE progress.id = streak_calculation.id;
            """)
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Error recalculating streaks for all habits: {e}")
