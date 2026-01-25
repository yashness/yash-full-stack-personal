# =============================================================================
# Backend Dockerfile - FastAPI + uv
# =============================================================================
# Multi-stage build with dev and prod targets.
# Uses uv for fast Python package management.
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage: Python with uv
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS base

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Configure uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy project files
COPY pyproject.toml uv.lock* ./

# -----------------------------------------------------------------------------
# Development stage
# -----------------------------------------------------------------------------
FROM base AS dev

# Install all dependencies including dev
RUN uv sync --frozen --all-extras

# Copy source (overridden by volume mount in dev compose)
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE {{ cookiecutter.backend_port }}

# FastAPI dev server with hot reload
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "{{ cookiecutter.backend_port }}", "--reload"]

# -----------------------------------------------------------------------------
# Production stage
# -----------------------------------------------------------------------------
FROM base AS prod

# Install production dependencies only
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE {{ cookiecutter.backend_port }}

# Production server with multiple workers
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "{{ cookiecutter.backend_port }}", "--workers", "4"]
