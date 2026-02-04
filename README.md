# Fullstack Docker Template

A production-grade [Cookiecutter](https://cookiecutter.readthedocs.io/) template for full-stack applications with AI capabilities.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zod |
| Backend | FastAPI, Pydantic, Loguru, Typer |
| Auth | Clerk (optional, via shadcn/ui CLI) |
| AI | assistant-ui, Claude Agent SDK |
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
no_auth [False]:
copilot_ui [True]:
include_canvas [False]:
include_flow_builder [False]:
include_mcp_creator [False]:
include_skill_creator [False]:
include_pricing [True]:
include_admin [False]:
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

### Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `project_name` | My Fullstack App | Human-readable name |
| `project_slug` | (derived) | Kebab-case identifier |
| `project_description` | A full-stack application | Description |
| `frontend_port` | 3000 | Frontend port |
| `backend_port` | 8000 | Backend port |
| `use_frontend` | true | Include frontend |
| `use_backend` | true | Include backend |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `no_auth` | false | Disable authentication |
| `copilot_ui` | true | Include AI copilot chat interface |
| `include_canvas` | false | Include agentic canvas interface |
| `include_flow_builder` | false | Include visual workflow builder |
| `include_mcp_creator` | false | Include MCP tool creator |
| `include_skill_creator` | false | Include skill/agent creator |
| `include_pricing` | true | Include pricing/billing pages |
| `include_admin` | false | Include admin dashboard |

## Runtime Feature Flags

Features can also be toggled at runtime using environment variables, allowing you to enable/disable features without regenerating the project:

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_FEATURE_COPILOT=true
NEXT_PUBLIC_FEATURE_AUTH=true
NEXT_PUBLIC_FEATURE_CANVAS=false
NEXT_PUBLIC_FEATURE_FLOW_BUILDER=false
NEXT_PUBLIC_FEATURE_MCP_CREATOR=false
NEXT_PUBLIC_FEATURE_SKILL_CREATOR=false
NEXT_PUBLIC_FEATURE_PRICING=true
NEXT_PUBLIC_FEATURE_ADMIN=false
```

**Backend** (`.env`):
```bash
FEATURE_COPILOT=true
FEATURE_AUTH=true
FEATURE_CANVAS=false
FEATURE_FLOW_BUILDER=false
FEATURE_MCP_CREATOR=false
FEATURE_SKILL_CREATOR=false
FEATURE_PRICING=true
FEATURE_ADMIN=false
```

## Generated Structure

```
my-app/
├── frontend/
│   ├── Dockerfile           # Bun + Next.js (dev/prod)
│   ├── package.json
│   ├── components.json      # shadcn/ui config
│   ├── app/
│   │   ├── page.tsx         # Landing page
│   │   ├── copilot/         # AI chat interface (if enabled)
│   │   ├── pricing/         # Pricing page (if enabled)
│   │   ├── billing/         # Billing page (if enabled)
│   │   └── todos/           # Example todo app
│   ├── components/
│   │   ├── copilot/         # Chat UI components
│   │   ├── layout/          # Header, navigation
│   │   └── ui/              # shadcn/ui components
│   └── lib/
│       ├── features.ts      # Runtime feature flags
│       └── api.ts           # API client
├── backend/
│   ├── Dockerfile           # uv + FastAPI (dev/prod)
│   ├── pyproject.toml       # uv project
│   ├── config.toml          # Configuration
│   ├── src/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Config with feature flags
│   │   ├── routes.py        # API routes
│   │   ├── models.py        # Pydantic models
│   │   ├── chat.py          # AI chat endpoints
│   │   └── webhooks.py      # Clerk webhooks
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

### AI Copilot (Optional)

Built-in AI chat interface using [assistant-ui](https://assistant-ui.com):
- Thread-based conversations with history
- Tool calling support
- Markdown rendering
- Voice input
- Image uploads

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

### Pricing & Billing (Optional)

When `include_pricing` is enabled:
- Pricing page with Clerk Billing integration
- Billing management page
- Subscription handling

### Backend
- **FastAPI** with automatic OpenAPI docs
- **Pydantic** for all data models
- **Typer** CLI with Rich formatting
- **Loguru** logging to files
- **config.toml** for settings, `.env` for secrets
- **pytest** test suite
- **Feature flags** in settings for runtime toggles

### Frontend
- **Next.js 15** with App Router
- **shadcn/ui** component library (pre-configured)
- **assistant-ui** for AI chat interfaces
- **Zod** for runtime validation
- **Bun** for fast builds
- **React Query** for server state
- **Runtime feature flags** for conditional rendering

## Adding shadcn/ui Components

```bash
cd frontend
bunx --bun shadcn@latest add button card input
```

## Feature Roadmap

The template supports scaffolding flags for future features:

- **Agentic Canvas** (`include_canvas`): Visual canvas for AI agent workflows
- **Flow Builder** (`include_flow_builder`): Node-based workflow editor
- **MCP Creator** (`include_mcp_creator`): Model Context Protocol tool builder
- **Skill/Agent Creator** (`include_skill_creator`): Custom skill and agent creation
- **Admin Dashboard** (`include_admin`): User and settings management

These features are placeholder-enabled - the navigation and routing infrastructure is included, but full implementations should be added based on your needs.

See `AGENTS.md` in the generated project for coding guidelines.

## License

MIT
