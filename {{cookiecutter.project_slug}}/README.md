# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

A fullstack todo application with Next.js frontend and FastAPI backend.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zod, React Query |
| Backend | FastAPI, Pydantic, SQLAlchemy, Loguru, Typer |
| Database | MySQL 8.0 |
| Task Runner | Taskfile |
| Package Managers | bun (frontend), uv (backend) |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- [Task](https://taskfile.dev/) (`brew install go-task`)
- Traefik running on `traefik` network (for dev only)

### 1. Setup & Start Development

```bash
# One command to setup everything and start
task dev
```

This will:
- Add `/etc/hosts` entries (requires sudo)
- Create backend `.env` from template
- Create `traefik` Docker network
- Start all services with hot reload

### 2. Access the App

- **Frontend**: https://{{ cookiecutter.project_slug }}.local
- **Backend API**: https://api-{{ cookiecutter.project_slug }}.local
- **API Docs**: https://api-{{ cookiecutter.project_slug }}.local/docs

## Taskfile Commands

```bash
# Show all available tasks
task

# Development
task dev              # Start dev environment
task dev:logs         # Show logs
task dev:stop         # Stop dev environment
task dev:restart      # Restart dev environment
task dev:rebuild      # Rebuild and restart

# Production (local testing)
task prod             # Build and start prod
task prod:logs        # Show logs
task prod:stop        # Stop prod environment
task prod:clean       # Stop and remove volumes

# Build
task build            # Build all Docker images
task build:frontend   # Build frontend only
task build:backend    # Build backend only

# Testing
task test             # Run all tests
task test:backend     # Run backend tests
task lint             # Run linters

# CLI
task cli -- --help    # Run backend CLI
task cli:info         # Show config
task cli:health       # Check health

# Utilities
task setup            # Setup hosts, env, network
task status           # Show container status
task clean            # Stop all and remove volumes
```

## API Endpoints

### Todos

```bash
# List all todos
curl https://api-{{ cookiecutter.project_slug }}.local/api/v1/todos

# Create a todo
curl -X POST https://api-{{ cookiecutter.project_slug }}.local/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'

# Update a todo
curl -X PATCH https://api-{{ cookiecutter.project_slug }}.local/api/v1/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a todo
curl -X DELETE https://api-{{ cookiecutter.project_slug }}.local/api/v1/todos/1

# Health check
curl https://api-{{ cookiecutter.project_slug }}.local/health
```

## Production (Local Testing)

```bash
# Build and run production
task prod

# Access at:
# Frontend: http://localhost:{{ cookiecutter.frontend_port }}
# Backend: http://localhost:{{ cookiecutter.backend_port }}
```

## Local Development (without Docker)

### Backend

```bash
cd backend
uv sync
cp .env.example .env

# Run with hot reload
uv run uvicorn src.main:app --reload --port {{ cookiecutter.backend_port }}

# Run tests
uv run pytest

# CLI commands
uv run cli --help
uv run cli info -v
uv run cli serve -r
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

## Project Structure

```
{{ cookiecutter.project_slug }}/
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/               # React Query hooks
│   └── lib/                 # API client + utilities
├── backend/
│   ├── src/
│   │   ├── main.py          # FastAPI app
│   │   ├── routes.py        # Todo CRUD endpoints
│   │   ├── models.py        # Pydantic + SQLAlchemy models
│   │   ├── database.py      # MySQL connection
│   │   ├── config.py        # Configuration
│   │   ├── logging.py       # Loguru setup
│   │   └── cli.py           # Typer CLI
│   └── tests/
├── scripts/
│   └── setup-hosts.sh       # Manual hosts setup
├── Taskfile.yml             # Task runner config
├── docker-compose.dev.yml   # Development with Traefik
├── docker-compose.prod.yml  # Production
└── AGENTS.md                # AI coding guidelines
```

## Service Communication

### Development (with Traefik)
```
Browser → Traefik (HTTPS)
           ├── {{ cookiecutter.project_slug }}.local → frontend
           └── api-{{ cookiecutter.project_slug }}.local → backend → db (internal)
```

### Production (without Traefik)
```
Browser → localhost:{{ cookiecutter.frontend_port }} → frontend
       → localhost:{{ cookiecutter.backend_port }} → backend → db (internal)

Internal: frontend → backend:{{ cookiecutter.backend_port }}
          backend → db:3306
```

## Configuration

### Backend Environment (backend/.env)
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=mysql://user:password@db:3306/{{ cookiecutter.project_slug | replace('-', '_') }}
FRONTEND_URL=https://{{ cookiecutter.project_slug }}.local
```

### Backend Config (backend/config.toml)
```toml
[app]
name = "{{ cookiecutter.project_name }}"
debug = false

[api]
port = {{ cookiecutter.backend_port }}
cors_origins = ["https://{{ cookiecutter.project_slug }}.local"]
```

## License

[Your License]
