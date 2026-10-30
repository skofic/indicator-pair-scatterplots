"""Step 3 of the collection plan: sample the EU-Trees4F historical predictor rasters at every occurrence cell.

Reads work/occurrences.jsonl (lon/lat), reads each 5' raster into memory (1128 x 540), takes the value of the
containing pixel, and writes work/climate-eutrees4f.jsonl: {"key": <occurrence key>, "cell": [row, col],
"values": {<indicator>: value|null}}. Values are returned in the raster's physical units after applying the
file's scale/offset if declared; the per-raster statistics printed at the end are the check that the units
are what we think (temperatures in degC, precipitation in mm/month, continentality in degC).

Usage: .venv/bin/python sources/climate/eutrees4f/sample.py [--in work/occurrences.jsonl] [--out work/climate-eutrees4f.jsonl]
"""
import argparse, json, sys, time
import numpy as np
import rasterio

DIR = '/Users/milko/Local/Development/Workshop/EU-Trees4F/Reproducibility_scripts/datasets/climate/historical'
RASTERS = {'bio1.tif': 'bio01', 'bio12.tif': 'bio12', 'bio15.tif': 'bio15', 'temp10_summer.tif': 'tas_summer',
           'prec_summer.tif': 'pr_summer', 'prec_winter.tif': 'pr_winter', 'continentality.tif': 'continentality'}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='inp', default='work/occurrences.jsonl')
    ap.add_argument('--out', default='work/climate-eutrees4f.jsonl')
    a = ap.parse_args()
    t0 = time.time()
    occ = [json.loads(l) for l in open(a.inp)]
    lons = np.array([d['lon'] for d in occ]); lats = np.array([d['lat'] for d in occ])

    layers = {}
    base = None
    for fn, ind in RASTERS.items():
        with rasterio.open(f'{DIR}/{fn}') as ds:
            if base is None:
                base = (ds.transform, ds.width, ds.height, ds.crs)
                rows, cols = rasterio.transform.rowcol(ds.transform, lons, lats)
                rows = np.asarray(rows); cols = np.asarray(cols)
            else:
                assert ds.width == base[1] and ds.height == base[2] and ds.transform.almost_equals(base[0]), fn
            arr = ds.read(1).astype('float64')
            nod = ds.nodata
            scale, offset = (ds.scales[0] if ds.scales else 1.0), (ds.offsets[0] if ds.offsets else 0.0)
            print(f'{fn:22s} dtype {ds.dtypes[0]:8s} nodata {nod!s:10s} scale {scale} offset {offset} '
                  f'min {np.nanmin(np.where(arr == nod, np.nan, arr)):.3f} max {np.nanmax(np.where(arr == nod, np.nan, arr)):.3f}', file=sys.stderr)
            if nod is not None:
                arr = np.where(arr == nod, np.nan, arr)
            layers[ind] = arr * scale + offset
    print(f'grid {base[1]}x{base[2]} {base[3]} transform {tuple(round(v, 6) for v in base[0][:6])}', file=sys.stderr)

    inside = (rows >= 0) & (rows < base[2]) & (cols >= 0) & (cols < base[1])
    stats = {ind: [] for ind in layers}
    n_nodata = 0
    with open(a.out, 'w') as out:
        for i, d in enumerate(occ):
            vals = {}
            if inside[i]:
                for ind, arr in layers.items():
                    v = arr[rows[i], cols[i]]
                    vals[ind] = None if np.isnan(v) else float(round(v, 4))
                    if vals[ind] is not None: stats[ind].append(vals[ind])
            else:
                vals = {ind: None for ind in layers}
            if all(v is None for v in vals.values()): n_nodata += 1
            out.write(json.dumps({'key': d['key'], 'cell': [int(rows[i]), int(cols[i])] if inside[i] else None, 'values': vals}) + '\n')
    for ind, v in stats.items():
        v = np.array(v); print(f'{ind:16s} n {len(v):7d} min {v.min():9.3f} mean {v.mean():9.3f} max {v.max():9.3f}', file=sys.stderr)
    print(f'written {a.out}: {len(occ):,} cells, {n_nodata:,} with no data, {time.time()-t0:.1f}s', file=sys.stderr)

if __name__ == '__main__':
    main()
