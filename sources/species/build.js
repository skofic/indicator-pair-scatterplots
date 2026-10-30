// Step 1 of the collection plan: the ScatterSpecies table as JSONL (work/species.jsonl).
//
// One row per taxon named by any source: EU-Forest (counts of occurrence rows and cells), EU-Trees4F
// (67 species), the Atlas RPP (39 taxa) and MHS (27 taxa) rasters, and — when work/unit-species.json
// exists (written by sources/units/species.js from GeoService.Units) — the EUFGIS target species.
// Synonyms (data/species-aliases.json) are folded into the accepted name; the alias is kept in `aliases`.
//
// Key = MD5 of the accepted scientific name: stable, and a UPOV code can be added later as a property
// with a unique index without re-keying anything (decision 2026-10-30).
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { md5 } from '../../lib/geometry.js'
import { EU_FOREST_CSV } from '../../config/indicators.js'

const aliases = JSON.parse(readFileSync('data/species-aliases.json', 'utf8'))
delete aliases._comment
const accepted = (n) => aliases[n] ?? n
const list = (f) => readFileSync(f, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)

const rows = new Map()
const row = (name) => {
  const a = accepted(name)
  if (!rows.has(a)) rows.set(a, { species: a, aliases: new Set(), rank: a.endsWith(' sp') ? 'genus' : 'species',
    euforest_rows: 0, euforest_cells: 0, eutrees4f: false, atlas_rpp: false, atlas_mhs: false, eufgis_target: null })
  if (a !== name) rows.get(a).aliases.add(name)
  return rows.get(a)
}

// EU-Forest: rows and cells per species
const cellsBySpecies = new Map()
const rl = createInterface({ input: createReadStream(EU_FOREST_CSV) })
let header = null
for await (const line of rl) {
  if (!header) { header = line.split(','); continue }
  const f = line.split(',')
  const name = f[header.indexOf('SPECIES NAME')]
  const r = row(name); r.euforest_rows += 1
  const cell = `${f[0]},${f[1]}`
  if (!cellsBySpecies.has(r.species)) cellsBySpecies.set(r.species, new Set())
  cellsBySpecies.get(r.species).add(cell)
}
for (const [s, cells] of cellsBySpecies) rows.get(s).euforest_cells = cells.size

for (const n of list('data/eutrees4f-species.txt')) row(n).eutrees4f = true
for (const n of list('data/atlas-rpp-taxa.txt')) row(n).atlas_rpp = true
for (const n of list('data/atlas-mhs-taxa.txt')) row(n).atlas_mhs = true

let unitSpecies = null
if (existsSync('work/unit-species.json')) {
  unitSpecies = JSON.parse(readFileSync('work/unit-species.json', 'utf8')) // { "<name>": <unit count> }
  for (const r of rows.values()) r.eufgis_target = 0
  for (const [n, count] of Object.entries(unitSpecies)) row(n).eufgis_target = count
}

const out = [...rows.values()].sort((a, b) => a.species.localeCompare(b.species))
  .map((r) => ({ _key: md5(r.species), ...r, aliases: [...r.aliases].sort() }))
writeFileSync('work/species.jsonl', out.map((r) => JSON.stringify(r)).join('\n') + '\n')
const n = (p) => out.filter(p).length
console.log(`work/species.jsonl: ${out.length} taxa | EU-Forest ${n((r) => r.euforest_rows)} | EU-Trees4F ${n((r) => r.eutrees4f)} ` +
  `| Atlas RPP ${n((r) => r.atlas_rpp)} MHS ${n((r) => r.atlas_mhs)} | with aliases ${n((r) => r.aliases.length)} ` +
  `| EUFGIS target ${unitSpecies ? n((r) => r.eufgis_target > 0) : 'n/a (no work/unit-species.json yet)'}`)
