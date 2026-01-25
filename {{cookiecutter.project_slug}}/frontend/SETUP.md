# Frontend Setup

This is a placeholder. After generating the project, scaffold the actual frontend:

## Quick Start

```bash
cd frontend

# Remove placeholder files
rm -rf package.json SETUP.md public

# Scaffold with shadcn (creates Next.js + Tailwind + shadcn)
bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=stone&theme=cyan&iconLibrary=remixicon&font=noto-sans&menuAccent=subtle&menuColor=default&radius=small&template=next" --template next .

# Add commonly used components
bunx --bun shadcn@latest add button card input label form dialog

# Add useful dependencies
bun add zod @tanstack/react-query

# Update next.config.ts for Docker standalone output
# Add: output: 'standalone' to the config
```

## Project Structure After Setup

```
frontend/
├── app/                    # Next.js app router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Tailwind imports
├── components/
│   ├── ui/                 # shadcn components
│   └── ...                 # Custom components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and helpers
├── providers/              # React context providers
└── types/                  # TypeScript types and Zod schemas
```

## Key Configuration

### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker
};

export default nextConfig;
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api-{{ cookiecutter.project_slug }}.local
```
