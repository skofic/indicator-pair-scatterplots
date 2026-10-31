#!/bin/sh
# Natural Earth (public domain) country boundaries at 1:50 m, as GeoJSON, for the boundaries-only base map.
# Usage: sh sources/maps/download_basemap.sh
mkdir -p maps/basemap
f=maps/basemap/ne_50m_admin_0_countries.geojson
[ -f "$f" ] || curl -sS -L -o "$f" "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
# drop the legacy crs member: OpenLayers leaves features untransformed when a GeoJSON carries one (RFC 7946 has none)
python3 -I -c "
import json; g=json.load(open('$f')); g.pop('crs', None); json.dump(g, open('$f', 'w'), separators=(',', ':'))
print('$f:', len(g['features']), 'countries,', round(__import__('os').path.getsize('$f')/1048576,1), 'MB, crs member removed')"
