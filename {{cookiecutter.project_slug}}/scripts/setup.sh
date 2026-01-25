#!/bin/bash
# Setup project (hosts, env, network)

set -e

PROJECT_SLUG="{{ cookiecutter.project_slug }}"
FRONTEND_HOST="${PROJECT_SLUG}.local"
BACKEND_HOST="api-${PROJECT_SLUG}.local"

echo "Setting up ${PROJECT_SLUG}..."

# Add hosts entries
if ! grep -q "${FRONTEND_HOST}" /etc/hosts 2>/dev/null; then
    echo "Adding ${FRONTEND_HOST} to /etc/hosts (requires sudo)..."
    echo "127.0.0.1 ${FRONTEND_HOST}" | sudo tee -a /etc/hosts
else
    echo "✓ ${FRONTEND_HOST} already in /etc/hosts"
fi

if ! grep -q "${BACKEND_HOST}" /etc/hosts 2>/dev/null; then
    echo "Adding ${BACKEND_HOST} to /etc/hosts (requires sudo)..."
    echo "127.0.0.1 ${BACKEND_HOST}" | sudo tee -a /etc/hosts
else
    echo "✓ ${BACKEND_HOST} already in /etc/hosts"
fi

# Create backend .env if not exists
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
else
    echo "✓ backend/.env already exists"
fi

# Create traefik network if not exists
if ! docker network ls | grep -q traefik; then
    echo "Creating traefik network..."
    docker network create traefik
else
    echo "✓ traefik network already exists"
fi

echo ""
echo "✓ Setup complete!"
