import json
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, EmailStr
from datetime import date

class HabitEnum(str, Enum):
    """Enum for allowed habits."""
    SLEEP_7_HOURS = "7 hours of sleep"
    READ_20_MIN = "Read for 20 minutes"
    # Add more habits as needed

ALLOWED_HABITS = [habit.value for habit in HabitEnum]

class ProgressCreate(BaseModel):
    date: str
    habit: HabitEnum
    status: bool
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat()
        }
class ProgressRead(BaseModel):
    id: int
    date: date
    habit: HabitEnum
    status: bool
    streak: int
    completion_pct: Optional[float] = None
    class Config:
        from_attributes = True

class ProgressUpdate(BaseModel):
    status: Optional[bool] = None
    streak: Optional[int] = None
    class Config:
        from_attributes = True

class BulkUpdate(BaseModel):
    """Schema for bulk updating progress."""
    date: str
    updates: dict

# New Auth Schemas
class GoogleLoginRequest(BaseModel):
    """Schema for Google OAuth2 or demo login request."""
    id_token: str

class RegisterRequest(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str

class HabitCreate(BaseModel):
    habit: str
    category: Optional[str] = None
    user_id: int
    date: str  # YYYY-MM-DD