from pydantic import BaseModel, validator, ConfigDict
from datetime import date
from typing import List, Optional, Dict, Tuple
from enum import Enum


class HabitCategory(str, Enum):
    """Enumeration for habit categories."""
    HEALTH = "Health"
    PRODUCTIVITY = "Productivity"
    PERSONAL_GROWTH = "Personal Growth"
    NUTRITION = "Nutrition"


# Updated the HabitCategory schema to reflect the new habit names and ensure consistency in the database.
# This change ensures that the HabitCategory enum is aligned with the new habit names, 
# which is crucial for maintaining data integrity and consistency in the database.
class HabitEnum(str, Enum):
    """Enumeration for allowed habits with their categories."""
    SEVEN_HOURS_SLEEP = "7 hours of sleep"
    BREAKFAST = "Healthy Breakfast"
    WORKOUT = "Workout for 30 minutes"
    CODE = "Work on personal project for an hour"
    CREATINE = "5 g of creatine"
    READ = "Read for 20 minutes"
    VITAMINS = "Multivitamins"
    NO_DRINK = "No alcohol"

    @classmethod
    def list_values(cls) -> List[str]:
        """Return all habit values as a list."""
        return [habit.value for habit in cls]
    
    @classmethod
    def get_category(cls, habit: str) -> str:
        """Return the category for a given habit."""
        categories = {
            cls.SEVEN_HOURS_SLEEP: HabitCategory.HEALTH,
            cls.WORKOUT: HabitCategory.HEALTH,
            cls.CODE: HabitCategory.PRODUCTIVITY,
            cls.READ: HabitCategory.PERSONAL_GROWTH,
            cls.BREAKFAST: HabitCategory.NUTRITION,
            cls.CREATINE: HabitCategory.NUTRITION,
            cls.VITAMINS: HabitCategory.NUTRITION,
            cls.NO_DRINK: HabitCategory.HEALTH,
        }
        return categories[cls(habit)].value


class ProgressBase(BaseModel):
    """Base schema for progress."""
    date: date
    habit: HabitEnum
    status: bool

    model_config = ConfigDict(from_attributes=True)  # Pydantic v2 format

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

    model_config = ConfigDict(from_attributes=True)  # Corrected Pydantic v2 syntax

    # Removed `class Config:` to fix the error


class ProgressUpdate(BaseModel):
    """Schema for updating progress."""
    status: Optional[bool] = None
    habit: Optional[HabitEnum] = None  # Enforce valid habit values


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
    row_map: Dict[Tuple[date, HabitEnum], ProgressRead],  # Enforce HabitEnum
    progress_date: date,
    habit: HabitEnum  # Enforce HabitEnum
) -> ProgressRead:
    """
    Construct a ProgressRead row for the given date and habit.
    If no data exists in the mapping, return a default row with status=False, id=0, and streak=0.

    Args:
        row_map (Dict[Tuple[date, HabitEnum], ProgressRead]): A mapping of (date, habit) keys to ProgressRead records.
        progress_date (date): The date for which to build the progress row.
        habit (HabitEnum): The habit for which to build the progress row.

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
