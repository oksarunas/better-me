from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text


async def recalculate_streaks_for_habit(db: AsyncSession, habit: str) -> None:
    """
    Recalculate streaks for a specific habit.

    This function updates the streak column for all records of a specific habit
    using SQL window functions to calculate consecutive streaks.

    Args:
        db: AsyncSession - Database session
        habit: str - Name of the habit to recalculate streaks for

    Raises:
        RuntimeError: If the database operation fails
    """
    try:
        await db.execute(
            text("""
                WITH habit_data AS (
                    SELECT
                        id,
                        status,
                        date,
                        CASE
                            WHEN status THEN 1
                            ELSE 0
                        END AS streak_status,
                        ROW_NUMBER() OVER (
                            PARTITION BY CASE WHEN status THEN 1 ELSE 0 END
                            ORDER BY date ASC
                        ) AS group_number
                    FROM progress
                    WHERE habit = :habit
                ),
                streak_calculation AS (
                    SELECT
                        id,
                        streak_status,
                        SUM(streak_status) OVER (
                            PARTITION BY habit_data.group_number ORDER BY date
                        ) AS calculated_streak
                    FROM habit_data
                )
                UPDATE progress
                SET streak = streak_calculation.calculated_streak
                FROM streak_calculation
                WHERE progress.id = streak_calculation.id
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

    This function updates the streak column for all habits in the progress table
    using SQL window functions to calculate consecutive streaks.

    Args:
        db: AsyncSession - Database session

    Raises:
        RuntimeError: If the database operation fails
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
                        CASE
                            WHEN status THEN 1
                            ELSE 0
                        END AS streak_status,
                        ROW_NUMBER() OVER (
                            PARTITION BY habit, CASE WHEN status THEN 1 ELSE 0 END
                            ORDER BY date ASC
                        ) AS group_number
                    FROM progress
                ),
                streak_calculation AS (
                    SELECT
                        id,
                        streak_status,
                        SUM(streak_status) OVER (
                            PARTITION BY habit, habit_data.group_number ORDER BY date
                        ) AS calculated_streak
                    FROM habit_data
                )
                UPDATE progress
                SET streak = streak_calculation.calculated_streak
                FROM streak_calculation
                WHERE progress.id = streak_calculation.id
            """)
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Error recalculating streaks for all habits: {e}")
