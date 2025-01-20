import logging
from datetime import datetime
from fastapi import Request, Response
from main import ApplicationStatus  # Ideally move ApplicationStatus to a dedicated module

logger = logging.getLogger(__name__)

async def request_middleware(request: Request, call_next):
    """
    Middleware to log requests and track application metrics.

    Logs request method, URL, response status code, duration, and errors.
    Also increments application-level request and error metrics.
    """
    start_time = datetime.now()
    ApplicationStatus.increment_request()

    try:
        # Process the request
        response: Response = await call_next(request)
        duration = (datetime.now() - start_time).total_seconds()

        # Log request details
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {duration:.3f}s"
        )
        return response

    except Exception as e:
        ApplicationStatus.increment_error()

        # Log the error with additional context
        logger.error(
            f"Error during request processing: {request.method} {request.url.path} "
            f"Error: {str(e)}"
        )
        raise
