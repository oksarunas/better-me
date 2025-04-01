import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models import Progress
from fastapi import HTTPException

logger = logging.getLogger(__name__)

async def recalculate_streaks_for_habit(db: AsyncSession, habit: str, user_id: int) -> None:
    """Recalculate streaks for a specific habit and user."""
    try:
        logger.info(f"Recalculating streaks for habit '{habit}' and user {user_id}")
        # Fetch all progress records for the habit and user, ordered by date
        query = (
            select(Progress)
            .where(Progress.habit == habit, Progress.user_id == user_id)
            .order_by(Progress.date)
        )
        result = await db.execute(query)
        records = result.scalars().all()

        current_streak = 0
        for record in records:
            if record.status:
                current_streak += 1
            else:
                current_streak = 0
            # Update streak if changed
            if record.streak != current_streak:
                await db.execute(
                    update(Progress)
                    .where(Progress.id == record.id)
                    .values(streak=current_streak)
                )
        
        await db.commit()
        logger.info(f"Streaks recalculated for habit '{habit}' and user {user_id}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error recalculating streaks for habit '{habit}' and user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to recalculate streaks for '{habit}': {str(e)}")

async def recalc_all_streaks(db: AsyncSession) -> None:
    """Recalculate streaks for all habits and users."""
    try:
        logger.info("Starting streak recalculation for all habits")
        # Fetch all distinct user_id and habit combinations
        query = select(Progress.user_id, Progress.habit).distinct()
        result = await db.execute(query)
        user_habit_pairs = result.all()

        for user_id, habit in user_habit_pairs:
            # Fetch records for this user and habit
            subquery = (
                select(Progress)
                .where(Progress.user_id == user_id, Progress.habit == habit)
                .order_by(Progress.date)
            )
            subresult = await db.execute(subquery)
            records = subresult.scalars().all()

            current_streak = 0
            for record in records:
                if record.status:
                    current_streak += 1
                else:
                    current_streak = 0
                if record.streak != current_streak:
                    await db.execute(
                        update(Progress)
                        .where(Progress.id == record.id)
                        .values(streak=current_streak)
                    )

        await db.commit()
        logger.info("Streak recalculation completed successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during streak recalculation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to recalculate streaks: {str(e)}")