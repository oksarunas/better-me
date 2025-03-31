import os
import logging
from dotenv import load_dotenv

# Load environment variables
if not load_dotenv():
    logging.warning(".env file not found. Using system environment variables.")

def configure_logging() -> None:
    """Configure application-wide logging."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    logging.getLogger(__name__).info("Logging configured.")

class Config:
    """Application configuration class."""

    # General settings
    ENV: str = os.getenv("ENV", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Authentication & security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-key")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "fallback-client-id")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///backend/progress.db")

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "").split(",")
    if not ALLOWED_ORIGINS or not any(o.strip() for o in ALLOWED_ORIGINS):
        ALLOWED_ORIGINS = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:8001",
            "http://localhost:8000",
        ]

    @staticmethod
    def validate() -> None:
        """Validate critical configuration variables."""
        logger = logging.getLogger(__name__)
        if not Config.DATABASE_URL:
            raise ValueError("DATABASE_URL is not set")
        if Config.SECRET_KEY == "fallback-secret-key":
            logger.warning("Using fallback SECRET_KEY. Set a strong key in .env for security")
        if "*" in Config.ALLOWED_ORIGINS and Config.ENV != "development":
            logger.warning("ALLOWED_ORIGINS includes '*'. This is insecure for production")
        if not 1024 <= Config.PORT <= 65535:
            logger.error(f"Invalid PORT: {Config.PORT}. Resetting to 8001")
            Config.PORT = 8001
        logger.info("Configuration validated")

# Configure logging and validate on import
configure_logging()
Config.validate()