#!/bin/sh
# Step 7 of the collection plan, part 1: download the Atlas RPP and MHS rasters (one zip per taxon).
# Resumable (curl -C -), skips files already complete, writes maps/atlas/download.log and a sha256 list.
# Usage: sh sources/maps/download_atlas.sh
BASE="https://ies-ows.jrc.ec.europa.eu/efdac/download/Atlas"
OUT="maps/atlas"
LOG="$OUT/download.log"
mkdir -p "$OUT/rpp" "$OUT/mhs"
echo "start $(date -u +%FT%TZ)" >> "$LOG"
for kind in rpp mhs; do
  list="data/atlas-${kind}-taxa.txt"
  while IFS= read -r taxon || [ -n "$taxon" ]; do
    [ -z "$taxon" ] && continue
    name="$(printf '%s' "$taxon" | sed 's/ /-/')"
    f="$OUT/$kind/${name}_${kind}.zip"
    if [ -f "$f" ] && unzip -tq "$f" >/dev/null 2>&1; then
      echo "ok      $f" >> "$LOG"; continue
    fi
    if curl -sS -L -C - --retry 5 --retry-delay 10 -o "$f" "$BASE/${name}_${kind}.zip"; then
      if unzip -tq "$f" >/dev/null 2>&1; then echo "fetched $f $(stat -f%z "$f")" >> "$LOG"; else echo "BAD     $f" >> "$LOG"; fi
    else
      echo "FAILED  $f" >> "$LOG"
    fi
  done < "$list"
done
( cd "$OUT" && find rpp mhs -name '*.zip' -exec shasum -a 256 {} \; | sort -k2 > sha256.txt )
echo "end $(date -u +%FT%TZ): $(grep -c '^ok\|^fetched' "$LOG") good, $(grep -c '^BAD\|^FAILED' "$LOG") bad" >> "$LOG"
