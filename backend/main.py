import os
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import router as progress_router
from auth import router as auth_router  # Import the consolidated router

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

# Configure allowed origins
allowed_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
allow_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

if os.getenv("ENV") == "development":
    allow_origins.append("http://localhost:3001")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
    logging.info("Starting application...")
    await init_db()
    logging.info("Database initialized successfully.")

@app.on_event("shutdown")
async def on_shutdown():
    logging.info("Shutting down application...")
    # Add cleanup logic here if needed
    logging.info("Application shutdown complete.")

# Include the consolidated routes with a prefix
app.include_router(progress_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

if __name__ == "__main__":
    logging.info("Starting server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
