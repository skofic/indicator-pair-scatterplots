// Load ScatterSpecies from work/species.jsonl (idempotent: onDuplicate replace).
// Usage: node sources/species/load.js [--dry-run]
import { readFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator } from '../../lib/dictionary.js'
import { speciesDoc } from '../../lib/records.js'
import { ensureSchema } from '../../setup.js'
const dryRun = process.argv.includes('--dry-run')
try {
  const creds = loadCredentials()
  const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const { dictionary, missing } = await loadDictionary(['species', '_custom'], creds)
  if (missing.length) throw new Error(`dictionary lacks ${missing.join(', ')}`)
  const docs = readFileSync('work/species.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => speciesDoc(JSON.parse(l)))
  const report = validator.createReport()
  for (const d of docs) {
    const r = validator.validateByDictionary(d.species, 'species', dictionary); report.add(r, { gid: 'species' })
    if (r.errors.length) throw new Error(`invalid species name ${JSON.stringify(d.species)}: ${r.errors[0].message}`)
  }
  if (!dryRun) {
    await ensureSchema(db, collections)
    await db.collection(collections.species).import(docs, { onDuplicate: 'replace' })
    const count = await db.query('RETURN LENGTH(@@c)', { '@c': collections.species }).then((c) => c.next())
    console.log(`${collections.species}: ${docs.length} imported, now ${count} documents`)
  } else console.log(`${docs.length} species documents checked (dry run)`)
  console.log(report.format())
} catch (err) { console.error(explain(err)); process.exit(1) }
