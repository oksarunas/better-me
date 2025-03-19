from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

class ApplicationStatus:
    @staticmethod
    def increment_request():
        # Implement the logic to increment request count
        pass

    @staticmethod
    def increment_error():
        # Implement the logic to increment error count
        pass
import logging
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint as NextCallable

logger = logging.getLogger(__name__)

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            
            # Log the request details
            logging.info(
                f"[Request] {request.method} {request.url.path} "
                f"Status: {response.status_code} "
                f"Content-Type: {response.headers.get('content-type', 'unknown')}"
            )
            
            # Ensure content length matches
            if "content-length" in response.headers:
                del response.headers["content-length"]
            
            return response
            
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)} | Request: {request.method} {request.url} | Correlation ID: {request.state.correlation_id}")
            raise