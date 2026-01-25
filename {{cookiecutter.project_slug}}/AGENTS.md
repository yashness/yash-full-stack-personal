# Agent Development Guidelines

Coding philosophies and conventions for AI agents working on this project.

## General Principles

- **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't Repeat Yourself - extract common logic into reusable functions/components
- **Composition over inheritance**: Prefer composing small pieces over complex hierarchies
- **Minimal code comments**: Code should be self-explanatory; comments explain "why", not "what"

## Frontend Guidelines

### Stack
- **Framework**: Next.js with React
- **Package Manager**: bun (use `bun install`, `bun run`, `bunx`)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Type Safety**: Zod for runtime validation, TypeScript for static types
- **Icons**: Remix Icons (via shadcn config)

### Code Organization
- **File size**: Keep files under 200 lines; split into smaller components
- **Componentization**: Prefer many small components over few large ones
- **Providers & Hooks**: Use React context providers and custom hooks to avoid boilerplate
- **Library components**: Use shadcn/ui components; avoid rebuilding common UI patterns

### Scaffolding
```bash
# Initialize new project
bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=cyan&iconLibrary=remixicon&font=noto-sans&menuAccent=subtle&menuColor=default&radius=small&template=next" --template next

# Add components
bunx --bun shadcn@latest add button card dialog

# Install dependencies
bun add zod @tanstack/react-query
```

### Conventions
- No lingering warnings - fix or suppress with justification
- Use Zod schemas for form validation and API response parsing
- Prefer `use client` only when necessary
- Extract reusable logic into `/hooks` and `/lib` directories

## Backend Guidelines

### Stack
- **Package Manager**: uv (use `uv init`, `uv add`, `uv run`)
- **API Framework**: FastAPI
- **CLI Framework**: Typer + Rich
- **Logging**: Loguru (logs to `logs/` directory)
- **Configuration**: config.toml for settings, python-dotenv for secrets
- **Types**: Pydantic models for all data structures

### Code Organization
- **Function size**: Maximum 10 lines per function; extract helpers
- **File structure**: One responsibility per module
- **Tests**: pytest tests in `tests/` folder

### Scaffolding
```bash
# Initialize project
uv init

# Add dependencies
uv add fastapi uvicorn pydantic loguru python-dotenv typer rich tomli

# Add dev dependencies
uv add --dev pytest pytest-cov ruff mypy

# Run application
uv run python -m uvicorn main:app --reload
uv run python -m cli --help
```

### CLI Conventions
- Help available via both `--help` and `-h`
- All commands have shorthand flags
- Include example commands in help text
- Use Rich for formatted output

### Logging
```python
from loguru import logger

logger.add("logs/{time:YYYY-MM-DD}.log", rotation="1 day", retention="30 days")
```

### Configuration
```toml
# config.toml - non-sensitive settings
[app]
name = "my-app"
debug = false

[api]
host = "0.0.0.0"
port = 8000
```

```bash
# .env - secrets only
SECRET_KEY=xxx
DATABASE_URL=xxx
```

## Documentation

### Required Files
- `README.md` - Setup instructions, usage examples, API/CLI documentation
- `ARCHITECTURE.md` - System design, component relationships (if complex)
- `PRD.md` - Product requirements (if applicable)
- `TASKS.md` - Task tracking for longer projects (keep updated)

### README Structure
1. Project description
2. Prerequisites
3. Setup instructions
4. Usage examples (CLI commands, API calls with curl)
5. Development commands

## Git

### Configuration
```bash
git config user.name "Yash Shah"
git config user.email "yash9414@gmail.com"
```

### Commits
- Concise, descriptive messages
- Not too verbose - one line preferred
- Group related changes

## Tooling Preferences

| Task | Tool |
|------|------|
| Task runner | Taskfile (go-task) |
| Frontend package manager | bun |
| Backend package manager | uv |
| Frontend scaffolding | shadcn CLI |
| Backend scaffolding | uv init |
| Linting (Python) | ruff |
| Linting (JS/TS) | eslint (via Next.js) |
| Type checking (Python) | mypy |
| Type checking (JS/TS) | TypeScript |
| Testing (Python) | pytest |
| Testing (JS/TS) | vitest or jest |

## Taskfile Commands

Use `task` for common operations:

```bash
task dev          # Start development environment
task prod         # Start production environment
task test         # Run all tests
task lint         # Run linters
task cli -- info  # Run backend CLI
task clean        # Stop all and cleanup
```

## Anti-Patterns to Avoid

- Reinventing UI components that exist in shadcn/ui
- Large monolithic files (>200 lines frontend, >10 line functions backend)
- Hardcoding configuration values
- Missing type annotations
- Ignoring warnings without justification
- Manual file creation when CLI scaffolding exists
- Guessing library APIs - always check latest documentation
