from datetime import datetime
from threading import Lock

class ApplicationStatus:
    """Class to track application status and metrics."""
    startup_time: datetime = datetime.now()
    total_requests: int = 0
    total_errors: int = 0
    _lock: Lock = Lock()

    @classmethod
    def increment_request(cls) -> None:
        with cls._lock:
            cls.total_requests += 1

    @classmethod
    def increment_error(cls) -> None:
        with cls._lock:
            cls.total_errors += 1

    @classmethod
    def get_status(cls) -> dict:
        return {
            "startup_time": cls.startup_time.isoformat(),
            "total_requests": cls.total_requests,
            "total_errors": cls.total_errors,
        }
