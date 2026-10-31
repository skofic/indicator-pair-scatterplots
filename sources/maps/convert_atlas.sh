#!/bin/sh
# Step 7, part 4: unzip the Atlas RPP / MHS archives and convert their GeoTIFFs to Cloud-Optimised GeoTIFF under
# maps/atlas/<rpp|mhs>/tif/<Genus-species>_<rpp|mhs>.tif. Idempotent. Run after download_atlas.sh completes.
# Usage: sh sources/maps/convert_atlas.sh
OUT="maps/atlas"; LOG="$OUT/convert.log"; echo "start $(date -u +%FT%TZ)" >> "$LOG"
for kind in rpp mhs; do
  mkdir -p "$OUT/$kind/tif" "$OUT/$kind/raw"
  for z in "$OUT/$kind"/*.zip; do
    [ -f "$z" ] || continue
    name="$(basename "$z" .zip)"; o="$OUT/$kind/tif/$name.tif"
    [ -f "$o" ] && continue
    d="$OUT/$kind/raw/$name"; mkdir -p "$d"
    unzip -q -o "$z" -d "$d" 2>>"$LOG" || { echo "UNZIP FAILED $z" >> "$LOG"; continue; }
    src="$(find "$d" -iname '*.tif' | head -1)"
    [ -n "$src" ] || { echo "NO TIF in $z: $(find "$d" -type f | head -3 | tr '\n' ' ')" >> "$LOG"; continue; }
    gdal_translate -q -of COG -co COMPRESS=DEFLATE -co PREDICTOR=2 "$src" "$o" 2>>"$LOG" || { echo "COG FAILED $src" >> "$LOG"; rm -f "$o"; }
  done
  echo "$kind: $(ls "$OUT/$kind/tif" 2>/dev/null | wc -l | tr -d ' ') COG files" >> "$LOG"
done
echo "end $(date -u +%FT%TZ)" >> "$LOG"
