from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import List
from datetime import date
from database import SessionLocal, Progress, init_db
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this for production
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

# Pydantic model for Progress
class ProgressUpdate(BaseModel):
    date: date
    habit: str
    status: bool

    @validator("habit")
    def validate_habit(cls, value):
        allowed_habits = [
            "7 hours of sleep", "Breakfast", "Workout", "Code",
            "Creatine", "Read", "Vitamins", "No drink",
        ]
        if value not in allowed_habits:
            raise ValueError(f"Habit '{value}' is not valid.")
        return value

# API to fetch progress for a date
@app.get("/progress/{date}", response_model=List[ProgressUpdate])
def get_progress(date: date, db: Session = Depends(get_db)):
    progress_records = db.query(Progress).filter(Progress.date == date).all()
    if not progress_records:
        raise HTTPException(status_code=404, detail="No progress records found for this date.")
    return [ProgressUpdate(date=record.date, habit=record.habit, status=record.status) for record in progress_records]

# API to update progress
@app.post("/progress/")
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

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
