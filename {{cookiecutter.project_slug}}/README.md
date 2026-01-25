# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

A fullstack todo application with Next.js frontend and FastAPI backend.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zod, React Query |
| Backend | FastAPI, Pydantic, SQLAlchemy, Loguru |
| Database | MySQL 8.0 |
| Package Managers | bun (frontend), uv (backend) |

## Quick Start

### 1. Setup Hosts

```bash
# Run the setup script
sudo ./scripts/setup-hosts.sh

# Or manually add to /etc/hosts:
# 127.0.0.1 {{ cookiecutter.project_slug }}.local
# 127.0.0.1 api-{{ cookiecutter.project_slug }}.local
```

### 2. Create Traefik Network

```bash
docker network create traefik
```

### 3. Setup Backend Environment

```bash
cp backend/.env.example backend/.env
```

### 4. Start Development

```bash
docker compose -f docker-compose.dev.yml up
```

### 5. Access the App

- **Frontend**: https://{{ cookiecutter.project_slug }}.local
- **Backend API**: https://api-{{ cookiecutter.project_slug }}.local
- **API Docs**: https://api-{{ cookiecutter.project_slug }}.local/docs

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

## Production

```bash
# Build and run production
docker compose -f docker-compose.prod.yml up --build

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
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── todo-list.tsx
│   │   ├── todo-item.tsx
│   │   └── add-todo.tsx
│   ├── hooks/
│   │   └── use-todos.ts     # React Query hooks
│   └── lib/
│       ├── api.ts           # API client with Zod
│       └── utils.ts
├── backend/
│   ├── src/
│   │   ├── main.py          # FastAPI app
│   │   ├── routes.py        # Todo CRUD endpoints
│   │   ├── models.py        # Pydantic + SQLAlchemy models
│   │   ├── database.py      # MySQL connection
│   │   ├── config.py        # Configuration
│   │   ├── logging.py       # Loguru setup
│   │   └── cli.py           # Typer CLI
│   ├── tests/
│   ├── config.toml
│   └── pyproject.toml
├── scripts/
│   └── setup-hosts.sh       # Add /etc/hosts entries
├── docker-compose.dev.yml   # Development with Traefik
├── docker-compose.prod.yml  # Production
└── AGENTS.md                # AI coding guidelines
```

## Configuration

### Backend Environment (.env)
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=mysql://user:password@db:3306/{{ cookiecutter.project_slug | replace('-', '_') }}
FRONTEND_URL=https://{{ cookiecutter.project_slug }}.local
```

### Backend Config (config.toml)
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
