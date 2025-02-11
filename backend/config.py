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

    # Load authentication & security settings
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "fallback-client-id")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

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

    # Host & Port settings
    try:
        PORT = int(os.getenv("PORT", 8001))
        if not (1024 <= PORT <= 65535):
            raise ValueError(f"Invalid PORT: {PORT}. Must be between 1024 and 65535.")
    except ValueError as e:
        logger.error(f"Invalid PORT value: {e}. Falling back to default (8001).")
        PORT = 8001

    HOST = os.getenv("HOST", "0.0.0.0")

    # CORS settings (Prevents `*` in production)
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()]
    
    logger.info(f"CORS Allowed Origins: {ALLOWED_ORIGINS}")
    
    if not ALLOWED_ORIGINS:
        ALLOWED_ORIGINS = ["http://localhost:3001", "http://127.0.0.1:3000", "http://localhost:8001"]
    
    if "*" in ALLOWED_ORIGINS and not DEBUG:
        logger.warning("ALLOWED_ORIGINS set to '*'. This is insecure for production.")

    # Database settings with validation
    try:
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///progress.db")
        make_url(DATABASE_URL)  # Validate DB URL format
    except Exception as e:
        logger.error(f"Invalid DATABASE_URL: {e}")
        raise ValueError("DATABASE_URL is invalid. Please check your .env file.")

    @staticmethod
    def validate():
        """Validate critical configuration variables."""
        if not Config.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set. Cannot connect to the database.")
        if not Config.SECRET_KEY or Config.SECRET_KEY == "fallback-secret-key":
            raise ValueError("SECRET_KEY is not set. Set a strong key in .env.")
        logger.info("Configuration validation passed.")

# Validate configuration on module load
Config.validate()
