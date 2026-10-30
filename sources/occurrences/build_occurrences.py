"""Step 2 of the collection plan: the ScatterOccurrences skeleton from the EU-Forest species CSV.

Reads EU-Forest (X, Y in ETRS89-LAEA EPSG:3035, 1 km INSPIRE cell centroids; one row per cell × species),
aggregates by cell, reprojects the centroid to WGS84, checks it against the shared FORGENIUS land mask and
writes one JSONL line per cell:

  {"key": <md5 of "X,Y">, "x": X, "y": Y, "lon": .., "lat": .., "species": [..], "sources": {"NFI":n,"FF":n,"BS":n},
   "in_mask": true|false}

Usage: .venv/bin/python sources/occurrences/build_occurrences.py [--csv PATH] [--mask PATH] [--out work/occurrences.jsonl]
"""
import argparse, csv, hashlib, json, sys, time
from collections import defaultdict

from pyproj import Transformer
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

DEFAULT_CSV = '/Users/milko/Local/Backup/ArangoDB/data/EU-Forest_species.csv'
DEFAULT_MASK = '/Users/milko/Local/Development/Git/Projects/Metadata/metadata-external-databases/data/forgenius-land-mask.geojson'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', default=DEFAULT_CSV)
    ap.add_argument('--mask', default=DEFAULT_MASK)
    ap.add_argument('--out', default='work/occurrences.jsonl')
    a = ap.parse_args()
    t0 = time.time()

    cells = {}
    rows = 0
    with open(a.csv, newline='') as f:
        for row in csv.DictReader(f):
            rows += 1
            x, y = int(row['X']), int(row['Y'])
            c = cells.get((x, y))
            if c is None:
                c = cells[(x, y)] = {'species': set(), 'sources': defaultdict(int)}
            c['species'].add(row['SPECIES NAME'])
            for s in ('NFI', 'FF', 'BS'):
                if row[s] == '1':
                    c['sources'][s] += 1
    print(f'rows {rows:,}  cells {len(cells):,}  species {len({s for c in cells.values() for s in c["species"]})}', file=sys.stderr)

    tr = Transformer.from_crs('EPSG:3035', 'EPSG:4326', always_xy=True)
    xs = [k[0] for k in cells]; ys = [k[1] for k in cells]
    lons, lats = tr.transform(xs, ys)

    with open(a.mask) as f:
        g = json.load(f)
    feats = g['features'] if g.get('type') == 'FeatureCollection' else [g]
    polys = [shape(ft['geometry']) for ft in feats]
    tree = STRtree(polys)
    pts = [Point(lo, la) for lo, la in zip(lons, lats)]
    inside = [False] * len(pts)
    for i, p in enumerate(pts):
        for j in tree.query(p):
            if polys[j].covers(p):
                inside[i] = True
                break

    n_out = 0
    with open(a.out, 'w') as out:
        for (xy, c), lo, la, ok in zip(cells.items(), lons, lats, inside):
            x, y = xy
            if not ok:
                n_out += 1
            out.write(json.dumps({
                'key': hashlib.md5(f'{x},{y}'.encode()).hexdigest(),
                'x': x, 'y': y, 'lon': round(lo, 7), 'lat': round(la, 7),
                'species': sorted(c['species']), 'sources': dict(c['sources']), 'in_mask': ok,
            }) + '\n')
    print(f'written {a.out}: {len(cells):,} cells, {n_out:,} outside the land mask, '
          f'lon {min(lons):.3f}..{max(lons):.3f} lat {min(lats):.3f}..{max(lats):.3f}, {time.time()-t0:.1f}s', file=sys.stderr)

if __name__ == '__main__':
    main()
