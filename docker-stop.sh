#!/usr/bin/env bash
# docker-stop.sh — Stop TravelPlanner Docker containers

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/.env.docker"

# ── Stop Docker Compose ────────────────────────────────────────────────────────
echo "==> Stopping TravelPlanner Docker containers..."
cd "$DIR"
docker-compose --env-file "$ENV_FILE" down

echo ""
echo "  TravelPlanner containers stopped."
echo "  To restart, run: ./docker-start.sh"
