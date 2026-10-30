// Load ScatterOccurrences from the work files: work/occurrences.jsonl (+ work/climate-<source>.jsonl for every
// source present). Every leaf value is checked against its dictionary descriptor before its batch is imported.
//   --on-missing fail|drop  : a configured GID the dictionary does not know yet (the requested derived terms)
//                             refuses the run (fail) or is dropped from every document and listed (drop, default)
//   --on-invalid fail|drop|keep : an invalid value refuses the run (default), is dropped, or is kept and counted
//   --dry-run : build and check everything, write nothing   --batch N (default 5000)   --limit N
// Usage: node sources/occurrences/load.js [--dry-run] [--on-missing drop] [--on-invalid fail] [--batch 5000]
import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids, ON_INVALID, ON_MISSING } from '../../lib/dictionary.js'
import { occurrenceDoc, occurrenceGids } from '../../lib/records.js'
import { ensureSchema } from '../../setup.js'
import { ensureDatasetRecords, datasetGids } from '../datasets/records.js'
import { SOURCES } from '../../config/indicators.js'

const args = { dryRun: false, onMissing: 'drop', onInvalid: 'fail', batch: 5000, limit: Infinity }
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i]
  if (k === '--dry-run') args.dryRun = true
  else if (k === '--on-missing') { args.onMissing = process.argv[++i]; if (!ON_MISSING.includes(args.onMissing)) throw new Error('--on-missing fail|drop') }
  else if (k === '--on-invalid') { args.onInvalid = process.argv[++i]; if (!ON_INVALID.includes(args.onInvalid)) throw new Error('--on-invalid fail|drop|keep') }
  else if (k === '--batch') args.batch = Number(process.argv[++i])
  else if (k === '--limit') args.limit = Number(process.argv[++i])
  else throw new Error(`unknown argument ${k}`)
}

async function readJsonl(path, keyField = 'key') {
  const map = new Map()
  for await (const line of createInterface({ input: createReadStream(path) })) if (line.trim()) { const d = JSON.parse(line); map.set(d[keyField], d) }
  return map
}

try {
  const creds = loadCredentials()
  const { db, collections, database } = connect(creds, { requireLoadTarget: !args.dryRun })
  console.log(`${database} @ ${creds.host}${args.dryRun ? '  (dry run)' : ''}`)

  // climate work files present
  const climate = {}
  for (const src of Object.keys(SOURCES)) {
    const f = `work/climate-${src}.jsonl`
    if (existsSync(f)) { climate[src] = await readJsonl(f); console.log(`  ${src}: ${climate[src].size} climate lines`) }
  }

  // dictionary snapshot and the missing-terms policy
  const wanted = occurrenceGids()
  const { dictionary, missing: allMissing } = await loadDictionary([...wanted, ...datasetGids()], creds, { snapshotFile: 'work/dictionary-snapshot.json' })
  const missing = allMissing.filter((g) => wanted.includes(g))
  if (allMissing.includes('std_dataset')) throw new Error('dictionary lacks std_dataset')
  if (missing.length) {
    console.log(`  not in the dictionary: ${missing.join(', ')}`)
    if (args.onMissing === 'fail') throw new Error('refusing: configured GIDs are missing from the dictionary (--on-missing drop to load without them)')
  }
  const skip = new Set(missing)

  // dataset ids
  if (!args.dryRun) await ensureSchema(db, collections)
  const keys = await ensureDatasetRecords(db, collections.dataset, { write: !args.dryRun, dictionary, missing: allMissing })
  const datasetIds = Object.values(keys).filter(Boolean)
  console.log('  dataset ids:', keys)

  const report = validator.createReport()
  const coll = db.collection(collections.occurrences)
  let n = 0, invalid = 0, dropped = 0, batch = []
  const flush = async () => { if (batch.length && !args.dryRun) await coll.import(batch, { onDuplicate: 'replace' }); batch = [] }
  for await (const line of createInterface({ input: createReadStream('work/occurrences.jsonl') })) {
    if (!line.trim() || n >= args.limit) continue
    const occ = JSON.parse(line)
    const clim = Object.fromEntries(Object.entries(climate).map(([src, m]) => [src, m.get(occ.key)]))
    const doc = dropGids(occurrenceDoc(occ, clim, datasetIds), missing)
    const { errors } = checkDocument(doc, dictionary, report, { skip })
    if (errors.length) {
      invalid++
      if (args.onInvalid === 'fail') throw new Error(`invalid value in ${doc._key}: ${JSON.stringify(errors.slice(0, 3))}`)
      if (args.onInvalid === 'drop') { for (const e of errors) { const [, src, gid] = e.path.split('.'); if (src && gid && doc.properties[src]) { delete doc.properties[src][gid]; dropped++ } } }
    }
    batch.push(doc); n++
    if (batch.length >= args.batch) { await flush(); if (n % 50000 === 0) console.log(`  ${n} documents`) }
  }
  await flush()
  console.log(`\n${n} documents ${args.dryRun ? 'checked' : 'imported'}, ${invalid} with invalid values, ${dropped} properties dropped`)
  console.log(report.format())
  if (!args.dryRun) {
    const count = await db.query('RETURN LENGTH(@@c)', { '@c': collections.occurrences }).then((c) => c.next())
    console.log(`${collections.occurrences} now holds ${count} documents`)
  }
} catch (err) { console.error(explain(err)); process.exit(1) }
