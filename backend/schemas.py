from pydantic import BaseModel, validator
from datetime import date
from typing import List, Optional, Dict, Tuple
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
    def list_values(cls) -> List[str]:
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
    def validate_date(cls, value: date) -> date:
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
    """Schema for updating progress."""
    status: Optional[bool] = None
    habit: Optional[str] = None  # This field is optional


class BulkUpdate(BaseModel):
    """Schema for bulk updating progress."""
    date: date
    updates: List[ProgressUpdate]

    @validator("date")
    def validate_date(cls, value: date) -> date:
        """Ensure date is not in the future."""
        if value > date.today():
            raise ValueError("Date cannot be in the future.")
        return value


# Constants (if needed in other modules)
ALLOWED_HABITS: List[str] = HabitEnum.list_values()


def build_progress_row(
    row_map: Dict[Tuple[date, str], ProgressRead],
    progress_date: date,
    habit: str
) -> ProgressRead:
    """
    Construct a ProgressRead row for the given date and habit.
    If no data exists in the mapping, return a default row with status=False, id=0, and streak=0.

    Args:
        row_map (Dict[Tuple[date, str], ProgressRead]): A mapping of (date, habit) keys to ProgressRead records.
        progress_date (date): The date for which to build the progress row.
        habit (str): The habit for which to build the progress row.

    Returns:
        ProgressRead: The existing or default progress record.
    """
    key = (progress_date, habit)  # Match the key format used in row_map
    row = row_map.get(key)
    if row:
        return row
    else:
        # Return a default progress row if no data exists
        return ProgressRead(
            id=0,  # Default ID for missing rows
            date=progress_date,
            habit=habit,
            status=False,
            streak=0  # Default streak value
        )
