# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Pydantic, Loguru |
| Package Managers | bun (frontend), uv (backend) |
| Development | Docker, Traefik (HTTPS) |

## Prerequisites

- Docker and Docker Compose
- Traefik running on `traefik` network (dev only)
- bun (optional, for local frontend dev)
- uv (optional, for local backend dev)

## Quick Start

### 1. Setup

```bash
# Add local DNS entries
echo "127.0.0.1 {{ cookiecutter.project_slug }}.local" | sudo tee -a /etc/hosts
echo "127.0.0.1 api-{{ cookiecutter.project_slug }}.local" | sudo tee -a /etc/hosts

# Create traefik network (if not exists)
docker network create traefik

# Setup backend secrets
cp backend/.env.example backend/.env
```

### 2. Development

```bash
docker compose -f docker-compose.dev.yml up
```

**Access:**
- Frontend: https://{{ cookiecutter.project_slug }}.local
- Backend API: https://api-{{ cookiecutter.project_slug }}.local
- API Docs: https://api-{{ cookiecutter.project_slug }}.local/docs

### 3. Production (Local Test)

```bash
docker compose -f docker-compose.prod.yml up --build
```

**Access:**
- Frontend: http://localhost:{{ cookiecutter.frontend_port }}
- Backend API: http://localhost:{{ cookiecutter.backend_port }}

## Backend

### Local Development (without Docker)

```bash
cd backend

# Install dependencies
uv sync

# Run API server
uv run uvicorn src.main:app --reload --port {{ cookiecutter.backend_port }}

# Run CLI
uv run cli --help
uv run cli info -v
uv run cli serve -p 8080 -r

# Run tests
uv run pytest

# Lint
uv run ruff check .
uv run mypy src
```

### CLI Commands

```bash
# Show configuration
cli info                    # Basic info
cli info -v                 # Verbose

# Start server
cli serve                   # Default port
cli serve -p 8080           # Custom port
cli serve -r                # With hot reload
cli serve -w 4              # Multiple workers

# Health check
cli health                  # Check localhost
cli health -u https://api.example.com
```

### API Endpoints

```bash
# Health check
curl http://localhost:{{ cookiecutter.backend_port }}/health

# Root
curl http://localhost:{{ cookiecutter.backend_port }}/

# API endpoints
curl http://localhost:{{ cookiecutter.backend_port }}/api/v1/hello

# Interactive docs
open http://localhost:{{ cookiecutter.backend_port }}/docs
```

## Frontend

### Initial Setup

After generating the project, scaffold the frontend:

```bash
cd frontend
rm -rf package.json SETUP.md public

# Scaffold with shadcn
bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=cyan&iconLibrary=remixicon&font=noto-sans&menuAccent=subtle&menuColor=default&radius=small&template=next" --template next .

# Add components
bunx --bun shadcn@latest add button card input form dialog

# Add dependencies
bun add zod @tanstack/react-query

# Configure for Docker (add to next.config.ts)
# output: 'standalone'
```

### Local Development (without Docker)

```bash
cd frontend
bun install
bun run dev
```

## Project Structure

```
{{ cookiecutter.project_slug }}/
├── frontend/
│   ├── Dockerfile
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   └── ...
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml       # uv project config
│   ├── config.toml          # App configuration
│   ├── src/
│   │   ├── main.py          # FastAPI app
│   │   ├── cli.py           # Typer CLI
│   │   ├── routes.py        # API routes
│   │   ├── models.py        # Pydantic models
│   │   ├── config.py        # Config loading
│   │   └── logging.py       # Loguru setup
│   ├── tests/               # Pytest tests
│   └── logs/                # Log files
├── docker-compose.dev.yml   # Dev with Traefik
├── docker-compose.prod.yml  # Production
├── AGENTS.md                # AI coding guidelines
└── README.md
```

## Configuration

### Backend Configuration

**config.toml** - Non-sensitive settings:
```toml
[app]
name = "{{ cookiecutter.project_name }}"
debug = false

[api]
port = {{ cookiecutter.backend_port }}
workers = 4
```

**backend/.env** - Secrets:
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@db:5432/mydb
```

## Deployment

Production images are cloud-agnostic:

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Push to registry
docker tag {{ cookiecutter.project_slug }}-backend:latest your-registry/backend:v1.0
docker push your-registry/backend:v1.0
```

Use your cloud platform's ingress/load balancer for TLS termination.

## License

[Your License]
