// Step 6: ScatterUnits — one document per unit at its climate probe point, with the same per-source, per-period
// blocks as ScatterOccurrences. Grid cells come from ScatterCells; probe-point cells not yet cached are read from
// the grids for every period and ADDED to the cache (validated first). Restricted units carry climate values
// only: no point, no cell key.   Usage: node sources/units/load.js [--dry-run] [--on-missing drop|fail]
// Inputs: work/units.jsonl (sources/units/export.js), work/climate-units-eutrees4f.jsonl and
//         work/climate-units-eutrees4f-future.jsonl (sources/climate/eutrees4f/sample*.py --in work/units.jsonl),
//         work/units-distance.jsonl if present (sources/units/distance.js) → _custom.reference_point_distance_km
import { readFileSync, existsSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids } from '../../lib/dictionary.js'
import { containingCellKey } from '../../lib/geometry.js'
import { climateBlock, nestFuture, occurrenceGids, toGids } from '../../lib/records.js'
import { ensureSchema } from '../../setup.js'
import { GID, SOURCES } from '../../config/indicators.js'
import { fetchCells } from '../climate/geoservice/lookup.js'
import { ensureDatasetRecords, datasetGids } from '../datasets/records.js'

const dryRun = process.argv.includes('--dry-run')
const onMissing = process.argv.includes('--on-missing') ? process.argv[process.argv.indexOf('--on-missing') + 1] : 'drop'
const lines = (f) => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
try {
  const creds = loadCredentials(); const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const wanted = occurrenceGids(); const extra = ['gcu_id_number', 'gcu_loc_coordinates-restriction']
  const { dictionary, missing: allMissing } = await loadDictionary([...wanted, ...extra, ...datasetGids()], creds)
  const missing = allMissing.filter((g) => wanted.includes(g) || extra.includes(g))
  if (missing.length) { console.log(`  not in the dictionary: ${missing.join(', ')}`); if (onMissing === 'fail') throw new Error('missing terms') }
  const keys = await ensureDatasetRecords(db, collections.dataset, { write: !dryRun, dictionary, missing: allMissing })
  const skip = new Set(missing); const leafGids = new Set([...wanted, ...extra]); const report = validator.createReport()

  const units = lines('work/units.jsonl')
  const t4fH = new Map(lines('work/climate-units-eutrees4f.jsonl').map((l) => [l.key, l.values]))
  const t4fF = new Map(lines('work/climate-units-eutrees4f-future.jsonl').map((l) => [l.key, l.values]))
  const distance = new Map(lines('work/units-distance.jsonl').map((l) => [l.key, l.km]))   // sources/units/distance.js, kept across reloads
  const keyOf = new Map(units.map((u) => [u.key, containingCellKey(u.lon, u.lat)]))
  const cellKeys = [...new Set(keyOf.values())]

  // cached cells, then the grids (every period) for the rest, which are validated and cached
  const cached = new Map((await db.query('FOR k IN @keys LET d = DOCUMENT(@@c, k) FILTER d != null RETURN d', { '@c': collections.cells, keys: cellKeys }).then((c) => c.all())).map((d) => [d._key, d]))
  // a cached cell is current only if every grid block it holds is nested by period (the shape since
  // 2026-10-31); older flat cells (3 287 unit-only cells on 2026-10-31) are refetched and rewritten
  let stale = 0
  for (const [k, d] of [...cached]) if (['worldclim', 'chelsa'].some((src) => d.properties?.[src] && !(SOURCES[src].period in d.properties[src]))) { cached.delete(k); stale++ }
  const toFetch = cellKeys.filter((k) => !cached.has(k))
  console.log(`${units.length} units → ${cellKeys.length} cells: ${cached.size} cached, ${stale} stale, ${toFetch.length} to read from the grids`)
  const newCells = new Map()
  for (const src of ['worldclim', 'chelsa']) {
    const S = SOURCES[src]
    for (const period of [S.period, ...(S.future?.periods ?? [])]) {
      const got = await fetchCells(db, collections[S.collection], S, toFetch, { period })
      for (const [k, values] of got) {
        if (!newCells.has(k)) newCells.set(k, { _key: k, std_dataset_ids: new Set([keys['SCATTER_OCCURRENCES']].filter(Boolean)), properties: {} })
        const doc = newCells.get(k); doc.std_dataset_ids.add(S.datasetKey)
        const g = toGids(src, period === S.period ? values : nestFuture(src, period, values))
        if (Object.keys(g).length) (doc.properties[src] ??= {})[period] = g
      }
      if (period === S.period) console.log(`  ${src}: ${got.size} of ${toFetch.length} uncached cells found`)
    }
  }
  for (const d of newCells.values()) { d.std_dataset_ids = [...d.std_dataset_ids]; dropGids(d, missing); const { errors } = checkDocument(d, dictionary, report, { skip, leafGids }); if (errors.length) throw new Error(`invalid cell ${d._key}: ${JSON.stringify(errors[0])}`); cached.set(d._key, d) }
  const known = new Set([...Object.values(GID), 'geometry_hash'])
  const walkKeys = (o, f) => { for (const [k, v] of Object.entries(o)) { if (known.has(k)) continue; if (v && typeof v === 'object') walkKeys(v, f); else f(k) } }
  for (const d of cached.values()) walkKeys(d.properties ?? {}, (k) => { throw new Error(`stale cached cell ${d._key} carries ${k}: remove it from ScatterCells and re-run`) })

  const docs = []
  let invalid = 0, dedup = 0
  for (const u of units) {
    const species = [...new Set(u.species)]; if (species.length !== u.species.length) dedup++   // ESP00372 repeats a name
    const doc = { _key: u.key, gcu_id_number: u.key, species_list: species, 'gcu_loc_coordinates-restriction': u.restricted, std_dataset_ids: [keys['SCATTER_UNITS']].filter(Boolean), properties: {} }
    if (!u.restricted) doc.geometry_point = { type: 'Point', coordinates: [u.lon, u.lat] }
    if (distance.has(u.key)) doc._custom = { reference_point_distance_km: distance.get(u.key) }
    const ids = new Set(doc.std_dataset_ids)
    const periods = {}
    if (t4fH.get(u.key)) periods[SOURCES.eutrees4f.period] = t4fH.get(u.key)
    Object.assign(periods, t4fF.get(u.key) ?? {})
    const t4 = climateBlock('eutrees4f', { periods })
    if (t4) { doc.properties.eutrees4f = t4; if (keys['EU-TREES4F_PREDICTORS_2022']) ids.add(keys['EU-TREES4F_PREDICTORS_2022']) }
    const cell = cached.get(keyOf.get(u.key))
    if (cell) for (const src of ['worldclim', 'chelsa']) if (cell.properties?.[src]) { doc.properties[src] = { ...(u.restricted ? {} : { geometry_hash: cell._key }), ...cell.properties[src] }; ids.add(SOURCES[src].datasetKey) }
    doc.std_dataset_ids = [...ids]
    dropGids(doc, missing)
    const { errors } = checkDocument(doc, dictionary, report, { skip, leafGids })
    if (errors.length) { invalid++; if (invalid <= 3) console.log('  invalid:', doc._key, JSON.stringify(errors[0])) }
    docs.push(doc)
  }
  if (invalid) throw new Error(`${invalid} invalid unit documents`)
  if (!dryRun) {
    await ensureSchema(db, collections)
    if (newCells.size) await db.collection(collections.cells).import([...newCells.values()], { onDuplicate: 'replace' })
    await db.collection(collections.units_scatter).import(docs, { onDuplicate: 'replace' })
    console.log(`${collections.units_scatter}: ${docs.length} imported (now ${await db.query('RETURN LENGTH(@@c)', { '@c': collections.units_scatter }).then((c) => c.next())}); ${newCells.size} cells added to ${collections.cells}`)
  } else console.log(`${docs.length} unit documents checked (dry run)`)
  console.log(`  units whose species list had duplicates: ${dedup}`)
  console.log(`  without WorldClim block: ${docs.filter((d) => !d.properties.worldclim).length}, without CHELSA: ${docs.filter((d) => !d.properties.chelsa).length}, without EU-Trees4F: ${docs.filter((d) => !d.properties.eutrees4f).length}`)
  console.log(report.format())
} catch (e) { console.error(explain(e)); process.exit(1) }
