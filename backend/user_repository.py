import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

# Import your User model (adjust the path as needed)
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
    Retrieve a user by Google sub. If the user doesn't exist, create a new user record.
    """
    logger.info(f"Attempting to get or create user: google_sub={google_sub}, email={email}")
    try:
        # Look up the user by google_sub
        result = await db.execute(
            text("SELECT * FROM users WHERE google_sub = :google_sub"),
            {"google_sub": google_sub}
        )
        user = result.scalar_one_or_none()
        if user:
            logger.info(f"User already exists: {user}")
            return user
        
        logger.info("User not found, creating a new user.")
        # If not found, create a new user
        new_user = User(
            google_sub=google_sub,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"Created new user: {new_user}")
        return new_user
    except SQLAlchemyError as e:
        logger.error(f"Error in get_or_create_user: {e}")
        await db.rollback()
        raise
