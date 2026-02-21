#!/usr/bin/env bash
# start.sh — Start all TravelPlanner services (PostgreSQL + Next.js)

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.pids"
TUNNEL_PID_FILE="$DIR/.tunnel.pid"
LOG_FILE="$DIR/.nextjs.log"
TUNNEL_LOG_FILE="$DIR/.tunnel.log"
CONTAINER="travelplanner-db"
DB_PORT=5432

# ── Guard: already running? ───────────────────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "TravelPlanner is already running (PID $EXISTING_PID)."
    echo "Access it at http://localhost:3000  |  Stop with: ./stop.sh"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# ── Environment ───────────────────────────────────────────────────────────────
if [[ ! -f "$DIR/.env" ]]; then
  echo "No .env found — copying from .env.example"
  cp "$DIR/.env.example" "$DIR/.env"
  echo ""
  echo "  IMPORTANT: Edit .env with your credentials before continuing."
  echo "  At minimum, set NEXTAUTH_SECRET to a random string."
  echo ""
  read -rp "Press Enter to continue with example defaults, or Ctrl+C to abort..."
fi

# ── Docker Desktop ────────────────────────────────────────────────────────────
if ! docker info &>/dev/null; then
  echo "==> Starting Docker Desktop..."
  open -a Docker
  echo -n "    Waiting for Docker daemon"
  for i in $(seq 1 60); do
    if docker info &>/dev/null; then
      echo " ready."
      break
    fi
    printf "."
    sleep 2
    if [[ $i -eq 60 ]]; then
      echo ""
      echo "ERROR: Docker did not start in time. Launch Docker Desktop manually and retry."
      exit 1
    fi
  done
else
  echo "==> Docker is running."
fi

# ── Parse DATABASE_URL for Docker env vars ────────────────────────────────────
DB_URL="$(grep '^DATABASE_URL' "$DIR/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")"
DB_USER="$(echo "$DB_URL" | sed 's|.*://\([^:]*\):.*|\1|')"
DB_PASS="$(echo "$DB_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')"
DB_NAME="$(echo "$DB_URL" | sed 's|.*/\([^?]*\)$|\1|')"

# ── PostgreSQL via Docker ─────────────────────────────────────────────────────
echo "==> Starting PostgreSQL..."

if docker inspect "$CONTAINER" &>/dev/null; then
  if [[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" == "true" ]]; then
    echo "    Container already running — skipping."
  else
    echo "    Starting existing container..."
    docker start "$CONTAINER" > /dev/null
  fi
else
  echo "    Creating container (postgres:16-alpine)..."
  docker run -d \
    --name "$CONTAINER" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT:5432" \
    postgres:16-alpine > /dev/null
fi

# Wait for Postgres to accept connections (up to 30 s)
echo -n "    Waiting for database to be ready"
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -q 2>/dev/null; then
    echo " done."
    break
  fi
  printf "."
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo ""
    echo "ERROR: Database did not become ready in time."
    exit 1
  fi
done

# ── Prisma migrations ─────────────────────────────────────────────────────────
echo "==> Applying database migrations..."
cd "$DIR"
npx prisma migrate dev --skip-seed --schema="$DIR/prisma/schema.prisma"

# ── Next.js dev server ────────────────────────────────────────────────────────
echo "==> Starting Next.js dev server..."
npm run dev > "$LOG_FILE" 2>&1 &
NEXT_PID=$!
echo "$NEXT_PID" > "$PID_FILE"

# Wait briefly so startup errors surface before we exit
sleep 3
if ! kill -0 "$NEXT_PID" 2>/dev/null; then
  echo "ERROR: Next.js failed to start. Check $LOG_FILE for details."
  rm -f "$PID_FILE"
  exit 1
fi

# ── Cloudflare Tunnel ────────────────────────────────────────────────────────
echo "==> Starting Cloudflare tunnel..."
cloudflared tunnel run --token eyJhIjoiNzg2NzA0NjQ5OWVkZjA1MWE2NzRmMTQyZmQ0YjU3ZDEiLCJ0IjoiZjJkYTVlNjAtNmU2ZS00ZDE4LWE2NmYtZGIwZmNmYWQ2OWYyIiwicyI6Ik16Um1ZVEJrTnpjdE1qTmxaQzAwTUdKbExUazBOV0l0TVROaVpESXpObUkwWVdOaSJ9 > "$TUNNEL_LOG_FILE" 2>&1 &
TUNNEL_PID=$!
echo "$TUNNEL_PID" > "$TUNNEL_PID_FILE"

echo ""
echo "  TravelPlanner is running at http://localhost:3000"
echo ""
echo "  Logs:  tail -f $LOG_FILE"
echo "  Tunnel: tail -f $TUNNEL_LOG_FILE"
echo "  Stop:  ./stop.sh"
