// Step 6, part 2: ScatterUnits — one document per unit at its climate probe point, with the same per-source
// blocks as ScatterOccurrences. Cells come from ScatterCells; probe-point cells not yet cached are read from
// the grids and ADDED to the cache. Restricted units carry climate values only: no point, no cell key.
// Usage: node sources/units/load.js [--dry-run] [--on-missing drop|fail]     (after sources/units/export.js and
//        .venv/bin/python sources/climate/eutrees4f/sample.py --in work/units.jsonl --out work/climate-units-eutrees4f.jsonl)
import { readFileSync, existsSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator, checkDocument, dropGids } from '../../lib/dictionary.js'
import { containingCellKey } from '../../lib/geometry.js'
import { ensureSchema } from '../../setup.js'
import { GID, SOURCES } from '../../config/indicators.js'
import { fetchCells } from '../climate/geoservice/lookup.js'

const dryRun = process.argv.includes('--dry-run')
const onMissing = process.argv.includes('--on-missing') ? process.argv[process.argv.indexOf('--on-missing') + 1] : 'drop'
const lines = (f) => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []
try {
  const creds = loadCredentials(); const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const units = lines('work/units.jsonl')
  const t4f = new Map(lines('work/climate-units-eutrees4f.jsonl').map((l) => [l.key, l.values]))
  const keyOf = new Map(units.map((u) => [u.key, containingCellKey(u.lon, u.lat)]))
  const cellKeys = [...new Set(keyOf.values())]

  // cached cells, then the grids for the rest (and cache them)
  const cached = new Map((await db.query('FOR k IN @keys LET d = DOCUMENT(@@c, k) FILTER d != null RETURN d', { '@c': collections.cells, keys: cellKeys }).then((c) => c.all())).map((d) => [d._key, d]))
  const toFetch = cellKeys.filter((k) => !cached.has(k))
  console.log(`${units.length} units → ${cellKeys.length} cells: ${cached.size} cached, ${toFetch.length} to read from the grids`)
  const newCells = new Map()
  for (const src of ['worldclim', 'chelsa']) {
    const S = SOURCES[src]
    const got = await fetchCells(db, collections[S.collection], S, toFetch)
    for (const [k, values] of got) {
      if (!newCells.has(k)) newCells.set(k, { _key: k, std_dataset_ids: [], properties: {} })
      const doc = newCells.get(k); doc.std_dataset_ids.push(S.datasetKey)
      doc.properties[src] = Object.fromEntries(Object.entries(values).map(([ind, v]) => [GID[ind], v]))
    }
    console.log(`  ${src}: ${got.size} of ${toFetch.length} uncached cells found`)
  }

  const gids = ['gcu_id_number', 'species_list', 'gcu_loc_coordinates-restriction', 'geometry_point', 'geometry_hash', 'std_dataset_ids', ...Object.values(GID)]
  const { dictionary, missing } = await loadDictionary(gids, creds)
  if (missing.length) { console.log(`  not in the dictionary: ${missing.join(', ')}`); if (onMissing === 'fail') throw new Error('missing terms') }
  const skip = new Set(missing); const report = validator.createReport()
  // cells fetched here are cached: check them like every other document (a cache written with an unknown
  // property name on 2026-10-30 is why this exists), and refuse stale cached cells carrying unknown names
  for (const d of newCells.values()) { dropGids(d, missing); const { errors } = checkDocument(d, dictionary, report, { skip }); if (errors.length) throw new Error(`invalid cell ${d._key}: ${JSON.stringify(errors[0])}`) }
  for (const [k, d] of newCells) cached.set(k, d)
  const known = new Set(Object.values(GID)); known.add('geometry_hash')
  for (const d of cached.values()) for (const b of Object.values(d.properties ?? {})) for (const g of Object.keys(b)) if (!known.has(g)) throw new Error(`stale cached cell ${d._key} carries ${g}: remove it from ScatterCells and re-run`)
  const scale = SOURCES.eutrees4f.scale ?? {}
  const docs = []
  let invalid = 0, dedup = 0
  for (const u of units) {
    const k = keyOf.get(u.key); const cell = cached.get(k)
    // Units.species_list repeats a name for a few units (ESP00372: "Quercus suber" twice, seen 2026-10-30); the
    // dictionary defines species_list as a set, so duplicates are folded here and counted.
    const species = [...new Set(u.species)]; if (species.length !== u.species.length) dedup++
    const doc = { _key: u.key, gcu_id_number: u.key, species_list: species, 'gcu_loc_coordinates-restriction': u.restricted, std_dataset_ids: [], properties: {} }
    if (!u.restricted) doc.geometry_point = { type: 'Point', coordinates: [u.lon, u.lat] }
    const ids = new Set()
    const t = t4f.get(u.key)
    if (t && Object.values(t).some((v) => v !== null)) {
      doc.properties.eutrees4f = {}
      for (const [ind, raw] of Object.entries(t)) if (raw !== null) { const v = raw * (scale[ind] ?? 1); doc.properties.eutrees4f[GID[ind]] = Number.isInteger(v) ? v : Number(v.toFixed(4)) }
    }
    if (cell) for (const src of ['worldclim', 'chelsa']) if (cell.properties?.[src]) { doc.properties[src] = { ...(u.restricted ? {} : { geometry_hash: k }), ...cell.properties[src] }; ids.add(SOURCES[src].datasetKey) }
    doc.std_dataset_ids = [...ids]
    dropGids(doc, missing)
    const { errors } = checkDocument(doc, dictionary, report, { skip })
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
