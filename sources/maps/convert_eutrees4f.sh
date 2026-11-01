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
      case "$b" in *_disp*) srs="-a_srs EPSG:3035";; *) srs="";; esac   # see the note below
      if gdal_translate -q -of COG $srs -co COMPRESS=DEFLATE -co PREDICTOR=2 -co OVERVIEWS=IGNORE_EXISTING "$f" "$o" 2>>"$LOG"; then :; else echo "FAILED $f" >> "$LOG"; rm -f "$o"; fi
    done
    echo "$ens/$kind: $(ls "$OUT/$ens/$kind" | wc -l | tr -d ' ') files" >> "$LOG"
  done
done
# The published natural-dispersal ("disp", MigClim) binary rasters carry NO coordinate reference system (804 of
# 1 742 files, found 2026-11-01). They sit on the same 10 km INSPIRE EPSG:3035 grid as the "pot" ones, cropped:
# 389 × 400 cells from origin (2 640 000, 5 420 000) instead of 400 × 410 from (2 600 000, 5 500 000), i.e. offsets of
# whole cells (verified). The CRS is assigned at conversion (-a_srs above; a COG cannot be edited afterwards) — a
# documented change under the CC0 source.
echo "end $(date -u +%FT%TZ)" >> "$LOG"
