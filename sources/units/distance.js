// Step 6, part 3: how far each unit's climate reference point lies from the unit's polygon — the data-quality flag of
// the display (Phase 3): a reference point far from the polygon means the climate values stand for the wrong place.
// Distance in km on the ETRS89-LAEA plane (EPSG:3035, shapely), 0 when the point lies inside the polygon. Stored on
// ScatterUnits as `_custom.reference_point_distance_km` (a non-term fact, like the ScatterMaps manifest; a dictionary
// term is requested if the flag stays). Restricted units get it too: a distance reveals no location.
// Files: work/units-geometry.jsonl (point + polygon per unit, restricted included, never leaves this machine),
//        work/units-distance.jsonl ({ key, km, inside }), read by sources/units/load.js on a reload.
// Usage: node sources/units/distance.js [--write]   (without --write: compute and report only)
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'

const write = process.argv.includes('--write')
try {
  const { db, collections: C } = connect(loadCredentials(), { requireLoadTarget: write })
  const rows = await db.query(`FOR u IN @@u FILTER u.gcu_loc_climate != null LET p = DOCUMENT(@@p, u.gcu_id_number) FILTER p != null
    RETURN { key: u.gcu_id_number, point: u.gcu_loc_climate, geometry: p.geometry }`, { '@u': C.units, '@p': C.unitpoly }).then((c) => c.all())
  writeFileSync('work/units-geometry.jsonl', rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
  console.log(`${rows.length} units with a reference point and a polygon`)
  execFileSync('.venv/bin/python', ['-I', '-c', `
import json
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer
to_laea = Transformer.from_crs('EPSG:4326', 'EPSG:3035', always_xy=True).transform
out = open('work/units-distance.jsonl', 'w')
for line in open('work/units-geometry.jsonl'):
    r = json.loads(line)
    poly = transform(to_laea, shape(r['geometry'])); pt = transform(to_laea, shape(r['point']))
    km = poly.distance(pt) / 1000.0
    out.write(json.dumps({'key': r['key'], 'km': round(km, 3), 'inside': km == 0}) + '\\n')
`])
  const d = readFileSync('work/units-distance.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const over = (k) => d.filter((r) => r.km > k)
  console.log(`inside the polygon: ${d.filter((r) => r.inside).length}; > 1 km: ${over(1).length}; > 5 km: ${over(5).length}; > 20 km: ${over(20).length}; max ${Math.max(...d.map((r) => r.km)).toFixed(1)} km`)
  console.log('  > 20 km: ' + over(20).sort((a, b) => b.km - a.km).map((r) => `${r.key} ${r.km.toFixed(0)}`).join(', '))
  if (write) {
    const n = await db.query(`FOR r IN @rows UPDATE r.key WITH { _custom: { reference_point_distance_km: r.km } } IN @@c OPTIONS { mergeObjects: true, ignoreErrors: true } COLLECT WITH COUNT INTO n RETURN n`, { '@c': C.units_scatter, rows: d.map(({ key, km }) => ({ key, km })) }).then((c) => c.next())
    console.log(`${C.units_scatter}: ${n} documents updated with _custom.reference_point_distance_km`)
  } else console.log('dry run: pass --write to store the distances on ScatterUnits')
} catch (e) { console.error(explain(e)); process.exit(1) }
