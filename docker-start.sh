#!/usr/bin/env bash
# docker-start.sh — Start TravelPlanner via Docker Compose

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$DIR/.env.docker"
STATE_FILE="$DIR/.docker-mode"
LOCALHOST_MODE=false

# ── Parse command-line arguments ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -localhost)
      LOCALHOST_MODE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [-localhost]"
      exit 1
      ;;
  esac
done

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

# ── Detect mode switching ──────────────────────────────────────────────────────
REQUESTED_MODE="production"
if [[ "$LOCALHOST_MODE" = true ]]; then
  REQUESTED_MODE="localhost"
fi

if [[ -f "$STATE_FILE" ]]; then
  ACTIVE_MODE=$(cat "$STATE_FILE")
  if [[ "$ACTIVE_MODE" != "$REQUESTED_MODE" ]]; then
    echo ""
    echo "  ⚠ Mode switch detected!"
    echo "    Current mode:   $ACTIVE_MODE"
    echo "    Requested mode: $REQUESTED_MODE"
    echo ""
    echo "  Database credentials differ between modes. To avoid authentication errors,"
    echo "  the Docker volumes should be cleaned."
    echo ""
    read -rp "  Clean Docker volumes and restart? (y/n): " -n 1 RESPONSE
    echo ""
    if [[ "$RESPONSE" == "y" || "$RESPONSE" == "Y" ]]; then
      echo "  Removing containers and volumes..."
      docker-compose --env-file "$ENV_FILE" down -v
    else
      echo "  Proceeding without cleaning volumes. You may encounter auth errors."
    fi
  fi
fi

# ── Set active environment file based on mode ─────────────────────────────────
ACTIVE_ENV_FILE="$ENV_FILE"
if [[ "$LOCALHOST_MODE" = true ]]; then
  echo "==> Configuring for localhost development..."
  ACTIVE_ENV_FILE="$ENV_FILE.localhost"
  if [[ ! -f "$ACTIVE_ENV_FILE" ]]; then
    cp "$DIR/.env.docker.example" "$ACTIVE_ENV_FILE"
    sed -i '' 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://localhost:3000|' "$ACTIVE_ENV_FILE"
    sed -i '' 's|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=docker-dev-secret-change-in-production|' "$ACTIVE_ENV_FILE"
  fi
fi

# ── Start Docker Compose ───────────────────────────────────────────────────────
echo "==> Starting TravelPlanner via Docker Compose..."
cd "$DIR"
docker-compose --env-file "$ACTIVE_ENV_FILE" up -d --build

# ── Save current mode ──────────────────────────────────────────────────────────
echo "$REQUESTED_MODE" > "$STATE_FILE"

echo ""
echo "  TravelPlanner is running at http://localhost:3000"
echo ""
echo "  View logs:  docker-compose --env-file .env.docker logs -f app"
echo "  Stop:       ./docker-stop.sh"
