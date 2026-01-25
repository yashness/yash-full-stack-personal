# =============================================================================
# Backend Dockerfile - FastAPI + uv
# =============================================================================

FROM python:3.12-slim AS base
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy all project files (needed for hatchling build)
COPY . .

# Development stage
FROM base AS dev
RUN uv sync --all-extras
RUN mkdir -p logs
EXPOSE {{ cookiecutter.backend_port }}
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "{{ cookiecutter.backend_port }}", "--reload"]

# Production stage
FROM base AS prod

# Create venv with container Python and install deps
RUN uv venv /app/.venv --python python3.12 && \
    . /app/.venv/bin/activate && \
    uv sync --no-dev

# Create non-root user and set permissions
RUN groupadd -r appgroup && useradd -r -g appgroup appuser && \
    mkdir -p logs && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE {{ cookiecutter.backend_port }}

# Run directly from venv
CMD ["/app/.venv/bin/python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "{{ cookiecutter.backend_port }}", "--workers", "4"]
