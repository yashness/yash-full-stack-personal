# Fullstack Docker Template

A production-grade [Cookiecutter](https://cookiecutter.readthedocs.io/) template for full-stack applications.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zod |
| Backend | FastAPI, Pydantic, Loguru, Typer |
| Auth | Clerk (optional, via shadcn/ui CLI) |
| Package Managers | bun (frontend), uv (backend) |
| Development | Docker, Traefik (HTTPS), hot reload |

## Quick Start

### 1. Install Cookiecutter

```bash
pip install cookiecutter
# or
pipx install cookiecutter
```

### 2. Generate Project

```bash
cookiecutter gh:your-username/fullstack-docker-template
# or from local
cookiecutter /path/to/this/repo
```

### 3. Answer Prompts

```
project_name [My Fullstack App]: My App
project_slug [my-app]:
project_description [A full-stack application]:
frontend_port [3000]:
backend_port [8000]:
use_frontend [True]:
use_backend [True]:
```

### 4. Setup & Run

```bash
cd my-app

# One command to setup and start (requires go-task)
task dev

# Or manually:
# sudo ./scripts/setup-hosts.sh
# cp backend/.env.example backend/.env
# docker network create traefik
# docker compose -f docker-compose.dev.yml up
```

## Template Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `project_name` | My Fullstack App | Human-readable name |
| `project_slug` | (derived) | Kebab-case identifier |
| `project_description` | A full-stack application | Description |
| `frontend_port` | 3000 | Frontend port |
| `backend_port` | 8000 | Backend port |
| `use_frontend` | true | Include frontend |
| `use_backend` | true | Include backend |

## Generated Structure

```
my-app/
├── frontend/
│   ├── Dockerfile           # Bun + Next.js (dev/prod)
│   ├── package.json
│   └── components.json      # shadcn/ui config
├── backend/
│   ├── Dockerfile           # uv + FastAPI (dev/prod)
│   ├── pyproject.toml       # uv project
│   ├── config.toml          # Configuration
│   ├── src/
│   │   ├── main.py          # FastAPI app
│   │   ├── cli.py           # Typer CLI
│   │   ├── routes.py        # API routes
│   │   ├── models.py        # Pydantic models
│   │   ├── config.py        # Config loading
│   │   └── logging.py       # Loguru
│   └── tests/               # Pytest tests
├── docker-compose.dev.yml   # Traefik + hot reload
├── docker-compose.prod.yml  # Production
├── AGENTS.md                # AI coding guidelines
└── README.md
```

## Development vs Production

### Development
- Hot reload via volume mounts
- HTTPS via Traefik
- Domain-based routing (`app.dev.test`, `api-app.dev.test`)
- No exposed ports

### Production
- Optimized immutable images
- No Traefik dependency
- Exposed ports for local testing
- Cloud-ready (use platform ingress)

## Key Features

### Authentication (Clerk - Optional)

Add Clerk authentication using the official shadcn/ui CLI:

```bash
cd frontend
bun run setup:clerk  # Runs: bunx --bun shadcn@latest add @clerk/nextjs-quickstart
```

This installs:
- **ClerkProvider** with theme integration
- **Sign-in/sign-up pages** with catch-all routes
- **Middleware** for route protection
- **Header component** with auth buttons
- **Theme provider** for dark/light mode

After setup, add your Clerk keys to `.env` and rebuild.

### Backend
- **FastAPI** with automatic OpenAPI docs
- **Pydantic** for all data models
- **Typer** CLI with Rich formatting
- **Loguru** logging to files
- **config.toml** for settings, `.env` for secrets
- **pytest** test suite

### Frontend
- **Next.js 15** with App Router
- **shadcn/ui** component library (pre-configured)
- **Zod** for runtime validation
- **Bun** for fast builds
- **React Query** for server state

## Adding shadcn/ui Components

```bash
cd frontend
bunx --bun shadcn@latest add button card input
```

See `AGENTS.md` in the generated project for coding guidelines.

## License

MIT
