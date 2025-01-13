import os
from dotenv import load_dotenv
from schemas import HabitEnum

# Load environment variables
load_dotenv()

class Config:
    """Application configuration class."""
    ALLOWED_HABITS = HabitEnum.list_values()
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8001))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///progress.db")
