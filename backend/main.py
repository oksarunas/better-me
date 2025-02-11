import os
import logging
import asyncio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import router as api_router
from config import Config
from middleware import MetricsMiddleware  # ✅ Import Metrics Middleware

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

# Register Middleware
app.add_middleware(MetricsMiddleware)  # ✅ Tracks total requests & errors

# Configure CORS
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
    logging.info("Starting application...")
    try:
        asyncio.create_task(init_db())  # ✅ Non-blocking DB init
        logging.info("Database initialization started.")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")

@app.on_event("shutdown")
async def on_shutdown():
    logging.info("Shutting down application...")
    logging.info("Application shutdown complete.")

# Include all API routers
app.include_router(api_router)

if __name__ == "__main__":
    logging.info("Starting server...")
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8001)), reload=True)
