// Step 6, part 3: how far each unit's climate reference point lies from the unit's polygon — the data-quality flag of
// the display (Phase 3): a reference point far from the polygon means the climate values stand for the wrong place.
// Distance in km on the ETRS89-LAEA plane (EPSG:3035, shapely), 0 when the point lies inside the polygon. Stored on
// ScatterUnits as the descriptor `gcu_loc_climate_distance` (dictionary term of 2026-11-09, validated before writing);
// restricted units get it too: a distance reveals no location. The reference point itself is stored as
// `gcu_loc_climate` (GeoJSON Point) on unrestricted units only. --write also removes the pre-term `_custom` block.
// Files: work/units-geometry.jsonl (point + polygon per unit, restricted included, never leaves this machine),
//        work/units-distance.jsonl ({ key, km, inside }), read by sources/units/load.js on a reload.
// Usage: node sources/units/distance.js [--write]   (without --write: compute and report only)
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator } from '../../lib/dictionary.js'
const DIST = 'gcu_loc_climate_distance', POINT = 'gcu_loc_climate'

const write = process.argv.includes('--write')
try {
  const creds = loadCredentials(), { db, collections: C } = connect(creds, { requireLoadTarget: write })
  const rows = await db.query(`FOR u IN @@u FILTER u.gcu_loc_climate != null LET p = DOCUMENT(@@p, u.gcu_id_number) FILTER p != null
    RETURN { key: u.gcu_id_number, point: u.gcu_loc_climate, geometry: p.geometry, restricted: u["gcu_loc_coordinates-restriction"] == true }`, { '@u': C.units, '@p': C.unitpoly }).then((c) => c.all())
  writeFileSync('work/units-geometry.jsonl', rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
  console.log(`${rows.length} units with a reference point and a polygon`)
  execFileSync('.venv/bin/python', ['-I', '-c', `
import json, numpy as np
from shapely.geometry import shape
from shapely import transform
from pyproj import Transformer
to_laea = Transformer.from_crs('EPSG:4326', 'EPSG:3035', always_xy=True).transform
laea = lambda g: transform(g, lambda c: np.column_stack(to_laea(c[:, 0], c[:, 1])))
out = open('work/units-distance.jsonl', 'w')
for line in open('work/units-geometry.jsonl'):
    r = json.loads(line)
    poly = laea(shape(r['geometry'])); pt = laea(shape(r['point']))
    km = poly.distance(pt) / 1000.0
    out.write(json.dumps({'key': r['key'], 'km': round(km, 3), 'inside': km == 0}) + '\\n')
`])
  const d = readFileSync('work/units-distance.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const over = (k) => d.filter((r) => r.km > k)
  console.log(`inside the polygon: ${d.filter((r) => r.inside).length}; > 1 km: ${over(1).length}; > 5 km: ${over(5).length}; > 20 km: ${over(20).length}; max ${Math.max(...d.map((r) => r.km)).toFixed(1)} km`)
  console.log('  > 20 km: ' + over(20).sort((a, b) => b.km - a.km).map((r) => `${r.key} ${r.km.toFixed(0)}`).join(', '))
  // validate every value against the dictionary before writing anything
  const { dictionary, missing } = await loadDictionary([DIST, POINT], creds)
  if (missing.length) throw new Error(`terms missing from the dictionary: ${missing.join(', ')}`)
  const report = validator.createReport(), byKey = new Map(rows.map((r) => [r.key, r]))
  const docs = d.map(({ key, km }) => { const r = byKey.get(key); const doc = { key, [DIST]: km }; if (!r.restricted) doc[POINT] = r.point; return doc })
  let invalid = 0
  for (const doc of docs) for (const g of [DIST, POINT]) if (g in doc) { const v = validator.validateByDictionary(doc[g], g, dictionary); report.add(v, { gid: g }); if (v.errors.length) { invalid++; if (invalid <= 3) console.log('  invalid', doc.key, g, JSON.stringify(v.errors[0])) } }
  if (invalid) throw new Error(`${invalid} invalid values, nothing written`)
  console.log(report.format())
  if (write) {
    const n = await db.query(`FOR r IN @rows UPDATE r.key WITH MERGE(UNSET(r, "key"), { _custom: null }) IN @@c OPTIONS { keepNull: false, mergeObjects: false, ignoreErrors: true } COLLECT WITH COUNT INTO n RETURN n`, { '@c': C.units_scatter, rows: docs }).then((c) => c.next())
    console.log(`${C.units_scatter}: ${n} documents updated with ${DIST} (${docs.filter((x) => POINT in x).length} with ${POINT}); _custom removed`)
  } else console.log('dry run: pass --write to store the distances on ScatterUnits')
} catch (e) { console.error(explain(e)); process.exit(1) }
