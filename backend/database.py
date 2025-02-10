import logging
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# Import configuration
from config import Config

# ✅ MOVE THIS TO THE TOP to avoid SyntaxError
from models import *  # Ensure models are registered at module level

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database engine setup
DATABASE_URL = Config.DATABASE_URL
engine = create_async_engine(
    DATABASE_URL,
    echo=Config.DEBUG
)

# Async session factory
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

async def init_db(retries: int = 3, delay: float = 2.0) -> None:
    """Initialize the database and create tables with retry logic."""
    for attempt in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Database initialized successfully.")
                return
        except SQLAlchemyError as e:
            logger.error(f"Database initialization failed (Attempt {attempt + 1}): {str(e)}")
            if attempt < retries - 1:
                await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
            else:
                raise

@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Asynchronous context manager for database sessions."""
    session = async_session_maker()
    try:
        yield session
    except SQLAlchemyError as e:
        logger.error(f"Session error: {str(e)}")
        await session.rollback()
        raise
    finally:
        try:
            await session.close()
        except Exception as e:
            logger.error(f"Failed to close session: {str(e)}")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    async with get_db_session() as session:
        yield session

async def dispose_engine() -> None:
    """Dispose of the database engine gracefully."""
    try:
        await engine.dispose()
        logger.info("Database engine disposed.")
    except Exception as e:
        logger.error(f"Error disposing database engine: {str(e)}")
