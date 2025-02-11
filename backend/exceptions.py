import logging
import uuid
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)

def generate_correlation_id() -> str:
    """Generate a unique correlation ID."""
    return str(uuid.uuid4())

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle FastAPI validation errors (422)."""
    correlation_id: str = generate_correlation_id()
    
    try:
        body = await request.json()  # Get request body if available
    except Exception:
        body = "Unavailable"

    logger.warning(
        f"Validation error: {exc.errors()} | Request: {request.method} {request.url} "
        f"| Body: {body} | Correlation ID: {correlation_id}"
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "Request validation failed",
            "correlation_id": correlation_id,
        },
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected server errors (500)."""
    correlation_id: str = generate_correlation_id()
    error_message = str(exc) if str(exc) else "Unknown error"

    logger.error(
        f"Unexpected error: {error_message} | Request: {request.method} {request.url} | Correlation ID: {correlation_id}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "message": error_message,
            "correlation_id": correlation_id,
        },
    )
