# Template Improvements

This document outlines improvements to the cookiecutter template for better maintainability, reduced jinja complexity, and expanded scaffolding options.

## Current State Analysis

### Jinja Usage in Code Files

Currently, jinja templating is used in two ways:
1. **Variable substitution** (`{{ cookiecutter.project_name }}`) - Used for project-specific values
2. **Conditional blocks** (`{% if cookiecutter.copilot_ui %}...{% endif %}`) - Used for feature toggling

**Files with conditional jinja:**
- `backend/src/main.py` - Chat router import/include
- `backend/src/models.py` - Chat/Thread models
- `backend/pyproject.toml` - Copilot dependencies
- `frontend/package.json` - Copilot dependencies
- `frontend/lib/features.ts` - Feature flag generation

**Problem:** Jinja conditionals in code files make them harder to read, maintain, and debug.

### Current Scaffolding Options

```json
{
  "project_name": "...",
  "project_slug": "...",
  "project_description": "...",
  "frontend_port": "3000",
  "backend_port": "8000",
  "use_frontend": true,
  "use_backend": true,
  "no_auth": false,
  "copilot_ui": true
}
```

## Improvement Strategy

### 1. Reduce Jinja in Code Files

**Strategy:** Move from compile-time (jinja) to runtime (environment/config) feature detection.

**Benefits:**
- Cleaner, more readable source code
- Easier to modify features after project generation
- Better IDE support and type checking
- Simpler debugging

**Implementation:**

#### Environment-Based Configuration

Instead of jinja conditionals, use environment variables and a unified config approach:

```typescript
// frontend/lib/config.ts
export const CONFIG = {
  features: {
    copilot: process.env.NEXT_PUBLIC_FEATURE_COPILOT === 'true',
    auth: process.env.NEXT_PUBLIC_FEATURE_AUTH === 'true',
    canvas: process.env.NEXT_PUBLIC_FEATURE_CANVAS === 'true',
    flowBuilder: process.env.NEXT_PUBLIC_FEATURE_FLOW_BUILDER === 'true',
    mcpCreator: process.env.NEXT_PUBLIC_FEATURE_MCP_CREATOR === 'true',
    skillCreator: process.env.NEXT_PUBLIC_FEATURE_SKILL_CREATOR === 'true',
    pricing: process.env.NEXT_PUBLIC_FEATURE_PRICING === 'true',
    admin: process.env.NEXT_PUBLIC_FEATURE_ADMIN === 'true',
  },
  project: {
    name: process.env.NEXT_PUBLIC_PROJECT_NAME || 'My App',
    description: process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION || '',
  },
};
```

```python
# backend/src/config.py
class FeaturesConfig:
    copilot: bool = Field(default=False)
    auth: bool = Field(default=True)
    canvas: bool = Field(default=False)
    flow_builder: bool = Field(default=False)
    mcp_creator: bool = Field(default=False)
    skill_creator: bool = Field(default=False)
    pricing: bool = Field(default=False)
    admin: bool = Field(default=False)
```

#### Post-Generation Hook Improvements

The `post_gen_project.py` hook will:
1. Generate `.env` files with appropriate feature flags
2. Remove unused feature directories/files
3. Update `package.json` and `pyproject.toml` without jinja

### 2. New Scaffolding Flags

Add the following options to `cookiecutter.json`:

```json
{
  "include_copilot": true,
  "include_canvas": false,
  "include_flow_builder": false,
  "include_mcp_creator": false,
  "include_skill_creator": false,
  "include_pricing": false,
  "include_admin": false,
  "auth_provider": ["clerk", "none"]
}
```

### 3. Out-of-the-Box Features

#### Pricing Pages
- `/pricing` - Public pricing page with plans
- `/billing` - Authenticated billing management
- Backend: Stripe/billing webhooks integration

#### Admin Interface
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/settings` - Application settings
- Protected by role-based access

#### Agentic Canvas
- `/canvas` - Visual canvas for AI agent workflows
- Drag-and-drop interface
- Agent execution visualization

#### Flow Builder
- `/flow-builder` - Visual workflow builder
- Node-based graph editing
- Export/import workflows

#### MCP Creator
- `/mcp-creator` - Model Context Protocol creator
- Define and test MCP tools
- Export MCP configurations

#### Skill & Agent Creator
- `/agents` - Agent creation and management
- `/skills` - Skill library and creation
- Integration with copilot chat

## Implementation Files

### Files to Add

1. **Frontend Pages:**
   - `frontend/app/admin/page.tsx`
   - `frontend/app/admin/users/page.tsx`
   - `frontend/app/admin/settings/page.tsx`
   - `frontend/app/canvas/page.tsx`
   - `frontend/app/flow-builder/page.tsx`
   - `frontend/app/mcp-creator/page.tsx`
   - `frontend/app/agents/page.tsx`
   - `frontend/app/skills/page.tsx`

2. **Frontend Components:**
   - `frontend/components/admin/` - Admin UI components
   - `frontend/components/canvas/` - Canvas components
   - `frontend/components/flow-builder/` - Flow builder components
   - `frontend/components/mcp-creator/` - MCP creator components
   - `frontend/components/agent-creator/` - Agent/Skill creator components

3. **Backend Routes:**
   - `backend/src/admin.py` - Admin API routes
   - `backend/src/canvas.py` - Canvas state management
   - `backend/src/flows.py` - Flow execution engine
   - `backend/src/mcp.py` - MCP management
   - `backend/src/agents.py` - Agent/Skill management

4. **Configuration:**
   - `frontend/lib/config.ts` - Centralized config
   - Updated `.env.example` files with feature flags

### Files to Modify

1. `cookiecutter.json` - Add new options
2. `hooks/post_gen_project.py` - Handle new options
3. `backend/src/main.py` - Remove jinja, use config
4. `backend/src/models.py` - Remove jinja, always include models
5. `backend/pyproject.toml` - Remove jinja, include all deps
6. `frontend/package.json` - Remove jinja, include all deps
7. `frontend/lib/features.ts` - Remove jinja, use env vars

## Migration Path

For existing projects:
1. Add environment variables for features
2. Unused features remain dormant but present
3. Enable features by changing env vars
4. No code changes required

## File Cleanup Strategy

The post-generation hook removes directories for disabled features:

```python
# Features and their associated directories
FEATURE_DIRECTORIES = {
    'copilot': [
        'frontend/app/copilot',
        'frontend/components/copilot',
        'frontend/components/copilot-chat.tsx',
        'frontend/app/api/chat',
        'frontend/app/api/threads',
    ],
    'canvas': [
        'frontend/app/canvas',
        'frontend/components/canvas',
    ],
    'flow_builder': [
        'frontend/app/flow-builder',
        'frontend/components/flow-builder',
    ],
    'mcp_creator': [
        'frontend/app/mcp-creator',
        'frontend/components/mcp-creator',
    ],
    'skill_creator': [
        'frontend/app/agents',
        'frontend/app/skills',
        'frontend/components/agent-creator',
    ],
    'pricing': [
        'frontend/app/pricing',
        'frontend/app/billing',
        'frontend/components/billing-content.tsx',
    ],
    'admin': [
        'frontend/app/admin',
        'frontend/components/admin',
    ],
}
```

## Recommended Approach

### Phase 1: Refactor Existing Code
1. Move jinja conditionals to runtime config
2. Update features.ts to use environment variables
3. Update post_gen_project.py to generate .env files

### Phase 2: Add New Features
1. Add placeholder pages for new features
2. Add scaffolding options to cookiecutter.json
3. Update hook to handle new options

### Phase 3: Documentation
1. Update README.md with new options
2. Add feature-specific documentation
3. Update AGENTS.md with new patterns
