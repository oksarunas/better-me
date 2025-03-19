import os
import logging
import asyncio
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import datetime

from database import init_db
from config import Config
from middleware import MetricsMiddleware
from application_status import ApplicationStatus
from exceptions import validation_exception_handler, general_exception_handler

from routes import router as progress_router
from analytics import router as analytics_router 
from auth import router as auth_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Create FastAPI application
app = FastAPI(
    title="Habit Tracker API",
    description="API for tracking daily habits and progress",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Register Exception Handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Register Middleware
app.add_middleware(MetricsMiddleware)

# Configure CORS
logging.info("Configuring CORS with origins: %s", Config.ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Habit Tracker API",
        "health_check": "/api/health",
        "documentation": "/docs",
    }

# Lifecycle events
@app.on_event("startup")
async def on_startup():
    logging.info("Application startup initiated...")
    try:
        await init_db()
        logging.info("Database initialization started.")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")

@app.on_event("shutdown")
async def on_shutdown():
    logging.info("Application shutdown initiated...")
    logging.info("Application shutdown complete.")

# Include all API routers
app.include_router(progress_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

if __name__ == "__main__":
    logging.info("Starting server...")
    reload = os.getenv("ENV", "development") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8001)), reload=reload)
