from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import List, Dict
from datetime import date
from database import SessionLocal, Progress, init_db
from fastapi.middleware.cors import CORSMiddleware
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Initialize FastAPI app
app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://betterme.website", "https://api.betterme.website"],  # Restrict origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_db()

# Allowed habits
ALLOWED_HABITS = [
    "7 hours of sleep", "Breakfast", "Workout", "Code",
    "Creatine", "Read", "Vitamins", "No drink",
]

# Pydantic model for Progress
class ProgressUpdate(BaseModel):
    date: date
    habit: str
    status: bool

    @validator("habit")
    def validate_habit(cls, value):
        if value not in ALLOWED_HABITS:
            raise ValueError(f"Habit '{value}' is not valid.")
        return value

# Use an API prefix for all routes
api = FastAPI()

@api.get("/progress/{date}", response_model=List[ProgressUpdate], summary="Get progress for a specific date")
def get_progress(date: date, db: Session = Depends(get_db)):
    progress_records = db.query(Progress).filter(Progress.date == date).all()

    # Pre-fill habits with default values if no records are found
    if not progress_records:
        logging.info(f"No records found for {date}. Returning default habits.")
        return [
            ProgressUpdate(date=date, habit=habit, status=False)
            for habit in ALLOWED_HABITS
        ]

    return [
        ProgressUpdate(date=record.date, habit=record.habit, status=record.status)
        for record in progress_records
    ]

@api.post("/progress/", summary="Update progress for a habit")
def update_progress(progress: ProgressUpdate, db: Session = Depends(get_db)):
    db_record = db.query(Progress).filter(
        Progress.date == progress.date, Progress.habit == progress.habit
    ).first()

    if db_record:
        db_record.status = progress.status
    else:
        db_record = Progress(date=progress.date, habit=progress.habit, status=progress.status)
        db.add(db_record)

    db.commit()
    return {"message": "Progress updated successfully"}

@api.post("/progress/init", summary="Initialize default progress for a new date")
def initialize_progress(date: date, db: Session = Depends(get_db)):
    if not date:
        raise HTTPException(status_code=400, detail="Date is required")
    for habit in ALLOWED_HABITS:
        if not db.query(Progress).filter(Progress.date == date, Progress.habit == habit).first():
            db.add(Progress(date=date, habit=habit, status=False))

    db.commit()
    logging.info(f"Initialized progress for {date}.")
    return {"message": "Progress initialized for the date"}

@api.get("/health", summary="Health check endpoint")
def health_check():
    return {"status": "healthy"}

@api.post("/progress/bulk", summary="Bulk update progress for multiple habits")
def update_bulk_progress(data: Dict, db: Session = Depends(get_db)):
    date = data.get("date")
    updates = data.get("updates", [])

    if not date or not updates:
        raise HTTPException(status_code=400, detail="Date and updates are required")

    for update in updates:
        habit = update["habit"]
        status = update["status"]

        if habit not in ALLOWED_HABITS:
            logging.warning(f"Invalid habit in bulk update: {habit}")
            continue

        db_record = db.query(Progress).filter(
            Progress.date == date, Progress.habit == habit
        ).first()

        if db_record:
            db_record.status = status
        else:
            db_record = Progress(date=date, habit=habit, status=status)
            db.add(db_record)

    db.commit()
    logging.info(f"Bulk progress updated for {date}.")
    return {"message": "Bulk progress updated successfully"}

# Mount the API app under the /api prefix
app.mount("/api", api)
