from datetime import date
from typing import List, Optional, Tuple, Any, Mapping
import logging

from sqlalchemy import Column, Integer, String, Boolean, Date, select, update, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import relationship

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
    
    # Add a foreign key linking to the users table
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationship to the User model
    user = relationship("User", back_populates="progress")

    def __repr__(self) -> str:
        return (f"Progress(id={self.id}, date={self.date}, habit='{self.habit}', "
                f"status={self.status}, streak={self.streak}, user_id={self.user_id})")



class User(Base):
    """
    Model representing a user.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Relationship to progress records
    progress = relationship("Progress", back_populates="user")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email='{self.email}', name='{self.name}')"



async def fetch_progress_by_date_and_habit(
    db: AsyncSession,
    date_obj: date,
    habit: str
) -> Optional[Progress]:
    """
    Fetch a progress record for a specific date and habit.

    Args:
        db (AsyncSession): The database session.
        date_obj (date): The target date.
        habit (str): The habit identifier.

    Returns:
        Optional[Progress]: The matching Progress record, or None if not found.
    """
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
    """
    Fetch all progress records for a given date or a range of dates.

    Args:
        db (AsyncSession): The database session.
        start_date (date): The start date.
        end_date (Optional[date], optional): The end date. Defaults to None.

    Returns:
        List[Progress]: A list of Progress records.
    """
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
    updates: Mapping[str, Any]
) -> None:
    """
    Update an existing progress record or insert a new one for a habit.

    Args:
        db (AsyncSession): The database session.
        date_obj (date): The target date.
        habit (str): The habit identifier.
        updates (Mapping[str, Any]): A dictionary of fields to update (e.g., status, streak).

    Raises:
        SQLAlchemyError: If a database error occurs.
    """
    try:
        query = select(Progress).where(Progress.date == date_obj, Progress.habit == habit)
        result = await db.execute(query)
        existing_record = result.scalar_one_or_none()

        if existing_record:
            update_query = (
                update(Progress)
                .where(Progress.id == existing_record.id)
                .values(**updates)
            )
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
    """
    Fetch all distinct habits from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        List[str]: A list of distinct habit names.
    """
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
    """
    Fetch historical data for streak calculation.

    Args:
        db (AsyncSession): The database session.
        habit (str): The habit identifier.
        end_date (date): The end date for the data.
        limit (int, optional): Maximum number of records to retrieve. Defaults to 365.

    Returns:
        List[Tuple[date, bool]]: A list of tuples containing the date and status.
    """
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
