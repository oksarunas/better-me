import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.warning("DATABASE_URL not set. Falling back to default SQLite database.")
    DATABASE_URL = "sqlite+aiosqlite:///progress.db"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true"  # Enable SQL echo in debug mode
)

# Create session factory
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Initialize database
async def init_db() -> None:
    """
    Initialize the database by creating all tables defined in models.

    Raises:
        SQLAlchemyError: If initialization fails.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully.")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

# Dependency for FastAPI
@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager to provide a database session.

    Yields:
        AsyncSession: SQLAlchemy async session object.
    """
    session = async_session_maker()
    try:
        yield session
    except SQLAlchemyError as e:
        logger.error(f"Session error: {str(e)}")
        await session.rollback()
        raise
    finally:
        await session.close()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI routes to provide a database session.

    Yields:
        AsyncSession: SQLAlchemy async session object.
    """
    async with get_db_session() as session:
        yield session
