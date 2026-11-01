// Export one indicator pair for the Phase 3 display examples (work/examples/data/). Every file follows ONE global
// cell order — ScatterOccurrences sorted by _key — so that layers are index lists and nothing is re-keyed:
//   cells.json                                       [[lon, lat], ...]  every occurrence cell, the global order
//   base-<src>-<period>[-<scenario>].json           [[x, y] | null, ...] the pair per cell in that order (null = no value)
//   species-<name>.json                              [i, ...] indexes of the cells holding the species (climate-independent)
//   units-<name>.json   [{ id, species, restricted, distance (km, reference point → polygon), values: { "<src>|<period>|<scenario>": [x, y] } }]
//   climates.json       the climate selector: every source / period / scenario with labels
//   meta.json
// This is also the shape the Foxx service will serve: the base per pair × climate is static, the service returns
// index lists (species, map area, map point) and unit values.
// Usage: node sources/export/pair.js [--pair P1] [--species "Fagus sylvatica" "Quercus ilex" ...] [--force]
import { writeFileSync, existsSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { GID, PAIRS, SOURCES } from '../../config/indicators.js'

const argAll = (k) => { const i = process.argv.indexOf(k); if (i < 0) return null; const out = []; for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j++) out.push(process.argv[j]); return out }
const pairKey = argAll('--pair')?.[0] ?? 'P1', pair = PAIRS[pairKey]
const speciesList = argAll('--species') ?? ['Fagus sylvatica', 'Quercus ilex', 'Picea abies']
const force = process.argv.includes('--force')
const X = GID[pair.x], Y = GID[pair.y]
const slug = (s) => s.replace(/\s+/g, '_')
const TITLE = { eutrees4f: 'EU-Trees4F (WorldClim 1.4 + EURO-CORDEX, 10 km)', worldclim: 'WorldClim 2.1 (1 km)', chelsa: 'CHELSA 2.1 (1 km)' }
export const ORDER = 'FOR d IN @@c SORT d._key'   // the global cell order, shared with suitability.js

/** Every climate block: { key, src, period, scenario, path (AQL into d.properties), label, present } */
export function climates() {
  const out = []
  for (const [src, S] of Object.entries(SOURCES)) {
    out.push({ key: `${src}|${S.period}|`, src, period: S.period, scenario: '', path: `d.properties.${src}["${S.period}"]`, label: `${TITLE[src]} · ${S.period}`, present: true })
    for (const p of S.future?.periods ?? []) {
      if (S.future.scenarios) for (const sc of S.future.scenarios) out.push({ key: `${src}|${p}|${sc}`, src, period: p, scenario: sc, path: `d.properties.${src}["${p}"]["${sc}"]`, label: `${TITLE[src]} · ${p} · ${sc.toUpperCase().replace('RCP', 'RCP ').replace('45', '4.5').replace('85', '8.5')}`, present: false })
      else out.push({ key: `${src}|${p}|${S.future.ssp}`, src, period: p, scenario: S.future.ssp, path: `d.properties.${src}["${p}"]["${S.future.model}"]["${S.future.ssp}"]`, label: `${TITLE[src]} · ${p} · ${S.future.model} SSP3-7.0`, present: false })
    }
  }
  return out
}
if (process.argv[1].endsWith('pair.js')) try {
  const { db, collections: C } = connect(loadCredentials())
  const q = (a, b = {}) => db.query(a, b, { batchSize: 10000 }).then((c) => c.all())
  const cl = climates()
  const meta = { pair: { key: pairKey, ...pair, x: X, y: Y }, species: speciesList, counts: {}, exported: new Date().toISOString() }
  const rows = await q(`${ORDER} RETURN [d._key, d.geometry_point.coordinates]`, { '@c': C.occurrences })
  const cells = rows.map((r) => r[1]), index = new Map(rows.map((r, i) => [r[0], i]))
  writeFileSync('work/examples/data/cells.json', JSON.stringify(cells)); meta.counts.cells = cells.length
  console.log(`${cells.length} cells`)
  for (const c of cl) {
    const file = `work/examples/data/base-${c.src}-${c.period}${c.scenario ? '-' + c.scenario : ''}.json`
    if (force || !existsSync(file)) {
      const base = await q(`${ORDER} LET p = ${c.path} RETURN p.${X} == null OR p.${Y} == null ? null : [p.${X}, p.${Y}]`, { '@c': C.occurrences })
      if (base.length !== cells.length) throw new Error(`${c.key}: ${base.length} rows for ${cells.length} cells`)
      writeFileSync(file, JSON.stringify(base)); meta.counts[`base ${c.key}`] = base.filter(Boolean).length
    }
    console.log(`${c.key}: done`)
  }
  for (const sp of speciesList) {
    // index list: the position of each cell holding the species in the global order
    const idx = (await q(`FOR d IN @@c FILTER @s IN d.species_list RETURN d._key`, { '@c': C.occurrences, s: sp })).map((k) => index.get(k)).sort((a, b) => a - b)
    writeFileSync(`work/examples/data/species-${slug(sp)}.json`, JSON.stringify(idx)); meta.counts[`${sp} cells`] = idx.length
    const sel = cl.map((c) => `"${c.key}": [${c.path}.${X}, ${c.path}.${Y}]`).join(', ')
    const units = await q(`FOR d IN @@c FILTER @s IN d.species_list RETURN { id: d.gcu_id_number, species: d.species_list, restricted: d["gcu_loc_coordinates-restriction"], distance: d._custom.reference_point_distance_km, values: { ${sel} } }`, { '@c': C.units_scatter, s: sp })
    for (const u of units) for (const k of Object.keys(u.values)) if (u.values[k][0] == null) delete u.values[k]
    writeFileSync(`work/examples/data/units-${slug(sp)}.json`, JSON.stringify(units)); meta.counts[`units ${sp}`] = units.length
    console.log(`${sp}: ${idx.length} cells, ${units.length} units`)
  }
  writeFileSync('work/examples/data/climates.json', JSON.stringify(cl.map(({ path, ...c }) => c)))
  writeFileSync('work/examples/data/meta.json', JSON.stringify(meta, null, 1))
  console.log(`${cl.length} climates; files in work/examples/data`)
} catch (e) { console.error(explain(e)); process.exit(1) }
