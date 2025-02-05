import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.future import select  # Use select from sqlalchemy.future for async queries
from sqlalchemy.ext.asyncio import AsyncSession
from models import User

logger = logging.getLogger(__name__)

async def find_user_by_google_sub(db: AsyncSession, google_sub: str):
    logger.info(f"Searching for user with google_sub: {google_sub}")
    query = text("SELECT * FROM users WHERE google_sub = :google_sub")
    result = await db.execute(query, {"google_sub": google_sub})
    user = result.fetchone()
    if user:
        logger.info(f"Found user in database: {user}")
    else:
        logger.info("No user found with that google_sub.")
    return user

async def get_or_create_user(db: AsyncSession, google_sub: str, email: str, name: str, avatar_url: str):
    """
    Retrieve a user by Google sub or email. If the user doesn't exist, create a new user record.
    """
    logger.info(f"[get_or_create_user] Checking for user with google_sub: {google_sub} and email: {email}")
    try:
        # First, try to find the user by google_sub using the ORM select statement.
        stmt = select(User).where(User.google_sub == google_sub)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            logger.info(f"[get_or_create_user] User found by google_sub: {user}")
            return user
        
        # If not found by google_sub, try to find by email.
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalars().first()
        if user:
            logger.info(f"[get_or_create_user] User found by email: {user}")
            # Optionally, update the user's google_sub if it's missing
            if not user.google_sub:
                logger.info("[get_or_create_user] Updating user's google_sub")
                user.google_sub = google_sub
                await db.commit()
            return user

        logger.info("[get_or_create_user] User not found, creating a new user.")
        # Create a new user record
        new_user = User(
            google_sub=google_sub,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"[get_or_create_user] Created new user: {new_user}")
        return new_user
    except SQLAlchemyError as e:
        logger.error(f"[get_or_create_user] Error: {e}")
        await db.rollback()
        raise