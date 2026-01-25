#!/bin/bash
# Start production environment

set -e

FRONTEND_PORT="{{ cookiecutter.frontend_port }}"
BACKEND_PORT="{{ cookiecutter.backend_port }}"

echo ""
echo "Building and starting production environment..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=================================================="
echo "  Production environment is starting..."
echo "=================================================="
echo ""
echo "  Frontend:  http://localhost:${FRONTEND_PORT}"
echo "  Backend:   http://localhost:${BACKEND_PORT}"
echo "  API Docs:  http://localhost:${BACKEND_PORT}/docs"
echo ""
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "=================================================="
