# =============================================================================
# Frontend Dockerfile - Next.js + Bun
# =============================================================================
# Multi-stage build with dev and prod targets.
# Uses bun for fast package management and execution.
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage: Bun runtime
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# -----------------------------------------------------------------------------
# Development stage
# -----------------------------------------------------------------------------
FROM base AS dev

# Install all dependencies including devDependencies
RUN bun install

# Copy source (overridden by volume mount in dev compose)
COPY . .

EXPOSE {{ cookiecutter.frontend_port }}

# Next.js dev server with hot reload
CMD ["bun", "run", "dev"]

# -----------------------------------------------------------------------------
# Build stage: Compile for production
# -----------------------------------------------------------------------------
FROM base AS builder

# Install dependencies
RUN bun install --frozen-lockfile

COPY . .

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN bun run build

# -----------------------------------------------------------------------------
# Production stage: Minimal runtime
# -----------------------------------------------------------------------------
FROM oven/bun:1-alpine AS prod

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE {{ cookiecutter.frontend_port }}

ENV PORT={{ cookiecutter.frontend_port }}
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]
