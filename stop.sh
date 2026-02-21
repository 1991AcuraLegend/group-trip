#!/usr/bin/env bash
# stop.sh — Stop all TravelPlanner services

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$DIR/.pids"
CONTAINER="travelplanner-db"

# ── Next.js dev server ────────────────────────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
  NEXT_PID="$(cat "$PID_FILE")"
  if kill -0 "$NEXT_PID" 2>/dev/null; then
    echo "==> Stopping Next.js (PID $NEXT_PID)..."
    kill "$NEXT_PID"
    # Wait up to 5 s for it to exit cleanly
    for i in $(seq 1 5); do
      kill -0 "$NEXT_PID" 2>/dev/null || break
      sleep 1
    done
    # Force-kill if still alive
    kill -0 "$NEXT_PID" 2>/dev/null && kill -9 "$NEXT_PID" 2>/dev/null || true
  else
    echo "==> Next.js process not found (may have already exited)."
  fi
  rm -f "$PID_FILE"
else
  # Fallback: kill any next dev process for this project
  pkill -f "next-server" 2>/dev/null && echo "==> Stopped Next.js." || echo "==> Next.js not running."
fi

# ── PostgreSQL container ──────────────────────────────────────────────────────
if docker inspect "$CONTAINER" &>/dev/null; then
  if [[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" == "true" ]]; then
    echo "==> Stopping PostgreSQL container..."
    docker stop "$CONTAINER" > /dev/null
    echo "    Stopped. (Data is preserved — restart with ./start.sh)"
  else
    echo "==> PostgreSQL container already stopped."
  fi
else
  echo "==> PostgreSQL container not found."
fi

# ── Docker Desktop ────────────────────────────────────────────────────────────
if docker info &>/dev/null; then
  echo "==> Stopping Docker Desktop..."
  osascript -e 'quit app "Docker"' 2>/dev/null || true
fi

echo ""
echo "  TravelPlanner stopped."
