// Step 6, part 1: export the units' climate probe points to work/units.jsonl ({key, lon, lat, species, restricted}),
// the input of the EU-Trees4F sampler and of the units loader. work/ is ignored by git; restricted units'
// coordinates never leave this machine and are not stored in ScatterUnits.   Usage: node sources/units/export.js
import { writeFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
try {
  const { db, collections } = connect(loadCredentials())
  const rows = await db.query(`FOR u IN @@c FILTER u.gcu_loc_climate != null
    RETURN { key: u.gcu_id_number, lon: u.gcu_loc_climate.coordinates[0], lat: u.gcu_loc_climate.coordinates[1],
             species: u.species_list || [], restricted: u["gcu_loc_coordinates-restriction"] == true }`, { '@c': collections.units }).then((c) => c.all())
  const total = await db.query('RETURN LENGTH(@@c)', { '@c': collections.units }).then((c) => c.next())
  writeFileSync('work/units.jsonl', rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
  console.log(`work/units.jsonl: ${rows.length} units with a probe point of ${total}; restricted ${rows.filter((r) => r.restricted).length}; without species ${rows.filter((r) => !r.species.length).length}`)
} catch (e) { console.error(explain(e)); process.exit(1) }
