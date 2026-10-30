// Load ScatterCells: one document per 30″ climate cell touched by an occurrence or a unit probe point, holding
// the per-source indicator values (incl. the derived ones) under properties.<source>. _key = the cell's key in
// WorldClim / Chelsa (identical in both). Merges every work/cells-<source>.jsonl present. Idempotent.
// Usage: node sources/climate/geoservice/load_cells.js [--dry-run] [--on-missing drop|fail]
import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { connect, loadCredentials, explain } from '../../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids } from '../../../lib/dictionary.js'
import { ensureSchema } from '../../../setup.js'
import { GID, SOURCES } from '../../../config/indicators.js'

const dryRun = process.argv.includes('--dry-run')
const onMissing = process.argv.includes('--on-missing') ? process.argv[process.argv.indexOf('--on-missing') + 1] : 'drop'
try {
  const creds = loadCredentials(); const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const cells = new Map()
  for (const src of Object.keys(SOURCES)) {
    const f = `work/cells-${src}.jsonl`
    if (!existsSync(f)) continue
    let n = 0
    for await (const line of createInterface({ input: createReadStream(f) })) {
      if (!line.trim()) continue
      const { key, values } = JSON.parse(line); n++
      if (!cells.has(key)) cells.set(key, { _key: key, std_dataset_ids: [], properties: {} })
      const doc = cells.get(key)
      if (SOURCES[src].datasetKey) doc.std_dataset_ids.push(SOURCES[src].datasetKey)
      const block = {}
      for (const [ind, v] of Object.entries(values)) { if (!GID[ind]) throw new Error(`no GID for ${ind}`); block[GID[ind]] = v }
      doc.properties[src] = block
    }
    console.log(`  ${src}: ${n} cells`)
  }
  const gids = ['std_dataset_ids', ...Object.values(GID)]
  const { dictionary, missing } = await loadDictionary(gids, creds)
  if (missing.length) { console.log(`  not in the dictionary: ${missing.join(', ')}`); if (onMissing === 'fail') throw new Error('missing terms') }
  const report = validator.createReport(); const skip = new Set(missing)
  let invalid = 0
  for (const doc of cells.values()) { dropGids(doc, missing); const { errors } = checkDocument(doc, dictionary, report, { skip }); if (errors.length) { invalid++; if (invalid <= 3) console.log('  invalid:', doc._key, JSON.stringify(errors[0])) } }
  if (invalid) throw new Error(`${invalid} invalid cell documents`)
  if (!dryRun) {
    await ensureSchema(db, collections)
    const coll = db.collection(collections.cells); const docs = [...cells.values()]
    for (let i = 0; i < docs.length; i += 5000) await coll.import(docs.slice(i, i + 5000), { onDuplicate: 'replace' })
    console.log(`${collections.cells}: ${docs.length} imported, now ${await db.query('RETURN LENGTH(@@c)', { '@c': collections.cells }).then((c) => c.next())} documents`)
  } else console.log(`${cells.size} cell documents checked (dry run)`)
  console.log(report.format())
} catch (e) { console.error(explain(e)); process.exit(1) }
