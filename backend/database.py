import logging
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from config import Config
from models import Base  # Import Base from models.py

logger = logging.getLogger(__name__)

# Database engine setup
engine = create_async_engine(
    Config.DATABASE_URL,
    echo=Config.DEBUG,
)

# Async session factory
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db(retries: int = 3, delay: float = 2.0) -> None:
    """Initialize the database and create tables with retry logic."""
    for attempt in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully")
            return
        except SQLAlchemyError as e:
            logger.error(f"Database init failed (Attempt {attempt + 1}/{retries}): {e}")
            if attempt == retries - 1:
                raise
            await asyncio.sleep(delay * (2 ** attempt))

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
        except SQLAlchemyError as e:
            logger.error(f"Session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

async def dispose_engine() -> None:
    """Dispose of the database engine gracefully."""
    try:
        await engine.dispose()
        logger.info("Database engine disposed")
    except Exception as e:
        logger.error(f"Failed to dispose database engine: {e}")
        raise