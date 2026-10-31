// Load ScatterOccurrences from the work files, read IN LOCKSTEP (every climate file was written in the order
// of work/occurrences.jsonl, so no file is held in memory):
//   work/occurrences.jsonl                      the cells
//   work/climate-<source>.jsonl                 historical values per source ({key, geometry_hash?, values})
//   work/climate-eutrees4f-future.jsonl         {key, values: {<period>: {<rcp>: {...}}}}
//   work/climate-<grid>-<period>.jsonl          one per future period of worldclim / chelsa
// Every leaf value is checked against its dictionary descriptor before its batch is imported.
//   --on-missing fail|drop   --on-invalid fail|drop|keep   --dry-run   --batch N   --limit N
import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids, ON_INVALID, ON_MISSING } from '../../lib/dictionary.js'
import { occurrenceDoc, occurrenceGids, nestFuture } from '../../lib/records.js'
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

/** The climate files to read in lockstep: [{ src, period | 'future', path }]. */
function climateFiles() {
  const out = []
  for (const [src, S] of Object.entries(SOURCES)) {
    const h = `work/climate-${src}.jsonl`; if (existsSync(h)) out.push({ src, period: S.period, path: h })
    if (src === 'eutrees4f') { const f = 'work/climate-eutrees4f-future.jsonl'; if (existsSync(f)) out.push({ src, period: 'future', path: f }) }
    else for (const p of S.future?.periods ?? []) { const f = `work/climate-${src}-${p}.jsonl`; if (existsSync(f)) out.push({ src, period: p, path: f }) }
  }
  return out
}
const lines = (path) => createInterface({ input: createReadStream(path) })[Symbol.asyncIterator]()
async function nextJson(it) { const r = await it.next(); return r.done ? null : (r.value.trim() ? JSON.parse(r.value) : nextJson(it)) }

try {
  const creds = loadCredentials()
  const { db, collections, database } = connect(creds, { requireLoadTarget: !args.dryRun })
  console.log(`${database} @ ${creds.host}${args.dryRun ? '  (dry run)' : ''}`)
  const files = climateFiles()
  for (const f of files) console.log(`  ${f.src} ${f.period}: ${f.path}`)

  const wanted = occurrenceGids()
  const { dictionary, missing: allMissing } = await loadDictionary([...wanted, ...datasetGids()], creds, { snapshotFile: 'work/dictionary-snapshot.json' })
  const missing = allMissing.filter((g) => wanted.includes(g))
  if (allMissing.includes('std_dataset')) throw new Error('dictionary lacks std_dataset')
  if (missing.length) { console.log(`  not in the dictionary: ${missing.join(', ')}`); if (args.onMissing === 'fail') throw new Error('refusing: configured GIDs are missing from the dictionary (--on-missing drop to load without them)') }
  const skip = new Set(missing), leafGids = new Set(wanted)

  if (!args.dryRun) await ensureSchema(db, collections)
  const keys = await ensureDatasetRecords(db, collections.dataset, { write: !args.dryRun, dictionary, missing: allMissing })
  const ownIds = [keys['EU-FOREST_2017'], keys['SCATTER_OCCURRENCES']].filter(Boolean)
  console.log('  dataset ids:', keys)

  const report = validator.createReport()
  const coll = db.collection(collections.occurrences)
  const its = files.map((f) => ({ ...f, it: lines(f.path) }))
  const occIt = lines('work/occurrences.jsonl')
  let n = 0, invalid = 0, dropped = 0, batch = []
  const flush = async () => { if (batch.length && !args.dryRun) await coll.import(batch, { onDuplicate: 'replace' }); batch = [] }
  for (;;) {
    const occ = await nextJson(occIt)
    if (!occ || n >= args.limit) break
    const climate = {}
    for (const f of its) {
      const line = await nextJson(f.it)
      if (!line || line.key !== occ.key) throw new Error(`${f.path} is not in occurrence order at ${occ.key} (got ${line?.key})`)
      const c = (climate[f.src] ??= { periods: {} })
      if (line.geometry_hash) c.geometry_hash = line.geometry_hash
      if (f.period === 'future') Object.assign(c.periods, line.values ?? {})
      else if (f.period === SOURCES[f.src].period) c.periods[f.period] = line.values ?? {}
      else c.periods[f.period] = nestFuture(f.src, f.period, line.values ?? {})
    }
    const doc = dropGids(occurrenceDoc(occ, climate, ownIds), missing)
    const { errors } = checkDocument(doc, dictionary, report, { skip, leafGids })
    if (errors.length) {
      invalid++
      if (args.onInvalid === 'fail') throw new Error(`invalid value in ${doc._key}: ${JSON.stringify(errors.slice(0, 3))}`)
      if (args.onInvalid === 'drop') { for (const e of errors) { const parts = e.path.split('.'); let o = doc; for (const q of parts.slice(0, -1)) o = o?.[q]; if (o) { delete o[parts.at(-1)]; dropped++ } } }
    }
    batch.push(doc); n++
    if (batch.length >= args.batch) { await flush(); if (n % 50000 === 0) console.log(`  ${n} documents`) }
  }
  await flush()
  console.log(`\n${n} documents ${args.dryRun ? 'checked' : 'imported'}, ${invalid} with invalid values, ${dropped} properties dropped`)
  console.log(report.format())
  if (!args.dryRun) console.log(`${collections.occurrences} now holds ${await db.query('RETURN LENGTH(@@c)', { '@c': collections.occurrences }).then((c) => c.next())} documents`)
} catch (err) { console.error(explain(err)); process.exit(1) }
