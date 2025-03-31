import logging
from datetime import date
from typing import List, Optional, Mapping, Any
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, MultipleResultsFound
from sqlalchemy.ext.asyncio import AsyncSession
from models import User, Progress

logger = logging.getLogger(__name__)

# User-related functions
async def find_user_by_google_sub(db: AsyncSession, google_sub: str) -> Optional[User]:
    """Find a user by Google sub."""
    try:
        query = select(User).where(User.google_sub == google_sub)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        logger.debug(f"User with google_sub {google_sub}: {user if user else 'not found'}")
        return user
    except SQLAlchemyError as e:
        logger.error(f"Error finding user by google_sub {google_sub}: {e}")
        raise

async def get_or_create_user(
    db: AsyncSession,
    google_sub: str | None,
    email: str,
    name: str | None,
    avatar_url: str | None
) -> User:
    """Get or create a user based on email or Google sub."""
    try:
        # Try to find existing user by email
        result = await db.execute(select(User).where(User.email == email))
        try:
            user = result.scalar_one_or_none()
        except MultipleResultsFound:
            # If multiple users exist, take the first one
            user = result.scalars().first()
            logger.warning(f"Multiple users found for email={email}, using first: User(id={user.id})")

        if user:
            logger.info(f"Found user: User(id={user.id}, email={user.email}, name={user.name})")
            return user

        # If no user found, create a new one
        user = User(
            google_sub=google_sub,
            email=email,
            name=name,
            avatar_url=avatar_url
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Created user: User(id={user.id}, email={user.email}, name={user.name})")
        return user

    except Exception as e:
        logger.error(f"Error in get_or_create_user: {e}")
        await db.rollback()
        raise

# Progress-related functions
async def fetch_progress_by_date_and_habit(
    db: AsyncSession, date_obj: date, habit: str, user_id: int
) -> Optional[Progress]:
    """Fetch a progress record for a specific date, habit, and user."""
    try:
        query = select(Progress).where(
            Progress.date == date_obj,
            Progress.habit == habit,
            Progress.user_id == user_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"Error fetching progress for {date_obj}, {habit}, user {user_id}: {e}")
        raise

async def update_progress_status(
    db: AsyncSession, date_obj: date, habit: Optional[str], user_id: int, updates: Mapping[str, Any]
) -> None:
    """Update or create a progress record for single or multiple habits."""
    try:
        if habit:  # Single habit update
            # Check for existing record first
            existing = await fetch_progress_by_date_and_habit(db, date_obj, habit, user_id)
            if existing:
                await db.execute(
                    update(Progress).where(Progress.id == existing.id).values(**updates)
                )
            else:
                db.add(Progress(date=date_obj, habit=habit, user_id=user_id, **updates))
        else:  # Multiple habits
            for habit_key, values in updates.items():
                existing = await fetch_progress_by_date_and_habit(db, date_obj, habit_key, user_id)
                if existing:
                    await db.execute(
                        update(Progress).where(Progress.id == existing.id).values(**values)
                    )
                else:
                    db.add(Progress(date=date_obj, habit=habit_key, user_id=user_id, **values))
        await db.commit()
    except SQLAlchemyError as e:
        logger.error(f"Error updating progress for {habit or 'multiple habits'} on {date_obj}: {e}")
        await db.rollback()
        raise

async def fetch_all_progress_by_date(
    db: AsyncSession, start_date: date, user_id: int, end_date: Optional[date] = None
) -> List[Progress]:
    """Fetch all progress records for a date or range."""
    try:
        query = select(Progress).where(Progress.user_id == user_id)
        if end_date:
            query = query.where(Progress.date.between(start_date, end_date))
        else:
            query = query.where(Progress.date == start_date)
        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Error fetching progress for user {user_id}: {e}")
        raise

async def fetch_progress_date_range(
    db: AsyncSession, start_date: date, end_date: date, user_id: int
) -> List[Progress]:
    """Fetch progress records for a date range."""
    try:
        query = select(Progress).where(
            Progress.date.between(start_date, end_date),
            Progress.user_id == user_id,
        ).order_by(Progress.date)
        result = await db.execute(query)
        return result.scalars().all()
    except SQLAlchemyError as e:
        logger.error(f"Error fetching progress range for user {user_id}: {e}")
        raise

async def fetch_all_habits(db: AsyncSession, user_id: int) -> List[str]:
    """Fetch all distinct habits for a user."""
    try:
        query = select(Progress.habit).where(Progress.user_id == user_id).distinct().order_by(Progress.habit)
        result = await db.execute(query)
        habits = result.scalars().all()
        logger.debug(f"Fetched habits for user {user_id}: {habits}")
        return habits
    except SQLAlchemyError as e:
        logger.error(f"Error fetching habits for user {user_id}: {e}")
        raise