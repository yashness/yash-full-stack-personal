# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

A fullstack todo application with Next.js frontend and FastAPI backend.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zod, React Query |
| Backend | FastAPI, Pydantic, SQLAlchemy, Loguru, Typer |
| Auth | Clerk (optional, via shadcn/ui CLI) |
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

- **Frontend**: https://{{ cookiecutter.project_slug }}.dev.test
- **Backend API**: https://api-{{ cookiecutter.project_slug }}.dev.test
- **API Docs**: https://api-{{ cookiecutter.project_slug }}.dev.test/docs

## Adding Authentication (Clerk)

Add Clerk authentication using the official shadcn/ui Clerk registry:

```bash
cd frontend

# Install dependencies first (if not already done)
bun install

# Full quickstart - includes layout, sign-in/up pages, header
bunx --bun shadcn@latest add @clerk/nextjs-quickstart --overwrite

# Rename proxy.ts to middleware.ts
mv proxy.ts middleware.ts
```

After running setup:

1. **Fix layout.tsx** - Add `Providers` wrapper for React Query:
   ```tsx
   // In app/layout.tsx, add import:
   import { Providers } from './providers';

   // Wrap children with Providers inside ThemeProvider:
   <ThemeProvider ...>
     <Providers>
       <Header />
       {children}
     </Providers>
   </ThemeProvider>
   ```

2. **Add Clerk keys** to `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Rebuild**: `task dev:rebuild`

## Adding Billing (Clerk Billing)

After setting up Clerk authentication, you can enable billing:

1. **Enable Clerk Billing** in your [Clerk Dashboard](https://dashboard.clerk.com/~/billing/settings)

2. **Create Plans** in the [Subscription Plans](https://dashboard.clerk.com/~/billing/plans) page

3. **Access the pages**:
   - `/pricing` - Public pricing page with `<PricingTable />`
   - `/billing` - Protected billing management page (requires sign-in)

### Protect Content by Plan or Feature

Use `has()` to check access server-side:

```tsx
import { auth } from '@clerk/nextjs/server'

export default async function PremiumPage() {
  const { has } = await auth()

  if (!has({ plan: 'pro' })) {
    return <p>Upgrade to Pro to access this content.</p>
  }

  return <h1>Pro Content</h1>
}
```

Or use `<Protect>` component:

```tsx
import { Protect } from '@clerk/nextjs'

export default function Page() {
  return (
    <Protect plan="pro" fallback={<p>Upgrade required</p>}>
      <h1>Pro Content</h1>
    </Protect>
  )
}
```

### Backend Integration

The backend uses `clerk-backend-api` to verify tokens and sync user data.

#### Protected Endpoints

```python
from src.clerk import CurrentUser, CurrentUserWithSubscription, require_plan

# Basic auth - requires any authenticated user
@router.get("/me")
async def get_profile(user: CurrentUser):
    return {"user_id": user.user_id}

# With subscription info
@router.get("/subscription")
async def get_subscription(user: CurrentUserWithSubscription):
    return {"plan": user.plan, "features": user.features}

# Require specific plan
@router.get("/premium")
async def premium_content(user = Depends(require_plan("pro"))):
    return {"message": "Premium content"}
```

#### Webhooks

Set up webhooks in [Clerk Dashboard](https://dashboard.clerk.com/webhooks):
- **Endpoint URL**: `https://api-{{ cookiecutter.project_slug }}.dev.test/api/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`, `subscription.*`

Add the webhook secret to `backend/.env`:
```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

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
curl https://api-{{ cookiecutter.project_slug }}.dev.test/api/v1/todos

# Create a todo
curl -X POST https://api-{{ cookiecutter.project_slug }}.dev.test/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'

# Update a todo
curl -X PATCH https://api-{{ cookiecutter.project_slug }}.dev.test/api/v1/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a todo
curl -X DELETE https://api-{{ cookiecutter.project_slug }}.dev.test/api/v1/todos/1

# Health check
curl https://api-{{ cookiecutter.project_slug }}.dev.test/health
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
│   ├── app/
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── header.tsx       # Navigation
│   ├── hooks/               # React Query hooks
│   ├── lib/                 # API client + utilities
│   └── components.json      # shadcn/ui config
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
           ├── {{ cookiecutter.project_slug }}.dev.test → frontend
           └── api-{{ cookiecutter.project_slug }}.dev.test → backend → db (internal)
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
FRONTEND_URL=https://{{ cookiecutter.project_slug }}.dev.test
```

### Backend Config (backend/config.toml)
```toml
[app]
name = "{{ cookiecutter.project_name }}"
debug = false

[api]
port = {{ cookiecutter.backend_port }}
cors_origins = ["https://{{ cookiecutter.project_slug }}.dev.test"]
```

## License

[Your License]
