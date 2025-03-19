from datetime import date
from typing import List, Optional, Tuple, Any, Mapping
import logging

from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, select, update, exists
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import relationship

logger = logging.getLogger(__name__)

Base = declarative_base()

class User(Base):
    """
    Model representing a user.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String, unique=True, index=True, nullable=True)  # Made nullable for email/password auth
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for Google auth users
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Ensure cascading deletes
    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email='{self.email}', name='{self.name}')"


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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Relationship to the User model
    user = relationship("User", back_populates="progress")

    def __repr__(self) -> str:
        return (f"Progress(id={self.id}, date={self.date}, habit='{self.habit}', "
                f"status={self.status}, streak={self.streak}, user_id={self.user_id})")


async def fetch_progress_by_date_and_habit(
    db: AsyncSession,
    date_obj: date,
    habit: str,
    user_id: int
) -> Optional[Progress]:
    """
    Fetch a progress record for a specific date and habit efficiently.
    
    Args:
        db (AsyncSession): The database session.
        date_obj (date): The date to query.
        habit (str): The habit name to query.
        user_id (int): The ID of the user.
        
    Returns:
        Optional[Progress]: The progress record if found, None otherwise.
        
    Raises:
        SQLAlchemyError: If there is a database error.
    """
    try:
        # First check if the record exists
        exists_query = select(exists().where(
            Progress.date == date_obj, 
            Progress.habit == habit, 
            Progress.user_id == user_id
        ))
        exists_result = await db.execute(exists_query)
        
        if not exists_result.scalar():
            return None

        # Then fetch the record
        query = select(Progress).where(
            Progress.date == date_obj, 
            Progress.habit == habit, 
            Progress.user_id == user_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for {date_obj}, {habit}: {e}")
        raise


async def update_progress_status(
    db: AsyncSession,
    date_obj: date,
    habit: str,
    user_id: int,
    updates: Mapping[str, Any]
) -> None:
    """
    Efficiently update progress records.
    
    Args:
        db (AsyncSession): The database session.
        date_obj (date): The date of the progress record.
        habit (str): The habit name.
        user_id (int): The ID of the user.
        updates (Mapping[str, Any]): A mapping of column names to new values.
        
    Raises:
        SQLAlchemyError: If there is a database error.
    """
    try:
        # Check if the record exists
        query = select(Progress).where(
            Progress.date == date_obj, 
            Progress.habit == habit, 
            Progress.user_id == user_id
        )
        result = await db.execute(query)
        existing_record = result.scalar_one_or_none()

        if existing_record:
            # Update existing record
            await db.execute(
                update(Progress)
                .where(Progress.id == existing_record.id)
                .values(**updates)
            )
        else:
            # Create new record
            new_record = Progress(
                date=date_obj, 
                habit=habit, 
                user_id=user_id, 
                **updates
            )
            db.add(new_record)

        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error updating progress for {date_obj}, {habit}: {e}")
        raise


async def fetch_all_progress_by_date(
    db: AsyncSession,
    start_date: date,
    user_id: int,
    end_date: Optional[date] = None
) -> List[Progress]:
    """
    Fetch all progress records for a given date or a range of dates.
    
    Args:
        db (AsyncSession): The database session.
        start_date (date): The start date of the range.
        user_id (int): The ID of the user.
        end_date (Optional[date]): The end date of the range, inclusive.
            If None, only records for start_date are fetched.
        
    Returns:
        List[Progress]: A list of progress records.
        
    Raises:
        SQLAlchemyError: If there is a database error.
    """
    try:
        query = select(Progress).where(Progress.user_id == user_id)
        
        if end_date:
            query = query.where(Progress.date.between(start_date, end_date))
        else:
            query = query.where(Progress.date == start_date)

        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress: {e}")
        raise


async def fetch_progress_date_range(
    db: AsyncSession,
    start_date: date,
    end_date: date,
    user_id: int
) -> List[Progress]:
    """
    Fetch all progress records for a given date range.
    
    Args:
        db (AsyncSession): The database session.
        start_date (date): The start date of the range.
        end_date (date): The end date of the range, inclusive.
        user_id (int): The ID of the user.
        
    Returns:
        List[Progress]: A list of progress records.
        
    Raises:
        SQLAlchemyError: If there is a database error.
        ValueError: If invalid parameter types are provided.
    """
    try:
        # Validate input types
        if not isinstance(user_id, int):
            raise ValueError(f"user_id must be an integer, got {type(user_id)}")
        if not isinstance(start_date, date):
            raise ValueError(f"start_date must be a date object, got {type(start_date)}")
        if not isinstance(end_date, date):
            raise ValueError(f"end_date must be a date object, got {type(end_date)}")

        query = select(Progress).where(
            Progress.date.between(start_date, end_date),
            Progress.user_id == user_id
        ).order_by(Progress.date)
        
        result = await db.execute(query)
        return result.scalars().all()
    except (SQLAlchemyError, ValueError) as e:
        logger.error(f"Database error fetching progress for date range {start_date} to {end_date}: {e}")
        raise


async def fetch_all_habits(db: AsyncSession, user_id: int) -> List[str]:
    """
    Fetch all distinct habits from the database.
    
    Args:
        db (AsyncSession): The database session.
        user_id (int): The ID of the user whose habits to fetch.
    
    Returns:
        List[str]: A list of distinct habit names.
        
    Raises:
        SQLAlchemyError: If there is a database error.
    """
    try:
        query = select(Progress.habit).where(Progress.user_id == user_id).distinct().order_by(Progress.habit)
        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching all habits: {e}")
        raise