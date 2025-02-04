import logging
import uuid
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Any

logger = logging.getLogger(__name__)

def generate_correlation_id() -> str:
    """
    Generate a unique correlation ID.
    
    Returns:
        str: A new UUID string.
    """
    return str(uuid.uuid4())

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation errors in FastAPI.
    
    Args:
        request (Request): The incoming request object.
        exc (RequestValidationError): The validation exception raised.
    
    Returns:
        JSONResponse: A response with validation error details.
    """
    correlation_id: str = generate_correlation_id()
    logger.warning(
        f"Validation error: {exc.errors()} | Request: {request.method} {request.url} | Correlation ID: {correlation_id}"
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
    """
    Handle unexpected errors in FastAPI.
    
    Args:
        request (Request): The incoming request object.
        exc (Exception): The exception raised.
    
    Returns:
        JSONResponse: A response with a generic error message.
    """
    correlation_id: str = generate_correlation_id()
    logger.error(
        f"Unexpected error: {exc} | Request: {request.method} {request.url} | Correlation ID: {correlation_id}",
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "message": "Internal Server Error",
            "correlation_id": correlation_id,
        },
    )
