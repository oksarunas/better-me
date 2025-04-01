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


class AnalyticsResponse(BaseModel):
    completionRates: Dict[str, float]
    stackedData: Optional[Dict[str, List[int]]] = None
    dates: List[str]
    lineData: List[float]

    class Config:
        from_attributes = True  # Replaces orm_mode
        json_schema_extra = {   # Replaces schema_extra
            "example": {
                "completionRates": {"5 g of creatine": 0.5, "Sleep 7 hours": 0.8},
                "stackedData": {
                    "5 g of creatine": [1, 0, 1],
                    "Sleep 7 hours": [1, 1, 0]
                },
                "dates": ["2025-04-01", "2025-04-02", "2025-04-03"],
                "lineData": [66.7, 50.0, 33.3]
            }
        }