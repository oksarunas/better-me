from datetime import datetime

class ApplicationStatus:
    """Class to track application status and metrics."""
    startup_time = datetime.now()
    total_requests = 0
    total_errors = 0

    @classmethod
    def increment_request(cls):
        cls.total_requests += 1

    @classmethod
    def increment_error(cls):
        cls.total_errors += 1
