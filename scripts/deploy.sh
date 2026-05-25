#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-mokultur-web}"
SKIP_PULL="${SKIP_PULL:-0}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

cd "$APP_DIR"

log "Working directory: $APP_DIR"

if [[ "$SKIP_PULL" != "1" ]]; then
  log "Pulling latest changes"
  git pull --ff-only
fi

log "Installing dependencies"
npm ci

log "Building SvelteKit app"
npm run build

log "Restarting systemd service: $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

log "Service status"
sudo systemctl --no-pager --full status "$SERVICE_NAME"

log "Done"
