from pydantic import BaseModel, validator
from datetime import date
from typing import List
from enum import Enum


class HabitEnum(str, Enum):
    """Enumeration for allowed habits."""
    SEVEN_HOURS_SLEEP = "7 hours of sleep"
    BREAKFAST = "Breakfast"
    WORKOUT = "Workout"
    CODE = "Code"
    CREATINE = "Creatine"
    READ = "Read"
    VITAMINS = "Vitamins"
    NO_DRINK = "No drink"

    @classmethod
    def list_values(cls):
        """Return all habit values as a list."""
        return [habit.value for habit in cls]


class ProgressBase(BaseModel):
    """Base schema for progress."""
    date: date
    habit: HabitEnum
    status: bool

    class Config:
        from_attributes = True

    @validator("date")
    def validate_date(cls, value):
        """Ensure date is not in the future."""
        if value > date.today():
            raise ValueError("Date cannot be in the future.")
        return value


class ProgressCreate(ProgressBase):
    """Schema for creating progress."""
    pass


class ProgressRead(ProgressBase):
    """Schema for reading progress."""
    id: int
    streak: int = 0

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "date": "2025-01-01",
                "habit": "Workout",
                "status": True,
                "streak": 5,
            }
        }


class ProgressUpdate(BaseModel):
    status: bool


class BulkUpdate(BaseModel):
    """Schema for bulk updating progress."""
    date: date
    updates: List[ProgressUpdate]

    @validator("date")
    def validate_date(cls, value):
        """Ensure date is not in the future."""
        if value > date.today():
            raise ValueError("Date cannot be in the future.")
        return value


# Constants (if needed in other modules)
ALLOWED_HABITS = HabitEnum.list_values()
