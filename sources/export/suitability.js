// EU-Trees4F Figure 1 classification for the display examples: every occurrence cell (global order of pair.js)
// classified per species from the published binary suitability rasters, current vs future:
//   0 = unsuitable in both (or outside the rasters), 1 = stable (suitable now and later), 2 = decolonised (now, not later), 3 = newly suitable
// Output: work/examples/data/suitability-<species>.json  { "<period>|<rcp>|<variant>": "<one digit per cell>" } (the offline fixture)
//         and, with --write, the PanesSuitability collection of the panes' Foxx service: one document per species × period ×
//         scenario × variant keyed by the dictionary terms (species, env_climate_period, env_climate_scenario,
//         ui_layout_scatterplot_view_classes_variant), the digit string under _custom.cells with counts and the global
//         order's version — until a descriptor for the string exists (service design note §10.2).
// Period pairing (paper, Methods): each future map is driven by the climate of the previous 30 years, as the current map
// (cur2005) is by 1961-1990 — fut2035 ← 1991-2020, fut2065 ← 2021-2050, fut2095 ← 2051-2080 (the R scripts' fut1..3).
// Usage: node sources/export/suitability.js [--write] [--all | "Fagus sylvatica" ...]   (after pair.js, which writes cells.json)
//   --all = every species of ScatterSpecies with EU-Trees4F maps; --write = store in PanesSuitability (load target required)
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'

const write = process.argv.includes('--write'), all = process.argv.includes('--all')
const FUT_MAP = { fut2035: '1991-2020', fut2065: '2021-2050', fut2095: '2051-2080' }   // map period → the climate period that drives it (30-year lag)
const VARIANT = { pot: 'ui_layout_scatterplot_view_classes_variant_potential', disp: 'ui_layout_scatterplot_view_classes_variant_dispersal' }
try {
  const { db } = connect(loadCredentials(), { requireLoadTarget: write })
  const species = all ? await db.query('FOR s IN ScatterSpecies FILTER s._custom.eutrees4f == true SORT s.species RETURN s.species').then((c) => c.all())
    : (process.argv.slice(2).filter((a) => !a.startsWith('--')).length ? process.argv.slice(2).filter((a) => !a.startsWith('--')) : ['Fagus sylvatica', 'Quercus ilex', 'Picea abies'])
  const cells = JSON.parse(readFileSync('work/examples/data/cells.json', 'utf8'))
  // the global order's version, as the service computes it (count:first key:last key), so a reload invalidates the documents
  const v = await db.query('LET ks = (FOR d IN ScatterOccurrences SORT d._key RETURN d._key) RETURN CONCAT(LENGTH(ks), ":", FIRST(ks), ":", LAST(ks))').then((c) => c.next())
  if (Number(v.split(':')[0]) !== cells.length) throw new Error(`cells.json (${cells.length}) and ScatterOccurrences (${v}) differ: re-run pair.js`)
  console.log(`${cells.length} cells (global order ${v}); ${species.length} species${write ? ', writing PanesSuitability' : ''}`)
  const coll = db.collection('PanesSuitability')
  const { existsSync } = await import('node:fs')
  // the rasters are named with EU-Trees4F's names; four of them (Aria edulis, Cormus domestica, Borkhausenia intermedia,
  // Torminalis glaberrima) are folded into their Sorbus names in ScatterSpecies, so the file is looked up under the
  // accepted name and then under its aliases
  const aliases = new Map((await db.query('FOR s IN ScatterSpecies RETURN [s.species, s._custom.aliases || []]').then((c) => c.all())))
  for (const sp of species) {
    const fileName = [sp, ...(aliases.get(sp) ?? [])].find((n) => existsSync(`maps/eutrees4f/ens_sdms/bin/${n.replace(' ', '_')}_ens-sdms_cur2005_bin_pot.tif`))
    if (!fileName) { console.warn(`  ${sp}: no EU-Trees4F binary maps (cur2005 pot missing), skipped`); continue }
    const out = execFileSync('.venv/bin/python', ['-I', '-c', `
import json, sys, numpy as np, rasterio, rasterio.warp
pts = json.load(open('work/examples/data/cells.json')); lons = np.array([p[0] for p in pts]); lats = np.array([p[1] for p in pts])
D = 'maps/eutrees4f/ens_sdms/bin/'; sp = '${fileName.replace(' ', '_')}'
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
c = out['fut2095|rcp85|pot']; print('${sp}${fileName !== sp ? ' (files: ' + fileName + ')' : ''}: current suitable', int((cur == 1).sum()), '| 2095 RCP 8.5 pot: stable', c.count('1'), 'decolonised', c.count('2'), 'new', c.count('3'))
`], { encoding: 'utf8' })
    process.stdout.write(out)
    if (write) {
      const data = JSON.parse(readFileSync(`work/examples/data/suitability-${sp.replace(' ', '_')}.json`, 'utf8')), docs = []
      for (const [k, cls] of Object.entries(data)) {   // the document key joins the parts with '_' ('|' is not a legal key character)
        const [fut, rcp, variant] = k.split('|'), counts = [0, 1, 2, 3].map((d) => (cls.match(new RegExp(d, 'g')) || []).length)
        docs.push({ _key: `${sp.replace(/\W+/g, '_')}_${FUT_MAP[fut]}_${rcp}_${variant}`, species: sp, env_climate_period: `env_climate_period_worldclim14_${FUT_MAP[fut]}`, env_climate_scenario: `env_climate_scenario_${rcp}`, ui_layout_scatterplot_view_classes_variant: VARIANT[variant], _custom: { cells: cls, counts, version: v, map_period: fut } })
      }
      const r = await coll.import(docs, { onDuplicate: 'replace', details: true })
      if (r.errors) throw new Error(`PanesSuitability import: ${r.errors} errors — ${(r.details || []).slice(0, 2).join('; ')}`)
      console.log(`  PanesSuitability: ${r.created + r.updated} documents for ${sp}`)
    }
  }
  if (write) console.log(`PanesSuitability now holds ${await db.query('RETURN LENGTH(PanesSuitability)').then((c) => c.next())} documents`)
} catch (e) { console.error(explain(e)); process.exit(1) }
