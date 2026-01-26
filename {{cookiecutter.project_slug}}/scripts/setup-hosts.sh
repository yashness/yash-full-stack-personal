#!/bin/bash
# =============================================================================
# Setup /etc/hosts entries for local development
# =============================================================================
# Run with: sudo ./scripts/setup-hosts.sh
# =============================================================================

set -e

HOSTS_FILE="/etc/hosts"
PROJECT_SLUG="{{ cookiecutter.project_slug }}"

FRONTEND_HOST="${PROJECT_SLUG}.dev.test"
BACKEND_HOST="api-${PROJECT_SLUG}.dev.test"

add_host_entry() {
    local hostname=$1
    if grep -q "$hostname" "$HOSTS_FILE"; then
        echo "✓ $hostname already exists in $HOSTS_FILE"
    else
        echo "127.0.0.1 $hostname" >> "$HOSTS_FILE"
        echo "✓ Added $hostname to $HOSTS_FILE"
    fi
}

echo "Setting up /etc/hosts entries for $PROJECT_SLUG..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run with sudo"
    echo "Usage: sudo ./scripts/setup-hosts.sh"
    exit 1
fi

add_host_entry "$FRONTEND_HOST"
add_host_entry "$BACKEND_HOST"

echo ""
echo "Done! You can now access:"
echo "  Frontend: https://$FRONTEND_HOST"
echo "  Backend:  https://$BACKEND_HOST"
