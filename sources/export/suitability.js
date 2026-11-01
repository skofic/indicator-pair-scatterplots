// EU-Trees4F Figure 1 classification for the display examples: every base cell (EU-Forest cell with EU-Trees4F
// climate) classified per species from the published binary suitability rasters, current vs future:
//   0 = unsuitable in both, 1 = stable (suitable now and later), 2 = decolonised (now, not later), 3 = newly suitable
// Files: work/examples/data/base-eutrees4f-cells.json  [[key, lon, lat], ...] in the order of base-eutrees4f-*.json
//        work/examples/data/suitability-<species>.json  { "<period>|<rcp>|<variant>": "<one digit per cell>" }
//        work/examples/data/aligned-eutrees4f-<period>-<rcp>.json  [[x, y] | null, ...] future pair values in the cell order
// Period pairing (paper, Methods): each future map is driven by the climate of the previous 30 years, as the current map
// (cur2005) is by 1961-1990 — fut2035 ← 1991-2020, fut2065 ← 2021-2050, fut2095 ← 2051-2080 (the R scripts' fut1..3).
// The cell order is the order of the AQL scan with the same filter as the base export; verified here by
// re-running that export's query and comparing the first values.   Usage: node sources/export/suitability.js
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { GID, PAIRS } from '../../config/indicators.js'

const species = (process.argv.slice(2).length ? process.argv.slice(2) : ['Fagus sylvatica', 'Quercus ilex', 'Picea abies'])
const X = GID[PAIRS.P1.x], Y = GID[PAIRS.P1.y]
try {
  const { db, collections: C } = connect(loadCredentials())
  const p = 'd.properties.eutrees4f["1961-1990"]'
  const cells = await db.query(`FOR d IN @@c LET p = ${p} FILTER p.${X} != null AND p.${Y} != null RETURN [d._key, d.geometry_point.coordinates[0], d.geometry_point.coordinates[1], p.${X}, p.${Y}]`, { '@c': C.occurrences }, { batchSize: 10000 }).then((c) => c.all())
  const base = JSON.parse(readFileSync('work/examples/data/base-eutrees4f-1961-1990.json', 'utf8'))
  if (base.length !== cells.length || base.some((v, i) => v[0] !== cells[i][3] || v[1] !== cells[i][4])) throw new Error('cell order differs from base-eutrees4f-1961-1990.json: re-run sources/export/pair.js first')
  writeFileSync('work/examples/data/base-eutrees4f-cells.json', JSON.stringify(cells.map((c) => [c[0], c[1], c[2]])))
  console.log(`${cells.length} base cells, order verified against the base export`)
  writeFileSync('work/suitability-points.json', JSON.stringify(cells.map((c) => [c[1], c[2]])))
  for (const period of ['1991-2020', '2021-2050', '2051-2080']) for (const rcp of ['rcp45', 'rcp85']) {
    const f = `d.properties.eutrees4f["${period}"].${rcp}`
    const rows = await db.query(`FOR d IN @@c LET p = ${p} FILTER p.${X} != null AND p.${Y} != null LET f = ${f} RETURN f.${X} == null OR f.${Y} == null ? null : [f.${X}, f.${Y}]`, { '@c': C.occurrences }, { batchSize: 10000 }).then((c) => c.all())
    writeFileSync(`work/examples/data/aligned-eutrees4f-${period}-${rcp}.json`, JSON.stringify(rows))
    console.log(`aligned ${period} ${rcp}: ${rows.filter(Boolean).length} of ${rows.length} cells with future values`)
  }
  for (const sp of species) {
    const out = execFileSync('.venv/bin/python', ['-I', '-c', `
import json, sys, numpy as np, rasterio, rasterio.warp
pts = json.load(open('work/suitability-points.json')); lons = np.array([p[0] for p in pts]); lats = np.array([p[1] for p in pts])
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
