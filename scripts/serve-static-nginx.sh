#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
CONF_FILE="$ROOT_DIR/local-nginx/default.conf"
CONTAINER_NAME="${NGINX_CONTAINER_NAME:-portfolio_static_nginx}"
PORT="${PORT:-8080}"
IMAGE="${NGINX_IMAGE:-nginx:1.27-alpine}"
REBUILD="${REBUILD:-0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker est requis pour lancer le serveur Nginx local." >&2
  exit 1
fi

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Impossible de trouver frontend/package.json." >&2
  exit 1
fi

if [ "$REBUILD" = "1" ] || [ ! -f "$DIST_DIR/index.html" ]; then
  echo "Build du frontend..."
  (
    cd "$FRONTEND_DIR"
    npm run build
  )
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "Le build frontend/dist est introuvable." >&2
  exit 1
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:80" \
  -v "$DIST_DIR:/usr/share/nginx/html:ro" \
  -v "$CONF_FILE:/etc/nginx/conf.d/default.conf:ro" \
  "$IMAGE" >/dev/null

echo "Nginx local demarre sur http://127.0.0.1:${PORT}"
echo "Container: ${CONTAINER_NAME}"
echo "Stop: $ROOT_DIR/scripts/stop-static-nginx.sh"
