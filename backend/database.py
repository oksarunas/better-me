import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# Import configuration from the centralized config module.
from config import Config

# Configure logging (ensure this is set up early in your app, e.g., in main.py)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use centralized configuration values
DATABASE_URL = Config.DATABASE_URL

# Create the async engine using the DATABASE_URL and DEBUG flag from config
engine = create_async_engine(
    DATABASE_URL,
    echo=Config.DEBUG
)

# Create a sessionmaker for async sessions
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

async def init_db() -> None:
    """
    Initialize the database by creating all tables defined in models.
    
    This function connects to the database and creates tables based on
    the metadata of the declarative Base.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized successfully.")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Asynchronous context manager that provides a database session.
    
    It ensures that any SQLAlchemy errors are caught, the transaction is
    rolled back if necessary, and the session is properly closed.
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
    FastAPI dependency that provides a database session.
    
    This wraps the get_db_session context manager so that FastAPI routes
    can depend on it.
    """
    async with get_db_session() as session:
        yield session

async def dispose_engine() -> None:
    """
    Dispose of the database engine gracefully.
    
    This function can be called during your application's shutdown event
    to close all connections and clean up resources.
    """
    await engine.dispose()
    logger.info("Database engine disposed.")
