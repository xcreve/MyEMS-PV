#!/usr/bin/env bash
set -euo pipefail

# 用法：./scripts/blue_green_switch.sh <blue|green> [--dry-run]
# 依赖：docker compose v2, curl

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLOR="${1:-}"
DRY_RUN="${2:-}"

usage() {
  echo "Usage: $0 <blue|green> [--dry-run]" >&2
}

if [[ "$COLOR" != "blue" && "$COLOR" != "green" ]]; then
  usage
  exit 2
fi

if [[ -n "$DRY_RUN" && "$DRY_RUN" != "--dry-run" ]]; then
  usage
  exit 2
fi

if [[ "$COLOR" == "blue" ]]; then
  BACKEND_PORT=8081
  FRONTEND_PORT=8180
  OLD_COLOR=green
else
  BACKEND_PORT=8082
  FRONTEND_PORT=8280
  OLD_COLOR=blue
fi

COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.$COLOR.yml"
BASE_COMPOSE="$ROOT_DIR/docker/docker-compose.yml"
COMPOSE_CMD=(docker compose -f "$BASE_COMPOSE" -f "$COMPOSE_FILE")

run_cmd() {
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

wait_for_health() {
  local port="$1"
  local timeout="$2"
  local deadline=$((SECONDS + timeout))
  while (( SECONDS < deadline )); do
    if curl -fsS "http://localhost:${port}/actuator/health" | grep -q '"status"[[:space:]]*:[[:space:]]*"UP"'; then
      return 0
    fi
    sleep 5
  done
  echo "ERROR: backend health check timed out on port ${port}" >&2
  return 1
}

wait_for_frontend() {
  local port="$1"
  local timeout="$2"
  local deadline=$((SECONDS + timeout))
  local code
  while (( SECONDS < deadline )); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost:${port}/" || true)"
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 3
  done
  echo "ERROR: frontend check timed out on port ${port}" >&2
  return 1
}

echo "Starting $COLOR stack on backend :$BACKEND_PORT and frontend :$FRONTEND_PORT"
run_cmd "${COMPOSE_CMD[@]}" up -d --build --no-deps ruoyi-admin ruoyi-vue3

if [[ "$DRY_RUN" != "--dry-run" ]]; then
  wait_for_health "$BACKEND_PORT" 120
  wait_for_frontend "$FRONTEND_PORT" 60
fi

echo "$COLOR stack is ready."
echo "Update the upstream load balancer, DNS, or nginx upstream manually to:"
echo "  backend  -> http://localhost:${BACKEND_PORT}"
echo "  frontend -> http://localhost:${FRONTEND_PORT}"
echo
echo "After traffic has drained from $OLD_COLOR, stop the old stack manually if appropriate:"
echo "  docker compose -f docker/docker-compose.yml -f docker/docker-compose.${OLD_COLOR}.yml stop ruoyi-vue3 ruoyi-admin"
