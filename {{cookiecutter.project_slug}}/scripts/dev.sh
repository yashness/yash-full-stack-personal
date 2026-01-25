#!/bin/bash
# Start development environment

set -e

PROJECT_SLUG="{{ cookiecutter.project_slug }}"
FRONTEND_HOST="${PROJECT_SLUG}.local"
BACKEND_HOST="api-${PROJECT_SLUG}.local"

echo ""
echo "Starting development environment..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "=================================================="
echo "  Development environment is starting..."
echo "=================================================="
echo ""
echo "  Frontend:  https://${FRONTEND_HOST}"
echo "  Backend:   https://${BACKEND_HOST}"
echo "  API Docs:  https://${BACKEND_HOST}/docs"
echo ""
echo "  Logs: docker compose -f docker-compose.dev.yml logs -f"
echo "=================================================="
