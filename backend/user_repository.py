import logging
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import User

logger = logging.getLogger(__name__)

async def find_user_by_google_sub(db: AsyncSession, google_sub: str):
    """Find a user by Google sub using SQLAlchemy ORM."""
    logger.info(f"Searching for user with google_sub: {google_sub}")
    try:
        query = select(User).where(User.google_sub == google_sub)
        result = await db.execute(query)
        user = result.scalars().first()
        if user:
            logger.info(f"Found user: {user}")
        else:
            logger.info("No user found with that google_sub.")
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error while searching for user: {e}")
        return None

async def get_or_create_user(db: AsyncSession, google_sub: str, email: str, name: str, avatar_url: str):
    """Retrieve a user by Google sub or email. Create a new user if none exists."""
    logger.info(f"[get_or_create_user] Checking for user with google_sub: {google_sub} or email: {email}")
    try:
        stmt = select(User).where((User.google_sub == google_sub) | (User.email == email))
        result = await db.execute(stmt)
        user = result.scalars().first()

        if user:
            logger.info(f"[get_or_create_user] User found: {user}")
            # Update `google_sub` if missing
            if not user.google_sub:
                user.google_sub = google_sub
                await db.commit()
            return user

        # User not found, create a new record
        new_user = User(
            google_sub=google_sub,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )

        try:
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
        except IntegrityError:
            await db.rollback()
            logger.warning(f"[get_or_create_user] User already exists: google_sub={google_sub}, email={email}")
            return await get_or_create_user(db, google_sub, email, name, avatar_url)  # Re-fetch the user
        except SQLAlchemyError as e:
            logger.error(f"[get_or_create_user] Unexpected DB error: {e}")
            await db.rollback()
            raise

        logger.info(f"[get_or_create_user] Created new user: {new_user}")
        return new_user
    except SQLAlchemyError as e:
        logger.error(f"[get_or_create_user] Error: {e}")
        await db.rollback()
        raise
