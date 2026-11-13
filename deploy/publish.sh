#!/bin/sh
# Copies the server files, the pages and the map files to the server (rsync over ssh; repeatable, sends changes only,
# resumes a broken transfer). The small files go first, so the site works while the 2 GB of Atlas rasters arrive.
#   deploy/publish.sh user@server:/path/to/deploy
set -eu
[ $# -eq 1 ] || { echo "usage: $0 user@server:/path/to/deploy"; exit 1; }
cd "$(dirname "$0")/.."
rsync -a deploy/docker-compose.yml deploy/Caddyfile deploy/.env.example "$1/"
rsync -a --delete --exclude 'serve.mjs' examples "$1/site/"
for part in maps/basemap maps/chorology/geojson maps/eutrees4f maps/atlas; do rsync -a --partial -R "$part" "$1/site/"; done
