import logging
from datetime import datetime
from fastapi import Request
from main import ApplicationStatus

logger = logging.getLogger(__name__)

async def request_middleware(request: Request, call_next):
    """Log requests and track metrics."""
    start_time = datetime.now()
    ApplicationStatus.increment_request()

    try:
        response = await call_next(request)
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {duration:.3f}s"
        )
        return response
    except Exception as e:
        ApplicationStatus.increment_error()
        logger.error(f"Request error: {str(e)}")
        raise
