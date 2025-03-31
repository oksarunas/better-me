import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle FastAPI validation errors (422)."""
    correlation_id = getattr(request.state, "correlation_id", "N/A")
    try:
        body = await request.json()
    except Exception:
        body = "Unavailable"

    errors = exc.errors()
    logger.warning(
        f"Validation error: {errors} - "
        f"Request: {request.method} {request.url} - "
        f"Body: {body} - "
        f"Correlation-ID: {correlation_id}"
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "message": "Request validation failed",
            "correlation_id": correlation_id,
        },
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected server errors and HTTP exceptions."""
    correlation_id = getattr(request.state, "correlation_id", "N/A")
    error_message = str(exc) or "Unknown error"

    logger.error(
        f"Unexpected error: {error_message} - "
        f"Request: {request.method} {request.url} - "
        f"Correlation-ID: {correlation_id}",
        exc_info=True
    )
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "message": error_message,
                "correlation_id": correlation_id,
            },
        )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "message": error_message,
            "correlation_id": correlation_id,
        },
    )