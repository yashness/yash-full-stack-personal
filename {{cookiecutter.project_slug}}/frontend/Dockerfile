# =============================================================================
# Frontend Dockerfile - Next.js + Bun
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage: Bun runtime
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lockb* ./

# -----------------------------------------------------------------------------
# Development stage
# -----------------------------------------------------------------------------
FROM base AS dev
RUN bun install
COPY . .
EXPOSE {{ cookiecutter.frontend_port }}
CMD ["bun", "run", "dev"]

# -----------------------------------------------------------------------------
# Dependencies stage
# -----------------------------------------------------------------------------
FROM base AS deps
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Build stage
# -----------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# -----------------------------------------------------------------------------
# Production stage
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS prod
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE {{ cookiecutter.frontend_port }}
ENV PORT={{ cookiecutter.frontend_port }}
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]
