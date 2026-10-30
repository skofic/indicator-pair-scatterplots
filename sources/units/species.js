// Read the EUFGIS target species from GeoService.Units → work/unit-species.json ({ "<name>": <units> }),
// the input of sources/species/build.js for the `eufgis_target` column.  Usage: node sources/units/species.js
import { writeFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
try {
  const creds = loadCredentials()
  const { db, collections } = connect(creds)
  const rows = await db.query(
    'FOR u IN @@c FOR s IN (u.species_list || []) COLLECT name = s WITH COUNT INTO n SORT name RETURN { name, n }',
    { '@c': collections.units }).then((c) => c.all())
  const total = await db.query('RETURN LENGTH(@@c)', { '@c': collections.units }).then((c) => c.next())
  const out = Object.fromEntries(rows.map((r) => [r.name, r.n]))
  writeFileSync('work/unit-species.json', JSON.stringify(out, null, 1))
  console.log(`work/unit-species.json: ${rows.length} species over ${total} units`)
} catch (err) { console.error(explain(err)); process.exit(1) }
