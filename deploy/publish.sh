#!/bin/sh
# Copies the pages and the map files to the server's site directory (rsync over ssh; repeatable, sends changes only).
#   deploy/publish.sh user@server:/path/to/deploy
set -eu
[ $# -eq 1 ] || { echo "usage: $0 user@server:/path/to/deploy"; exit 1; }
cd "$(dirname "$0")/.."
rsync -av --delete --exclude 'serve.mjs' examples "$1/site/"
rsync -av --delete maps "$1/site/"
rsync -av deploy/docker-compose.yml deploy/Caddyfile deploy/.env.example "$1/"
