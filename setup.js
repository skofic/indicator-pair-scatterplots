// Provision this project's collections and indexes in GeoService (idempotent; never touches data).
// Usage: node setup.js [--credentials PATH]
import { connect, loadCredentials, explain } from './lib/db.js'

export const SCHEMA = {
  species: { indexes: [{ type: 'persistent', fields: ['species'], unique: true, name: 'idx_species' }] },
  occurrences: { indexes: [
    { type: 'persistent', fields: ['species_list[*]'], name: 'idx_species_list' },
    { type: 'geo', fields: ['geometry_point'], geoJson: true, name: 'idx_geometry_point' },
  ] },
  units_scatter: { indexes: [{ type: 'persistent', fields: ['species_list[*]'], name: 'idx_species_list' }] },
  maps: { indexes: [{ type: 'persistent', fields: ['species', 'std_dataset_ids[*]'], name: 'idx_species_dataset' }] },
  cells: { indexes: [] },
}

export async function ensureSchema(db, collections) {
  const out = []
  for (const [slot, def] of Object.entries(SCHEMA)) {
    const name = collections[slot]
    if (!name) throw new Error(`credentials.collections has no "${slot}" entry`)
    const coll = db.collection(name)
    if (!(await coll.exists())) { await coll.create(); out.push(`created ${name}`) } else out.push(`exists ${name}`)
    for (const idx of def.indexes) await coll.ensureIndex(idx)
  }
  return out
}

if (process.argv[1].endsWith('setup.js')) {
  try {
    const creds = loadCredentials()
    const { db, collections, database } = connect(creds, { requireLoadTarget: true })
    console.log(`${database} @ ${creds.host}`)
    for (const line of await ensureSchema(db, collections)) console.log(' ', line)
  } catch (err) { console.error(explain(err)); process.exit(1) }
}
