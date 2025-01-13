from sqlalchemy import Column, Integer, String, Boolean, Date, text, select, insert, update
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


# SQL Queries as constants for better maintenance
SQL_QUERIES = {
    "fetch_by_date_habit": """
        SELECT id, date, habit, status, streak
        FROM progress
        WHERE date = :date AND habit = :habit
    """,
    
    "fetch_by_date": """
        SELECT id, date, habit, status, streak
        FROM progress
        WHERE date = :date
        ORDER BY habit
    """,
    
    "check_exists": """
        SELECT id FROM progress
        WHERE date = :date AND habit = :habit
    """,
    
    "update_status": """
        UPDATE progress
        SET status = :status
        WHERE date = :date AND habit = :habit
    """,
    
    "insert_progress": """
        INSERT INTO progress (date, habit, status, streak)
        VALUES (:date, :habit, :status, 0)
    """,
    
    "fetch_habits": """
        SELECT DISTINCT habit 
        FROM progress 
        ORDER BY habit
    """,
    
    "fetch_streak_data": """
        SELECT date, status
        FROM progress
        WHERE habit = :habit
        AND date <= :end_date
        ORDER BY date DESC
        LIMIT :limit
    """
}


async def fetch_progress_by_date_and_habit(
    db: AsyncSession,
    date_obj: date,
    habit: str
) -> Optional[Progress]:
    """
    Fetch a progress record for a specific date and habit.
    
    Args:
        db: Database session
        date_obj: Date to fetch progress for
        habit: Habit name to fetch
        
    Returns:
        Progress record if found, None otherwise
        
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        result = await db.execute(
            text(SQL_QUERIES["fetch_by_date_habit"]),
            {"date": date_obj, "habit": habit}
        )
        row = result.fetchone()
        return row if row else None
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for {date_obj}, {habit}: {e}")
        raise


async def fetch_all_progress_by_date(
    db: AsyncSession,
    start_date: date,
    end_date: date = None
) -> List[Progress]:
    """
    Fetch all progress records for a given date or range.
    """
    try:
        if end_date:
            result = await db.execute(
                text("""
                    SELECT id, date, habit, status, streak
                    FROM progress
                    WHERE date BETWEEN :start_date AND :end_date
                    ORDER BY date, habit
                """),
                {"start_date": start_date, "end_date": end_date}
            )
        else:
            result = await db.execute(
                text("""
                    SELECT id, date, habit, status, streak
                    FROM progress
                    WHERE date = :start_date
                    ORDER BY habit
                """),
                {"start_date": start_date}
            )
        return result.fetchall()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress: {e}")
        raise



async def update_progress_status(
    db: AsyncSession,
    date_obj: date,
    habit: str,
    status: bool
) -> None:
    """
    Insert or update the status of a habit for a specific date.
    
    Args:
        db: Database session
        date_obj: Date to update progress for
        habit: Habit name to update
        status: New status value
        
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        # Check if record exists
        result = await db.execute(
            text(SQL_QUERIES["check_exists"]),
            {"date": date_obj, "habit": habit}
        )
        
        params = {"date": date_obj, "habit": habit, "status": status}
        
        if result.fetchone():
            # Update existing record
            await db.execute(
                text(SQL_QUERIES["update_status"]),
                params
            )
        else:
            # Insert new record
            await db.execute(
                text(SQL_QUERIES["insert_progress"]),
                params
            )
        
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error updating progress for {date_obj}, {habit}: {e}")
        raise


async def fetch_all_habits(db: AsyncSession) -> List[str]:
    """
    Fetch all distinct habits from the database.
    
    Args:
        db: Database session
        
    Returns:
        List of unique habit names
        
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        result = await db.execute(text(SQL_QUERIES["fetch_habits"]))
        return [row[0] for row in result.fetchall()]
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
        db: Database session
        habit: Habit to fetch data for
        end_date: End date for the data fetch
        limit: Maximum number of days to fetch
        
    Returns:
        List of (date, status) tuples
        
    Raises:
        SQLAlchemyError: If database operation fails
    """
    try:
        result = await db.execute(
            text(SQL_QUERIES["fetch_streak_data"]),
            {"habit": habit, "end_date": end_date, "limit": limit}
        )
        return [(row.date, row.status) for row in result.fetchall()]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching streak data for {habit}: {e}")
        raise