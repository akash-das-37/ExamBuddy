import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers import analysis, auth, colleges, notifications, syllabus_agent

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO)
    logging.info("🚀 ExamBuddy API starting up with SQLite & BackgroundTasks...")
    # Ensure all tables exist in database
    import app.models  # noqa: F401
    from app.db import engine
    from app.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("✅ Database tables initialized.")
    yield


app = FastAPI(
    title="ExamBuddy API",
    description="AI-powered exam preparation agent for college students",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS — allow all origins in dev, lock down in production
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(colleges.router)
app.include_router(notifications.router)
app.include_router(analysis.router)
app.include_router(syllabus_agent.router)


@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}


# Mount storage directory
import os
from fastapi.staticfiles import StaticFiles

storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(storage_dir, exist_ok=True)
app.mount("/storage", StaticFiles(directory=storage_dir), name="storage")

# Mount built frontend if it exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — returns 500 with a safe message."""
    logging.exception("Unhandled exception on %s %s", request.method, request.url)
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

