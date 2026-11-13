#!/bin/sh
# Publishes the panes on a server: the pages and the map files (rsync over ssh; repeatable, sends changes only, resumes
# a broken transfer). The small files go first, so the site works while the 2 GB of Atlas rasters arrive.
# The server's own files (web server, users, data import) are in the server's repository (../skofic.io).
#   deploy/publish.sh user@server:/path/to/deploy            e.g. root@62.83.125.116:/opt/panes
#   deploy/publish.sh user@server:/path/to/deploy pages      the pages only
set -eu
[ $# -ge 1 ] || { echo "usage: $0 user@server:/path/to/deploy [pages]"; exit 1; }
cd "$(dirname "$0")/.."
rsync -a --delete --exclude 'serve.mjs' examples "$1/site/"
[ "${2:-}" = pages ] && exit 0
for part in maps/basemap maps/chorology/geojson maps/eutrees4f maps/atlas; do rsync -a --partial -R "$part" "$1/site/"; done
