import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable, Awaitable
from application_status import ApplicationStatus

logger = logging.getLogger(__name__)

# Define a type for the call_next function
NextCallable = Callable[[Request], Awaitable[Response]]

class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log requests and track application metrics.

    Logs request method, URL, response status code, duration, and errors.
    Also increments application-level request and error metrics.
    """
    async def dispatch(self, request: Request, call_next: NextCallable) -> Response:
        start_time = time.perf_counter()
        ApplicationStatus.increment_request()

        try:
            # Process the request
            response: Response = await call_next(request)
            duration = time.perf_counter() - start_time

            # Log request details
            logger.info(
                f"[Request] {request.method} {request.url.path} "
                f"Status: {response.status_code} Duration: {duration:.3f}s"
            )
            return response

        except Exception as e:
            duration = time.perf_counter() - start_time  # Log duration even in error case
            ApplicationStatus.increment_error()

            # Log the error with additional context
            logger.error(
                f"[Error] {request.method} {request.url.path} "
                f"Error: {str(e)} Duration: {duration:.3f}s"
            )
            raise
