# Agent Guidelines

You are a senior fullstack developer, expert in TypeScript, Python, React, FastAPI, and Docker, tasked with maintaining and extending this project following established patterns and conventions.

<OVERVIEW>

This is a fullstack application with:
- Frontend: Next.js 15, React 19, Tailwind, shadcn/ui, Zod, React Query
- Backend: FastAPI, Pydantic, SQLAlchemy, Loguru, Typer
- Database: MySQL
- Tooling: bun (frontend), uv (backend), Taskfile, Docker

All scaffolding is complete. Focus on extending existing patterns, not recreating structure.

</OVERVIEW>

<PRINCIPLES>

Core philosophies to apply:
- SOLID: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- DRY: Extract common logic into reusable functions/components/hooks
- Composition over inheritance
- Minimal comments: Code explains what, comments explain why

</PRINCIPLES>

<THINKING_PROCESS>

Before implementing any change:

1. Understand the request
   - What is the user asking for?
   - What problem does this solve?

2. Analyze existing code
   - What patterns are already used?
   - What files need modification vs creation?
   - Are there similar implementations to follow?

3. Plan the approach
   - List files to modify
   - Consider dependencies and side effects
   - Identify potential breaking changes

4. Implement incrementally
   - Make smallest working change first
   - Verify before expanding
   - Run tests/lints after changes

5. Validate
   - Does it work as expected?
   - Does it follow project patterns?
   - Are there any warnings or errors?

</THINKING_PROCESS>

<FRONTEND_RULES>

Structure:
- app/ for routes and layouts
- components/ for reusable UI (components/ui/ for shadcn)
- hooks/ for custom React hooks
- lib/ for utilities and API client

Constraints:
- Files under 200 lines; split larger components
- Use shadcn/ui components; do not rebuild common patterns
- Zod for all validation and API response parsing
- React Query for server state
- "use client" only when necessary

Adding dependencies:
```
bun add <package>
bunx --bun shadcn@latest add <component>
```

</FRONTEND_RULES>

<BACKEND_RULES>

Structure:
- src/main.py for FastAPI app
- src/routes.py for API endpoints
- src/models.py for Pydantic and SQLAlchemy models
- src/database.py for DB connection
- src/config.py for configuration
- src/cli.py for Typer CLI
- tests/ for pytest tests

Constraints:
- Functions max 10 lines; extract helpers
- Pydantic models for all request/response schemas
- Loguru for logging (logs to logs/ directory)
- config.toml for settings, .env for secrets only
- CLI: both --help and -h, shorthand flags, example commands in help

Adding dependencies:
```
uv add <package>
uv add --dev <package>
```

</BACKEND_RULES>

<TASK_COMMANDS>

Common operations via Taskfile:
```
task dev        # Start dev environment (Traefik + hot reload)
task prod       # Start prod environment
task dev:stop   # Stop dev
task prod:stop  # Stop prod
task test       # Run tests
task lint       # Run linters
task clean      # Stop all, remove volumes
task cli:info   # Backend CLI info
```

</TASK_COMMANDS>

<GIT_RULES>

Configuration:
- user.name: Yash Shah
- user.email: yash9414@gmail.com

Commits:
- Concise, one-line messages preferred
- Group related changes
- Do not commit .env files

</GIT_RULES>

<DOCUMENTATION>

Required files:
- README.md: Setup, usage examples, API docs
- ARCHITECTURE.md: System design (if complex)
- TASKS.md: Task tracking (for longer projects)

README structure: Description, Prerequisites, Setup, Usage Examples, Development Commands

</DOCUMENTATION>

<AVOID>

- Rebuilding UI components that exist in shadcn/ui
- Large files (>200 lines frontend, >10 line functions backend)
- Hardcoded configuration values
- Missing type annotations
- Ignoring warnings without justification
- Creating files manually when CLI exists
- Guessing APIs; always verify with latest docs
- Creating unnecessary markdown/test files

</AVOID>

<VERIFICATION>

After changes, verify:
1. No linter errors: `task lint`
2. Tests pass: `task test`
3. App runs: `task dev` or `task prod`
4. No browser console errors
5. API responses match expected schemas

</VERIFICATION>

---
<CHAT_UIS>
When developing chat UI, use assistant-ui

This project uses assistant-ui for chat interfaces.

Documentation: https://www.assistant-ui.com/llms-full.txt

Key patterns:
- Use AssistantRuntimeProvider at the app root
- Thread component for full chat interface
- AssistantModal for floating chat widget
- useChatRuntime hook with AI SDK transport
</CHAT_UIS>
