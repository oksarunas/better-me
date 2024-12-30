import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Boolean, Date, Index
from sqlalchemy.sql import text
from pydantic import BaseModel, validator
from typing import List
from datetime import date
from fastapi.middleware.cors import CORSMiddleware

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

# Initialize FastAPI app
app = FastAPI()

# Add CORS Middleware
class Settings(BaseModel):
    ALLOW_ORIGINS: List[str] = os.getenv("ALLOW_ORIGINS", "").split(",")

    class Config:
        env_file = ".env"

settings = Settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
async def get_db():
    async with async_session() as db:
        yield db

# Initialize database on startup
@app.on_event("startup")
async def startup():
    await init_db()

# Allowed habits
ALLOWED_HABITS = [
    "7 hours of sleep", "Breakfast", "Workout", "Code",
    "Creatine", "Read", "Vitamins", "No drink",
]

# Pydantic schemas
class ProgressBase(BaseModel):
    date: date
    habit: str
    status: bool

    @validator("habit")
    def validate_habit(cls, value):
        if value not in ALLOWED_HABITS:
            raise ValueError(f"Habit '{value}' is not valid.")
        return value

class ProgressCreate(ProgressBase):
    pass

class ProgressRead(ProgressBase):
    pass

class BulkUpdate(BaseModel):
    date: date
    updates: List[ProgressBase]

# Define progress router
progress_router = APIRouter(prefix="/progress", tags=["progress"])

@progress_router.get("/{date}", response_model=List[ProgressRead], summary="Get progress for a specific date")
async def get_progress(date: date, db: AsyncSession = Depends(get_db)):
    """
    Retrieve progress records for a specific date.

    If no records exist, default values for all allowed habits will be returned.
    - **date**: The date for which progress is retrieved.
    - **db**: The database session dependency.
    """
    result = await db.execute(
        text("SELECT * FROM progress WHERE date = :date"), {"date": date}
    )
    progress_records = result.fetchall()

    if not progress_records:
        logging.info(f"No records found for {date}. Returning default habits.")
        return [
            ProgressRead(date=date, habit=habit, status=False)
            for habit in ALLOWED_HABITS
        ]

    return [
        ProgressRead(date=record.date, habit=record.habit, status=record.status)
        for record in progress_records
    ]

@progress_router.post("/", summary="Update progress for a habit")
async def update_progress(progress: ProgressCreate, db: AsyncSession = Depends(get_db)):
    """
    Update progress for a specific habit on a given date.

    - **progress**: The progress data to update.
    - **db**: The database session dependency.
    """
    try:
        result = await db.execute(
            text("SELECT * FROM progress WHERE date = :date AND habit = :habit"),
            {"date": progress.date, "habit": progress.habit}
        )
        db_record = result.fetchone()

        if db_record:
            await db.execute(
                text("UPDATE progress SET status = :status WHERE date = :date AND habit = :habit"),
                {"status": progress.status, "date": progress.date, "habit": progress.habit}
            )
        else:
            await db.execute(
                text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
                {"date": progress.date, "habit": progress.habit, "status": progress.status}
            )

        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        logging.error(f"Integrity error on saving progress: {e}")
        raise HTTPException(status_code=400, detail="Could not save progress due to an integrity error.")
    except Exception as e:
        await db.rollback()
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    return {"message": "Progress updated successfully"}

@progress_router.post("/init", summary="Initialize default progress for a new date")
async def initialize_progress(date: date, db: AsyncSession = Depends(get_db)):
    """
    Initialize default progress records for a specific date.

    If a record for a given habit on `date` does not exist, it will be created with `status=False`.

    - **date**: The date to initialize progress for.
    - **db**: The database session dependency.
    """
    result = await db.execute(
        text("SELECT habit FROM progress WHERE date = :date"), {"date": date}
    )
    existing_habits = {row.habit for row in result.fetchall()}

    new_entries = []
    for habit in ALLOWED_HABITS:
        if habit not in existing_habits:
            await db.execute(
                text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
                {"date": date, "habit": habit, "status": False}
            )

    await db.commit()

    logging.info(f"Initialized progress for {date}.")
    return {"message": "Progress initialized for the date"}

@progress_router.post("/bulk", summary="Bulk update progress for multiple habits")
async def update_bulk_progress(data: BulkUpdate, db: AsyncSession = Depends(get_db)):
    """
    Bulk update progress for multiple habits on a specific date.

    - **data**: Contains the date and a list of habit updates.
    - **db**: The database session dependency.
    """
    for update in data.updates:
        if update.habit not in ALLOWED_HABITS:
            logging.warning(f"Invalid habit in bulk update: {update.habit}")
            continue

        result = await db.execute(
            text("SELECT * FROM progress WHERE date = :date AND habit = :habit"),
            {"date": data.date, "habit": update.habit}
        )
        db_record = result.fetchone()

        if db_record:
            await db.execute(
                text("UPDATE progress SET status = :status WHERE date = :date AND habit = :habit"),
                {"status": update.status, "date": data.date, "habit": update.habit}
            )
        else:
            await db.execute(
                text("INSERT INTO progress (date, habit, status) VALUES (:date, :habit, :status)"),
                {"date": data.date, "habit": update.habit, "status": update.status}
            )

    await db.commit()
    logging.info(f"Bulk progress updated for {data.date}.")
    return {"message": "Bulk progress updated successfully"}

# Register progress router
app.include_router(progress_router, prefix="/api")

@app.get("/health", summary="Health check endpoint")
async def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return {"status": "healthy"}
