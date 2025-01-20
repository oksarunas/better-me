from sqlalchemy import Column, Integer, String, Boolean, Date, select, update
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from typing import List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

class Progress(Base):
    """
    SQLAlchemy model for the progress table.
    Tracks daily habit completion and streaks.
    """
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    habit = Column(String, nullable=False, index=True)
    status = Column(Boolean, nullable=False, default=False)
    streak = Column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"Progress(id={self.id}, date={self.date}, habit='{self.habit}', status={self.status}, streak={self.streak})"


async def fetch_progress_by_date_and_habit(
    db: AsyncSession,
    date_obj: date,
    habit: str
) -> Optional[Progress]:
    """Fetch a progress record for a specific date and habit."""
    try:
        query = select(Progress).where(Progress.date == date_obj, Progress.habit == habit)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for {date_obj}, {habit}: {e}")
        raise


async def fetch_all_progress_by_date(
    db: AsyncSession,
    start_date: date,
    end_date: Optional[date] = None
) -> List[Progress]:
    """Fetch all progress records for a given date or range."""
    try:
        if end_date:
            query = select(Progress).where(Progress.date.between(start_date, end_date))
        else:
            query = select(Progress).where(Progress.date == start_date)
        
        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress: {e}")
        raise


async def update_progress_status(
    db: AsyncSession,
    date_obj: date,
    habit: str,
    updates: dict
) -> None:
    """Update or insert progress for a habit."""
    try:
        query = select(Progress).where(Progress.date == date_obj, Progress.habit == habit)
        result = await db.execute(query)
        existing_record = result.scalar_one_or_none()

        if existing_record:
            update_query = update(Progress).where(
                Progress.id == existing_record.id
            ).values(**updates)
            await db.execute(update_query)
        else:
            new_record = Progress(date=date_obj, habit=habit, **updates)
            db.add(new_record)

        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error updating progress for {date_obj}, {habit}: {e}")
        raise


async def fetch_all_habits(db: AsyncSession) -> List[str]:
    """Fetch all distinct habits from the database."""
    try:
        query = select(Progress.habit).distinct().order_by(Progress.habit)
        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching all habits: {e}")
        raise


async def fetch_streak_data(
    db: AsyncSession,
    habit: str,
    end_date: date,
    limit: int = 365
) -> List[Tuple[date, bool]]:
    """Fetch historical data for streak calculation."""
    try:
        query = (
            select(Progress.date, Progress.status)
            .where(Progress.habit == habit, Progress.date <= end_date)
            .order_by(Progress.date.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        return [(row.date, row.status) for row in result.fetchall()]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching streak data for {habit}: {e}")
        raise
