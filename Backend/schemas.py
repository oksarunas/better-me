from pydantic import BaseModel, validator
from datetime import date
from typing import List

from enum import Enum

class HabitEnum(str, Enum):
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
        return [habit.value for habit in cls]


class ProgressBase(BaseModel):
    date: date
    habit: str
    status: bool

    class Config:
        from_attributes = True

    @validator("habit")
    def validate_habit(cls, value):
        allowed_habits = [
            "7 hours of sleep",
            "Breakfast",
            "Workout",
            "Code",
            "Creatine",
            "Read",
            "Vitamins",
            "No drink",
        ]
        if value not in allowed_habits:
            raise ValueError(f"'{value}' is not an allowed habit.")
        return value


class ProgressCreate(ProgressBase):
    pass


class ProgressRead(ProgressBase):
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
    habit: str
    status: bool

    @validator("habit")
    def validate_habit(cls, value):
        allowed_habits = [
            "7 hours of sleep",
            "Breakfast",
            "Workout",
            "Code",
            "Creatine",
            "Read",
            "Vitamins",
            "No drink",
        ]
        if value not in allowed_habits:
            raise ValueError(f"'{value}' is not an allowed habit.")
        return value


class BulkUpdate(BaseModel):
    date: date
    updates: List[ProgressUpdate]

    @validator("date")
    def validate_date(cls, value):
        if value > date.today():
            raise ValueError("Date cannot be in the future.")
        return value


# Constants
ALLOWED_HABITS = [
    "7 hours of sleep",
    "Breakfast",
    "Workout",
    "Code",
    "Creatine",
    "Read",
    "Vitamins",
    "No drink",
]
