"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from sqlalchemy import text

from .config import get_config, get_settings
from .database import async_engine, init_db
from .logging import setup_logging
from .models import HealthResponse, WelcomeResponse
from .routes import router
from .webhooks import router as webhooks_router
{% if cookiecutter.copilot_ui %}from .chat import router as chat_router{% endif %}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    setup_logging()
    logger.info("Starting {{ cookiecutter.project_name }} API")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization failed (running without DB): {e}")
    yield
    logger.info("Shutting down {{ cookiecutter.project_name }} API")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app_config, api_config, _ = get_config()

    app = FastAPI(
        title=app_config.name,
        version=app_config.version,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=api_config.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(router, prefix="/api/v1")
    app.include_router(webhooks_router, prefix="/api")
{% if cookiecutter.copilot_ui %}    app.include_router(chat_router, prefix="/api/v1"){% endif %}

    return app


app = create_app()


@app.get("/", response_model=WelcomeResponse)
async def root() -> WelcomeResponse:
    """API root endpoint."""
    app_config, _, _ = get_config()
    return WelcomeResponse(
        message=f"Welcome to {app_config.name} API",
        version=app_config.version,
        docs="/docs",
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint with database status."""
    db_status = "disconnected"
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        service="{{ cookiecutter.project_slug }}-backend",
        database=db_status,
    )
