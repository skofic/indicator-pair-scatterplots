#!/bin/sh
# Imports the slim export ON the server: the compressed files travel once (about 215 MB), the import then runs
# next to the database in a throw-away Node container (38 s on the showcase host). Through an ssh tunnel the
# same documents travel uncompressed (over 1 GB): hours on a domestic upload line.
#   node deploy/slim.mjs export  &&  deploy/import-on-server.sh user@server /opt/panes
set -eu
[ $# -eq 2 ] || { echo "usage: $0 user@server /path/to/deploy"; exit 1; }
cd "$(dirname "$0")"
rsync -a --partial slim.mjs slim.config.json out "$1:$2/import/"
ssh "$1" "cd $2 && export TARGET_PASSWORD=\$(grep ARANGO_ROOT_PASSWORD .env | cut -d= -f2) && \
  docker run --rm --network host -e TARGET_URL=http://127.0.0.1:8529 -e TARGET_PASSWORD -v $2/import:/w -w /w node:22-alpine node slim.mjs import /w/out && \
  rm -rf $2/import"
