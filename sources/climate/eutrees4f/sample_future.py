"""EU-Trees4F FUTURE predictors (ensemble mean of the 11 EURO-CORDEX RCMs, change-factor downscaled onto the
WorldClim 1.4 baseline) sampled at every input point, for 3 periods x 2 scenarios.

Rasters: datasets/climate/future/ensemble/<var>_ensemble_mean_<rcp45|rcp85>_<1991-2020|2021-2050|2051-2080>.tif,
var in bio1, bio12, bio15, ci, ps, pw, ts — same 5' cell edges as the historical grid, cropped by one column and
one row, so row/col are computed per raster. Same storage conventions as the historical layers (temperatures
x10, seasonal precipitation as three-month totals): the loader applies the same scaling.

Output: {"key", "values": {"<period>": {"<rcp>": {bio01, bio12, bio15, continentality, pr_summer, pr_winter, tas_summer}}}}
Usage: .venv/bin/python sources/climate/eutrees4f/sample_future.py [--in work/occurrences.jsonl] [--out work/climate-eutrees4f-future.jsonl]
"""
import argparse, json, sys, time
import numpy as np
import rasterio

DIR = '/Users/milko/Local/Development/Workshop/EU-Trees4F/Reproducibility_scripts/datasets/climate/future/ensemble'
VARS = {'bio1': 'bio01', 'bio12': 'bio12', 'bio15': 'bio15', 'ci': 'continentality', 'ps': 'pr_summer', 'pw': 'pr_winter', 'ts': 'tas_summer'}
PERIODS = ['1991-2020', '2021-2050', '2051-2080']
SCENARIOS = ['rcp45', 'rcp85']

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='inp', default='work/occurrences.jsonl')
    ap.add_argument('--out', default='work/climate-eutrees4f-future.jsonl')
    a = ap.parse_args()
    t0 = time.time()
    pts = [json.loads(l) for l in open(a.inp)]
    lons = np.array([d['lon'] for d in pts]); lats = np.array([d['lat'] for d in pts])
    out = [{'key': d['key'], 'values': {}} for d in pts]
    stats = {}
    for period in PERIODS:
        for rcp in SCENARIOS:
            for var, ind in VARS.items():
                with rasterio.open(f'{DIR}/{var}_ensemble_mean_{rcp}_{period}.tif') as ds:
                    rows, cols = rasterio.transform.rowcol(ds.transform, lons, lats)
                    rows = np.asarray(rows); cols = np.asarray(cols)
                    inside = (rows >= 0) & (rows < ds.height) & (cols >= 0) & (cols < ds.width)
                    arr = ds.read(1).astype('float64'); arr[arr == ds.nodata] = np.nan
                    vals = np.full(len(pts), np.nan); vals[inside] = arr[rows[inside], cols[inside]]
                for i, v in enumerate(vals):
                    if np.isnan(v): continue
                    out[i]['values'].setdefault(period, {}).setdefault(rcp, {})[ind] = float(round(v, 4))
                good = vals[~np.isnan(vals)]
                stats[(period, rcp, ind)] = (len(good), good.mean() if len(good) else float('nan'))
    with open(a.out, 'w') as f:
        for o in out: f.write(json.dumps(o) + '\n')
    for (p, r, ind), (n, m) in stats.items():
        if ind in ('bio01', 'pr_summer'): print(f'{p} {r} {ind:14s} n={n:7d} mean={m:9.2f}', file=sys.stderr)
    empty = sum(1 for o in out if not o['values'])
    print(f'written {a.out}: {len(out)} points, {empty} without any value, {time.time()-t0:.1f}s', file=sys.stderr)

if __name__ == '__main__':
    main()
