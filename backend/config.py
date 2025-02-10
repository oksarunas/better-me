import os
import logging
from dotenv import load_dotenv
from sqlalchemy.engine.url import make_url
from schemas import HabitEnum

# Load environment variables
if not load_dotenv():
    logging.warning(".env file not found. Using system environment variables.")

# Initialize logging
logger = logging.getLogger(__name__)

class Config:
    """Application configuration class."""

    # Allowed habits from schema
    try:
        ALLOWED_HABITS = HabitEnum.list_values()
    except AttributeError as e:
        logger.error(f"Failed to load allowed habits: {e}")
        ALLOWED_HABITS = []

    # Debug mode
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    if DEBUG:
        logger.info("Debug mode enabled.")

    # Host and port
    try:
        PORT = int(os.getenv("PORT", 8001))
        if not (1024 <= PORT <= 65535):
            raise ValueError(f"Invalid PORT: {PORT}. Must be between 1024 and 65535.")
    except ValueError as e:
        logger.error(f"Invalid PORT value: {e}. Falling back to default (8001).")
        PORT = 8001

    HOST = os.getenv("HOST", "0.0.0.0")

    # Allowed origins for CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
    if not ALLOWED_ORIGINS or (len(ALLOWED_ORIGINS) == 1 and ALLOWED_ORIGINS[0] == ""):
        ALLOWED_ORIGINS = ["http://localhost:3001"] if DEBUG else []

    if "*" in ALLOWED_ORIGINS and not DEBUG:
        logger.warning("ALLOWED_ORIGINS set to '*'. This is insecure for production.")

    # Database connection URL
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///progress.db")
        make_url(DATABASE_URL)  # ✅ Validate DB URL format
    except Exception as e:
        logger.error(f"Invalid DATABASE_URL: {e}")
        raise ValueError("DATABASE_URL is invalid. Please check your .env file.")

    @staticmethod
    def validate():
        """Validate critical configuration variables."""
        if not Config.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set. Cannot connect to the database.")
        
        logger.info("Configuration validation passed.")

# Validate configuration on module load
Config.validate()
