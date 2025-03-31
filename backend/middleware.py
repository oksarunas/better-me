import logging
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from application_status import ApplicationStatus

logger = logging.getLogger(__name__)

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to log requests and track metrics."""
    async def dispatch(self, request: Request, call_next) -> Response:
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        ApplicationStatus.increment_request()

        try:
            response = await call_next(request)
            logger.info(
                f"[Request] {request.method} {request.url.path} - "
                f"Status: {response.status_code} "
                f"Content-Type: {response.headers.get('content-type', 'unknown')} "
                f"Correlation-ID: {correlation_id}"
            )
            if "content-length" in response.headers:
                del response.headers["content-length"]
            return response
        except Exception as e:
            ApplicationStatus.increment_error()
            logger.error(
                f"Unexpected error: {str(e)} - "
                f"Request: {request.method} {request.url} - "
                f"Correlation-ID: {correlation_id}"
            )
            raise