// EU-Trees4F Figure 1 classification for the display examples: every occurrence cell (global order of pair.js)
// classified per species from the published binary suitability rasters, current vs future:
//   0 = unsuitable in both (or outside the rasters), 1 = stable (suitable now and later), 2 = decolonised (now, not later), 3 = newly suitable
// File: work/examples/data/suitability-<species>.json  { "<period>|<rcp>|<variant>": "<one digit per cell>" }
// Period pairing (paper, Methods): each future map is driven by the climate of the previous 30 years, as the current map
// (cur2005) is by 1961-1990 — fut2035 ← 1991-2020, fut2065 ← 2021-2050, fut2095 ← 2051-2080 (the R scripts' fut1..3).
// Usage: node sources/export/suitability.js ["Fagus sylvatica" ...]   (after pair.js, which writes cells.json)
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { explain } from '../../lib/db.js'

const species = (process.argv.slice(2).length ? process.argv.slice(2) : ['Fagus sylvatica', 'Quercus ilex', 'Picea abies'])
try {
  const cells = JSON.parse(readFileSync('work/examples/data/cells.json', 'utf8'))
  console.log(`${cells.length} cells (global order of cells.json)`)
  for (const sp of species) {
    const out = execFileSync('.venv/bin/python', ['-I', '-c', `
import json, sys, numpy as np, rasterio, rasterio.warp
pts = json.load(open('work/examples/data/cells.json')); lons = np.array([p[0] for p in pts]); lats = np.array([p[1] for p in pts])
D = 'maps/eutrees4f/ens_sdms/bin/'; sp = '${sp.replace(' ', '_')}'
def sample(f):
    with rasterio.open(D + f) as ds:
        r, c = rasterio.transform.rowcol(ds.transform, *rasterio.warp.transform('EPSG:4326', ds.crs, lons, lats))
        r = np.asarray(r); c = np.asarray(c); ok = (r >= 0) & (r < ds.height) & (c >= 0) & (c < ds.width)
        a = np.clip(np.nan_to_num(ds.read(1).astype('float64'), nan=0), -1, 1); v = np.zeros(len(pts), dtype=np.int16); v[ok] = a[r[ok], c[ok]]; v[v < 0] = 0
        return v
cur = sample(f'{sp}_ens-sdms_cur2005_bin_pot.tif')
out = {}
for period in ('fut2035', 'fut2065', 'fut2095'):
    for rcp in ('rcp45', 'rcp85'):
        for variant in ('pot', 'disp'):
            fut = sample(f'{sp}_ens-sdms_{rcp}_{period}_bin_{variant}.tif')
            cls = np.where((cur == 1) & (fut == 1), 1, np.where((cur == 1) & (fut == 0), 2, np.where((cur == 0) & (fut == 1), 3, 0)))
            out[f'{period}|{rcp}|{variant}'] = ''.join(map(str, cls.tolist()))
json.dump(out, open('work/examples/data/suitability-${sp.replace(' ', '_')}.json', 'w'))
c = out['fut2095|rcp85|pot']; print('${sp}: current suitable', int((cur == 1).sum()), '| 2095 RCP 8.5 pot: stable', c.count('1'), 'decolonised', c.count('2'), 'new', c.count('3'))
`], { encoding: 'utf8' })
    process.stdout.write(out)
  }
} catch (e) { console.error(explain(e)); process.exit(1) }
