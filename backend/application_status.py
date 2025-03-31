import logging
from datetime import datetime
from threading import Lock

logger = logging.getLogger(__name__)

class ApplicationStatus:
    """Class to track application status and metrics."""
    _startup_time: datetime = datetime.now()
    _total_requests: int = 0
    _total_errors: int = 0
    _lock = Lock()

    @classmethod
    def increment_request(cls) -> None:
        """Increment the total request count."""
        with cls._lock:
            cls._total_requests += 1
        logger.debug(f"Total requests incremented to {cls._total_requests}")

    @classmethod
    def increment_error(cls) -> None:
        """Increment the total error count."""
        with cls._lock:
            cls._total_errors += 1
        logger.debug(f"Total errors incremented to {cls._total_errors}")

    @classmethod
    def get_status(cls) -> dict:
        """Return application status including uptime, requests, and errors."""
        with cls._lock:
            uptime_seconds = (datetime.now() - cls._startup_time).total_seconds()
            status = {
                "startup_time": cls._startup_time.isoformat(),
                "uptime_seconds": int(uptime_seconds),
                "total_requests": cls._total_requests,
                "total_errors": cls._total_errors,
            }
        logger.info(f"Application status: {status}")
        return status