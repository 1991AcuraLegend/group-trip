#!/usr/bin/env bash
# docker-push.sh — Build and push TravelPlanner image to GitHub Container Registry

set -euo pipefail

# Configuration
GHCR_USERNAME="1991AcuraLegend"
REPO_NAME="group-trip"
IMAGE_TAG="latest"
IMAGE_NAME="ghcr.io/${GHCR_USERNAME}/${REPO_NAME}:${IMAGE_TAG}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🐳 Building and pushing Docker image to GitHub Container Registry"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Image: ${IMAGE_NAME}"
echo ""

# ── Verify Docker is running ───────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker is not running."
  exit 1
fi

# ── Build the image ────────────────────────────────────────────────────────────
echo "📦 Building Docker image..."
cd "$DIR"
docker build -t "${IMAGE_NAME}" .

if [[ $? -ne 0 ]]; then
  echo "❌ Build failed."
  exit 1
fi

echo "✅ Build complete."
echo ""

# ── Push to GitHub Container Registry ──────────────────────────────────────────
echo "🚀 Pushing to GitHub Container Registry..."
docker push "${IMAGE_NAME}"

if [[ $? -ne 0 ]]; then
  echo "❌ Push failed."
  echo ""
  echo "💡 Make sure you're authenticated with:"
  echo "   echo \$GITHUB_TOKEN | docker login ghcr.io -u ${GHCR_USERNAME} --password-stdin"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Successfully pushed image to GHCR!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Image: ${IMAGE_NAME}"
echo ""
echo "  To pull this image on another machine:"
echo "  docker pull ${IMAGE_NAME}"
echo ""
