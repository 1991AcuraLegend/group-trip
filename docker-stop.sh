#!/usr/bin/env bash
# docker-stop.sh — Stop TravelPlanner Docker containers

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/.env.docker"
STATE_FILE="$DIR/.docker-mode"

# ── Determine which env file was used ──────────────────────────────────────────
ACTIVE_ENV_FILE="$ENV_FILE"
if [[ -f "$STATE_FILE" ]]; then
  ACTIVE_MODE=$(cat "$STATE_FILE")
  if [[ "$ACTIVE_MODE" == "localhost" ]]; then
    ACTIVE_ENV_FILE="$ENV_FILE.localhost"
  fi
fi

# ── Stop Docker Compose ────────────────────────────────────────────────────────
echo "==> Stopping TravelPlanner Docker containers..."
cd "$DIR"
docker-compose --env-file "$ACTIVE_ENV_FILE" down

echo ""
echo "  TravelPlanner containers stopped."
echo "  To restart, run: ./docker-start.sh [-localhost]"
