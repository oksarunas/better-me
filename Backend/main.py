from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date
from database import SessionLocal, Progress
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all HTTP headers
)




# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model
class ProgressUpdate(BaseModel):
    date: date
    habit: str
    status: bool

@app.get("/progress/{date}", response_model=List[ProgressUpdate])
def get_progress(date: date, db: Session = Depends(get_db)):
    return db.query(Progress).filter(Progress.date == date).all()

@app.post("/progress/")
def update_progress(progress: ProgressUpdate, db: Session = Depends(get_db)):
    db_record = db.query(Progress).filter(
        Progress.date == progress.date, Progress.habit == progress.habit
    ).first()

    if db_record:
        db_record.status = progress.status
    else:
        db_record = Progress(**progress.dict())
        db.add(db_record)

    db.commit()
    return {"message": "Progress updated successfully"}
