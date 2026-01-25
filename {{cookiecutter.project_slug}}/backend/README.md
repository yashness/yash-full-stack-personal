# {{ cookiecutter.project_name }} Backend

FastAPI backend for {{ cookiecutter.project_name }}.

## Quick Start

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn src.main:app --reload --port {{ cookiecutter.backend_port }}

# Run CLI
uv run cli --help
uv run cli info -v
uv run cli health
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with database status
- `GET /api/v1/todos` - List all todos
- `POST /api/v1/todos` - Create a todo
- `GET /api/v1/todos/{id}` - Get a todo
- `PATCH /api/v1/todos/{id}` - Update a todo
- `DELETE /api/v1/todos/{id}` - Delete a todo

## Testing

```bash
uv run pytest
```
