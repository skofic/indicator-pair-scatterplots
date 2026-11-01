// The unit search index for the display examples: work/examples/data/units-index.json
//   { countries: [{ code, units }], species: [{ name, units }], units: [{ id, country, species, restricted, distance }] }
// Country = the first three characters of the unit number (ISO 3166-1 alpha-3).   Usage: node sources/export/units-index.js
import { writeFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
try {
  const { db, collections: C } = connect(loadCredentials())
  const units = await db.query('FOR d IN @@c SORT d.gcu_id_number RETURN { id: d.gcu_id_number, country: SUBSTRING(d.gcu_id_number, 0, 3), species: d.species_list, restricted: d["gcu_loc_coordinates-restriction"] == true, distance: d._custom.reference_point_distance_km }', { '@c': C.units_scatter }).then((c) => c.all())
  const count = (key) => { const m = new Map(); for (const u of units) for (const k of [].concat(u[key])) m.set(k, (m.get(k) ?? 0) + 1); return [...m].sort((a, b) => a[0].localeCompare(b[0])) }
  const out = { countries: count('country').map(([code, n]) => ({ code, units: n })), species: count('species').map(([name, n]) => ({ name, units: n })), units }
  writeFileSync('work/examples/data/units-index.json', JSON.stringify(out))
  console.log(`units-index.json: ${units.length} units, ${out.countries.length} countries, ${out.species.length} species, ${units.filter((u) => u.restricted).length} restricted`)
} catch (e) { console.error(explain(e)); process.exit(1) }
