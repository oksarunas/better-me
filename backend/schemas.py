from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr
from datetime import date

class ProgressCreate(BaseModel):
    date: date
    habit: str
    status: bool
    category: Optional[str] = None
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat()
        }

class ProgressRead(BaseModel):
    id: int
    date: date
    habit: str
    status: bool
    streak: int
    completion_pct: Optional[float] = None
    category: Optional[str] = None
    class Config:
        from_attributes = True

class ProgressUpdate(BaseModel):
    status: Optional[bool] = None
    streak: Optional[int] = None
    class Config:
        from_attributes = True

class BulkUpdate(BaseModel):
    date: date  # Changed to date for consistency
    updates: Dict[str, bool]  # Stricter typing
    class Config:
        from_attributes = True

class GoogleLoginRequest(BaseModel):
    id_token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class HabitCreate(BaseModel):
    habit: str
    category: Optional[str] = None
    user_id: int
    date: date
    class Config:
        from_attributes = True