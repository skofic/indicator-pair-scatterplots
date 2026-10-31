// Load ScatterCells: one document per 30″ climate cell touched by an occurrence or a unit probe point, with the
// per-source, per-period indicator values (derived ones included) under properties.<source>.<period>[.<model>.<ssp>].
// _key = the cell's key in WorldClim / Chelsa (identical in both). Merges every work/cells-<source>[-<period>].jsonl.
// Usage: node sources/climate/geoservice/load_cells.js [--dry-run] [--on-missing drop|fail]
import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { connect, loadCredentials, explain } from '../../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids } from '../../../lib/dictionary.js'
import { toGids, nestFuture, occurrenceGids } from '../../../lib/records.js'
import { ensureSchema } from '../../../setup.js'
import { ensureDatasetRecords, datasetGids } from '../../datasets/records.js'
import { SOURCES } from '../../../config/indicators.js'

const dryRun = process.argv.includes('--dry-run')
const onMissing = process.argv.includes('--on-missing') ? process.argv[process.argv.indexOf('--on-missing') + 1] : 'drop'
try {
  const creds = loadCredentials(); const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const wanted = occurrenceGids()
  const { dictionary, missing: allMissing } = await loadDictionary([...wanted, ...datasetGids()], creds)
  const missing = allMissing.filter((g) => wanted.includes(g))
  if (missing.length) { console.log(`  not in the dictionary: ${missing.join(', ')}`); if (onMissing === 'fail') throw new Error('missing terms') }
  const keys = await ensureDatasetRecords(db, collections.dataset, { write: !dryRun, dictionary, missing: allMissing })

  const cells = new Map()
  for (const [src, S] of Object.entries(SOURCES)) {
    if (!S.collection) continue
    for (const period of [S.period, ...(S.future?.periods ?? [])]) {
      const f = period === S.period ? `work/cells-${src}.jsonl` : `work/cells-${src}-${period}.jsonl`
      if (!existsSync(f)) continue
      let n = 0
      for await (const line of createInterface({ input: createReadStream(f) })) {
        if (!line.trim()) continue
        const { key, values } = JSON.parse(line); n++
        if (!cells.has(key)) cells.set(key, { _key: key, std_dataset_ids: new Set([keys['SCATTER_OCCURRENCES']].filter(Boolean)), properties: {} })
        const doc = cells.get(key)
        doc.std_dataset_ids.add(S.datasetKey)
        const g = toGids(src, period === S.period ? values : nestFuture(src, period, values))
        if (Object.keys(g).length) (doc.properties[src] ??= {})[period] = g
      }
      console.log(`  ${src} ${period}: ${n} cells`)
    }
  }
  const report = validator.createReport(); const skip = new Set(missing); const leafGids = new Set(wanted)
  let invalid = 0
  for (const doc of cells.values()) {
    doc.std_dataset_ids = [...doc.std_dataset_ids]
    dropGids(doc, missing)
    const { errors } = checkDocument(doc, dictionary, report, { skip, leafGids })
    if (errors.length) { invalid++; if (invalid <= 3) console.log('  invalid:', doc._key, JSON.stringify(errors[0])) }
  }
  if (invalid) throw new Error(`${invalid} invalid cell documents`)
  if (!dryRun) {
    await ensureSchema(db, collections)
    const coll = db.collection(collections.cells); const docs = [...cells.values()]
    for (let i = 0; i < docs.length; i += 2000) await coll.import(docs.slice(i, i + 2000), { onDuplicate: 'replace' })
    console.log(`${collections.cells}: ${docs.length} imported, now ${await db.query('RETURN LENGTH(@@c)', { '@c': collections.cells }).then((c) => c.next())} documents`)
  } else console.log(`${cells.size} cell documents checked (dry run)`)
  console.log(report.format())
} catch (e) { console.error(explain(e)); process.exit(1) }
