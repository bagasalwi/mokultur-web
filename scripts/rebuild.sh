#!/usr/bin/env bash
set -euo pipefail

cd /var/www/mokultur-web

echo "[rebuild] $(date -Is) — start"
echo "[rebuild] npm run build…"
npm run build

echo "[rebuild] systemctl restart mokultur-web…"
/bin/systemctl restart mokultur-web

echo "[rebuild] $(date -Is) — done"
