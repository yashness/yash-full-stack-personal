"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .config import get_config, get_settings
from .logging import setup_logging
from .models import HealthResponse, WelcomeResponse
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    setup_logging()
    logger.info("Starting {{ cookiecutter.project_name }} API")
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
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="{{ cookiecutter.project_slug }}-backend",
    )
