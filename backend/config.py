import os
import logging
from dotenv import load_dotenv
from schemas import HabitEnum

# Load environment variables
load_dotenv()

# Initialize logging
logger = logging.getLogger(__name__)

class Config:
    """Application configuration class."""

    # Allowed habits from schema
    ALLOWED_HABITS = HabitEnum.list_values()

    # Debug mode
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    if DEBUG:
        logger.info("Debug mode enabled.")

    # Host and port
    try:
        PORT = int(os.getenv("PORT", 8001))
    except ValueError:
        logger.error("Invalid PORT value; falling back to default (8001).")
        PORT = 8001

    HOST = os.getenv("HOST", "0.0.0.0")

    # Allowed origins for CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if "*" in ALLOWED_ORIGINS:
        logger.warning("ALLOWED_ORIGINS set to '*'. This is insecure for production.")

    # Database connection URL
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///progress.db")
    if DATABASE_URL == "sqlite+aiosqlite:///progress.db":
        logger.warning("Using default SQLite database. Configure DATABASE_URL for production.")

    @staticmethod
    def validate():
        """Validate critical configuration variables."""
        if not Config.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set. Cannot connect to the database.")
        if Config.PORT < 1024 or Config.PORT > 65535:
            raise ValueError(f"Invalid PORT: {Config.PORT}. Must be between 1024 and 65535.")
        logger.info("Configuration validation passed.")

# Validate configuration on module load
Config.validate()
