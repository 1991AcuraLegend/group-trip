#!/usr/bin/env bash
# docker-start.sh — Start TravelPlanner via Docker Compose

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/.env.docker"

# ── Guard: .env.docker exists ─────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "No .env.docker found — copying from .env.docker.example"
  cp "$DIR/.env.docker.example" "$ENV_FILE"
  echo ""
  echo "  IMPORTANT: Edit .env.docker with your configuration."
  echo "  At minimum, set NEXTAUTH_SECRET to a secure random string."
  echo ""
  read -rp "Press Enter to continue, or Ctrl+C to abort..."
fi

# ── Start Docker Compose ───────────────────────────────────────────────────────
echo "==> Starting TravelPlanner via Docker Compose..."
cd "$DIR"
docker-compose --env-file "$ENV_FILE" up -d

echo ""
echo "  TravelPlanner is running at http://localhost:3000"
echo ""
echo "  View logs:  docker-compose --env-file .env.docker logs -f app"
echo "  Stop:       ./docker-stop.sh"
