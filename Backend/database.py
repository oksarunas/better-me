import os
import logging
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Boolean, Date, Index
from sqlalchemy.sql import text

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Load environment variables from a .env file
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///progress.db")
engine = create_async_engine(DATABASE_URL, connect_args={"check_same_thread": False})
async_session = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

# Base class for models
Base = declarative_base()

# Progress model
class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    habit = Column(String, nullable=False)
    status = Column(Boolean, default=False)

    __table_args__ = (
        Index('ix_date_habit', "date", "habit"),
    )

# Initialize database
async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logging.info("Database initialized successfully.")
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        raise
