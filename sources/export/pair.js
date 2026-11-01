// Export one indicator pair for the Phase 3 display examples (work/examples/data/):
//   base-<src>-<period>[-<scenario>].json           [[x, y], ...] for every occurrence cell with a value
//   species-<name>-<src>-<period>[-<scenario>].json  the species' cells
//   units-<name>.json   [{ id, species, restricted, values: { "<src>|<period>|<scenario>": [x, y] } }]
//   climates.json       the climate selector: every source / period / scenario with labels
//   meta.json
// Usage: node sources/export/pair.js [--pair P1] [--species "Fagus sylvatica" "Quercus ilex" ...]
import { writeFileSync, existsSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { GID, PAIRS, SOURCES } from '../../config/indicators.js'

const argAll = (k) => { const i = process.argv.indexOf(k); if (i < 0) return null; const out = []; for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j++) out.push(process.argv[j]); return out }
const pairKey = argAll('--pair')?.[0] ?? 'P1', pair = PAIRS[pairKey]
const speciesList = argAll('--species') ?? ['Fagus sylvatica', 'Quercus ilex', 'Picea abies']
const X = GID[pair.x], Y = GID[pair.y]
const slug = (s) => s.replace(/\s+/g, '_')
const TITLE = { eutrees4f: 'EU-Trees4F (WorldClim 1.4 + EURO-CORDEX, 10 km)', worldclim: 'WorldClim 2.1 (1 km)', chelsa: 'CHELSA 2.1 (1 km)' }

/** Every climate block: { key, src, period, scenario, path (AQL into d.properties), label, present } */
function climates() {
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
try {
  const { db, collections: C } = connect(loadCredentials())
  const q = (a, b = {}) => db.query(a, b, { batchSize: 10000 }).then((c) => c.all())
  const cl = climates()
  const meta = { pair: { key: pairKey, ...pair, x: X, y: Y }, species: speciesList, counts: {}, exported: new Date().toISOString() }
  for (const c of cl) {
    const file = `work/examples/data/base-${c.src}-${c.period}${c.scenario ? '-' + c.scenario : ''}.json`
    if (!existsSync(file)) { const base = await q(`FOR d IN @@c LET p = ${c.path} FILTER p.${X} != null AND p.${Y} != null RETURN [p.${X}, p.${Y}]`, { '@c': C.occurrences }); writeFileSync(file, JSON.stringify(base)); meta.counts[`base ${c.key}`] = base.length }
    for (const sp of speciesList) {
      const f = `work/examples/data/species-${slug(sp)}-${c.src}-${c.period}${c.scenario ? '-' + c.scenario : ''}.json`
      if (existsSync(f)) continue
      const rows = await q(`FOR d IN @@c FILTER @s IN d.species_list LET p = ${c.path} FILTER p.${X} != null AND p.${Y} != null RETURN [p.${X}, p.${Y}]`, { '@c': C.occurrences, s: sp })
      writeFileSync(f, JSON.stringify(rows)); meta.counts[`${sp} ${c.key}`] = rows.length
    }
    console.log(`${c.key}: done`)
  }
  for (const sp of speciesList) {
    const sel = cl.map((c) => `"${c.key}": [${c.path}.${X}, ${c.path}.${Y}]`).join(', ')
    const units = await q(`FOR d IN @@c FILTER @s IN d.species_list RETURN { id: d.gcu_id_number, species: d.species_list, restricted: d["gcu_loc_coordinates-restriction"], values: { ${sel} } }`, { '@c': C.units_scatter, s: sp })
    for (const u of units) for (const k of Object.keys(u.values)) if (u.values[k][0] == null) delete u.values[k]
    writeFileSync(`work/examples/data/units-${slug(sp)}.json`, JSON.stringify(units)); meta.counts[`units ${sp}`] = units.length
    console.log(`${sp}: ${units.length} units`)
  }
  writeFileSync('work/examples/data/climates.json', JSON.stringify(cl.map(({ path, ...c }) => c)))
  writeFileSync('work/examples/data/meta.json', JSON.stringify(meta, null, 1))
  console.log(`${cl.length} climates; files in work/examples/data`)
} catch (e) { console.error(explain(e)); process.exit(1) }
