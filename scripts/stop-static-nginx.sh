#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${NGINX_CONTAINER_NAME:-portfolio_static_nginx}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker est requis pour stopper le serveur Nginx local." >&2
  exit 1
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
echo "Nginx local stoppe (${CONTAINER_NAME})."
