from pydantic import BaseModel, field_validator
from datetime import date
from typing import List


# Base schema for progress (common fields)
class ProgressBase(BaseModel):
    date: date
    habit: str
    status: bool

    @field_validator("habit", mode="before")
    def validate_habit(cls, value):
        """
        Ensure the habit is valid. Replace 'ALLOWED_HABITS' with the global list if needed.
        """
        ALLOWED_HABITS = [
            "7 hours of sleep", "Breakfast", "Workout", "Code",
            "Creatine", "Read", "Vitamins", "No drink",
        ]
        if value not in ALLOWED_HABITS:
            raise ValueError(f"Habit '{value}' is not valid.")
        return value


# Schema for creating new progress
class ProgressCreate(ProgressBase):
    pass


# Schema for reading progress from the database
class ProgressRead(ProgressBase):
    id: int
    streak: int = 0

    class Config:
        from_attributes = True  # Updated for Pydantic v2


# Schema for bulk updates
class BulkUpdate(BaseModel):
    date: date
    updates: List[ProgressBase]
