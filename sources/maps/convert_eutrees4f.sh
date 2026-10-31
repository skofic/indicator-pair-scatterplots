#!/bin/sh
# Step 7 of the collection plan, part 2: EU-Trees4F suitability rasters → Cloud-Optimised GeoTIFF under
# maps/eutrees4f/<ens_sdms|ens_clim>/<prob|bin>/, same file names (CC0, Mauri et al. 2022). Idempotent: skips
# outputs that exist. Writes maps/eutrees4f/convert.log.   Usage: sh sources/maps/convert_eutrees4f.sh [ens_sdms] [ens_clim]
SRC="/Users/milko/Local/Development/Workshop/EU-Trees4F/EU-Trees4F_dataset"
OUT="maps/eutrees4f"
LOG="$OUT/convert.log"
mkdir -p "$OUT"; echo "start $(date -u +%FT%TZ)" >> "$LOG"
for ens in ${@:-ens_sdms ens_clim}; do
  for kind in prob bin; do
    mkdir -p "$OUT/$ens/$kind"
    for f in "$SRC/$ens/$kind"/*.tif; do
      b="$(basename "$f")"; o="$OUT/$ens/$kind/$b"
      [ -f "$o" ] && continue
      if gdal_translate -q -of COG -co COMPRESS=DEFLATE -co PREDICTOR=2 -co OVERVIEWS=IGNORE_EXISTING "$f" "$o" 2>>"$LOG"; then :; else echo "FAILED $f" >> "$LOG"; rm -f "$o"; fi
    done
    echo "$ens/$kind: $(ls "$OUT/$ens/$kind" | wc -l | tr -d ' ') files" >> "$LOG"
  done
done
echo "end $(date -u +%FT%TZ)" >> "$LOG"
