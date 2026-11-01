// Map index for the display examples: work/examples/data/map-index.json
//   { species: { "<name>": { atlas_rpp, atlas_mhs, chorology: [...], eutrees4f: { "<period>|<scenario>|<variant>": path } } } }
// plus units-geo-all.geojson: every unrestricted unit's polygon, simplified for the overview (shapely, 0.0005°).
// Usage: node sources/export/map-index.js
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'
try {
  const { db, collections: C } = connect(loadCredentials())
  const rows = await db.query('FOR m IN @@c RETURN { species: m.species, c: m._custom }', { '@c': C.maps }).then((c) => c.all())
  const species = {}
  for (const { species: s, c } of rows) {
    const e = (species[s] ??= { eutrees4f: {}, chorology: [] })
    if (c.source === 'atlas_rpp') e.atlas_rpp = c.path
    else if (c.source === 'atlas_mhs') e.atlas_mhs = c.path
    else if (c.source === 'atlas_chorology') e.chorology.push({ layer: c.layer, subspecies: c.subspecies, path: c.path })
    else if (c.source === 'eutrees4f' && c.ensemble === 'ens-sdms' && c.layer.startsWith('suitability binary')) e.eutrees4f[`${c.period}|${c.scenario ?? 'cur'}|${c.variant}`] = c.path
  }
  writeFileSync('work/examples/data/map-index.json', JSON.stringify({ species }))
  const withMaps = Object.values(species).filter((e) => e.atlas_rpp || e.atlas_mhs || Object.keys(e.eutrees4f).length).length
  console.log(`map-index.json: ${Object.keys(species).length} species, ${withMaps} with rasters`)
  const geo = await db.query(`FOR d IN @@c FILTER d["gcu_loc_coordinates-restriction"] != true AND d.geometry_point != null
    LET poly = DOCUMENT(@@up, d.gcu_id_number)
    RETURN { type: "Feature", properties: { id: d.gcu_id_number, species: d.species_list, distance: d._custom.reference_point_distance_km }, geometry: poly != null ? poly.geometry : d.geometry_point }`, { '@c': C.units_scatter, '@up': C.unitpoly }).then((c) => c.all())
  writeFileSync('work/examples/data/units-geo-all-raw.geojson', JSON.stringify({ type: 'FeatureCollection', features: geo }))
  execFileSync('.venv/bin/python', ['-I', '-c', `
import json
from shapely.geometry import shape, mapping
g = json.load(open('work/examples/data/units-geo-all-raw.geojson'))
for f in g['features']:
    s = shape(f['geometry'])
    if s.geom_type != 'Point':
        t = s.simplify(0.0005, preserve_topology=True)
        f['geometry'] = mapping(t if not t.is_empty else s.centroid)
json.dump(g, open('work/examples/data/units-geo-all.geojson', 'w'), separators=(',', ':'))
`])
  const { statSync, unlinkSync } = await import('node:fs'); unlinkSync('work/examples/data/units-geo-all-raw.geojson')
  console.log(`units-geo-all.geojson: ${geo.length} unrestricted units, ${(statSync('work/examples/data/units-geo-all.geojson').size / 1048576).toFixed(1)} MB after simplification`)
} catch (e) { console.error(explain(e)); process.exit(1) }
