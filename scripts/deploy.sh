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

# Every build rotates the hashed asset filenames, but nginx keeps serving the
# HTML it cached from the previous build — HTML that still points at CSS and JS
# files this build just deleted. Visitors then get either the old styling or,
# once nginx drops the stale asset too, an unstyled page. There is no purge
# module available, so the zone is emptied outright.
NGINX_CACHE_DIR="${NGINX_CACHE_DIR:-/var/cache/nginx/sveltekit}"
if [[ -d "$NGINX_CACHE_DIR" ]]; then
  log "Clearing nginx proxy cache: $NGINX_CACHE_DIR"
  sudo find "$NGINX_CACHE_DIR" -mindepth 1 -delete
  sudo nginx -s reload
fi

log "Service status"
sudo systemctl --no-pager --full status "$SERVICE_NAME"

log "Done"
