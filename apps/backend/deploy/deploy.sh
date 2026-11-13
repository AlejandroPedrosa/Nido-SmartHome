#!/usr/bin/env bash
# ============================================================
# NIDO SmartHome — Despliegue de la API en el servidor (EC2)
#
# Trae la última versión de la rama de producción, reconstruye el
# contenedor y espera a que el healthcheck lo marque "healthy".
# Lo ejecuta el workflow backend-deploy por SSH; también se puede
# correr a mano en el servidor:
#   ~/Nido-SmartHome/apps/backend/deploy/deploy.sh
#
# Variables opcionales:
#   DEPLOY_BRANCH   rama a desplegar (default: main)
#   HEALTH_TIMEOUT  segundos máximos de espera (default: 90)
# ============================================================
set -euo pipefail

# Todo vive dentro de main(): bash lee el script completo antes de
# ejecutarlo, así el `git pull` puede actualizar este mismo archivo
# sin afectar la ejecución en curso.
main() {
  local branch="${DEPLOY_BRANCH:-main}"
  local timeout="${HEALTH_TIMEOUT:-90}"
  local backend_dir repo_dir container_id status elapsed

  backend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  repo_dir="$(git -C "$backend_dir" rev-parse --show-toplevel)"

  log "Actualizando $repo_dir a origin/$branch"
  git -C "$repo_dir" fetch --prune origin "$branch"
  git -C "$repo_dir" checkout "$branch"
  git -C "$repo_dir" pull --ff-only origin "$branch"
  log "Versión: $(git -C "$repo_dir" log -1 --format='%h %s')"

  cd "$backend_dir"
  log "Construyendo y levantando el contenedor"
  docker compose up -d --build

  container_id="$(docker compose ps -q api)"
  if [ -z "$container_id" ]; then
    log "No se encontró el contenedor de la API"
    exit 1
  fi

  log "Esperando a que la API quede healthy (máx. ${timeout}s)"
  elapsed=0
  while true; do
    status="$(docker inspect --format '{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo unknown)"
    if [ "$status" = "healthy" ]; then
      break
    fi
    if [ "$elapsed" -ge "$timeout" ]; then
      log "La API no quedó healthy (estado: $status). Últimos logs:"
      docker compose logs --tail 50 api
      exit 1
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done

  log "API healthy"
  docker image prune -f >/dev/null
  log "Deploy terminado"
}

log() {
  printf '[deploy] %s\n' "$*"
}

main "$@"
