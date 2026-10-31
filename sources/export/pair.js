// Export the data of one indicator pair as JSON files for the Phase 3 display examples (work/examples/data/):
//   base-<source>-<period>.json      [[x, y], ...] for every occurrence cell with a value
//   species-<name>-<source>-<period>.json   the species' cells
//   units-<name>.json                [{ id, species, restricted, present: [x,y], future: { <period>: [x,y] } }, ...] (CHELSA)
//   meta.json                        axes, sources, periods, counts
// Usage: node sources/export/pair.js [--pair P1] [--species "Fagus sylvatica"] [--source worldclim|chelsa] [--period 1970-2000]
import { writeFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { GID, PAIRS, SOURCES } from '../../config/indicators.js'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d }
const pair = PAIRS[arg('--pair', 'P1')], species = arg('--species', 'Fagus sylvatica')
const X = GID[pair.x], Y = GID[pair.y]
const slug = (s) => s.replace(/\s+/g, '_')
const path = (src, period) => period === SOURCES[src].period ? `d.properties.${src}["${period}"]` : `d.properties.${src}["${period}"]["${SOURCES[src].future.model}"]["${SOURCES[src].future.ssp}"]`
try {
  const { db, collections: C } = connect(loadCredentials())
  const q = (a, b = {}) => db.query(a, b, { batchSize: 10000 }).then((c) => c.all())
  const meta = { pair: { ...pair, x: X, y: Y }, species, base: {}, species_counts: {}, exported: new Date().toISOString() }
  for (const [src, period] of [['worldclim', '1970-2000'], ['chelsa', '1981-2010'], ['chelsa', '2041-2070'], ['chelsa', '2071-2100'], ['eutrees4f', '1961-1990']]) {
    const p = path(src, period)
    const base = await q(`FOR d IN @@c LET p = ${p} FILTER p.${X} != null AND p.${Y} != null RETURN [p.${X}, p.${Y}]`, { '@c': C.occurrences })
    writeFileSync(`work/examples/data/base-${src}-${period}.json`, JSON.stringify(base))
    const sp = await q(`FOR d IN @@c FILTER @s IN d.species_list LET p = ${p} FILTER p.${X} != null AND p.${Y} != null RETURN [p.${X}, p.${Y}]`, { '@c': C.occurrences, s: species })
    writeFileSync(`work/examples/data/species-${slug(species)}-${src}-${period}.json`, JSON.stringify(sp))
    meta.base[`${src}-${period}`] = base.length; meta.species_counts[`${src}-${period}`] = sp.length
    console.log(`${src} ${period}: base ${base.length}, ${species} ${sp.length}`)
  }
  const units = await q(`FOR d IN @@c FILTER @s IN d.species_list
    LET pres = d.properties.chelsa["1981-2010"], f1 = d.properties.chelsa["2041-2070"]["MPI-ESM1-2-HR"].ssp370, f2 = d.properties.chelsa["2071-2100"]["MPI-ESM1-2-HR"].ssp370
    RETURN { id: d.gcu_id_number, species: d.species_list, restricted: d["gcu_loc_coordinates-restriction"],
             present: [pres.${X}, pres.${Y}], future: { "2041-2070": [f1.${X}, f1.${Y}], "2071-2100": [f2.${X}, f2.${Y}] } }`, { '@c': C.units_scatter, s: species })
  writeFileSync(`work/examples/data/units-${slug(species)}.json`, JSON.stringify(units))
  meta.units = units.length
  // the map example: unrestricted units of the species as GeoJSON, the unit's polygon (UnitPolygons.geometry,
  // keyed by unit number) where it exists, the probe point otherwise
  const geo = await q(`FOR d IN @@c FILTER @s IN d.species_list AND d["gcu_loc_coordinates-restriction"] != true AND d.geometry_point != null
    LET poly = DOCUMENT(@@up, d.gcu_id_number)
    RETURN { type: "Feature", properties: { id: d.gcu_id_number, species: d.species_list, polygon: poly != null }, geometry: poly != null ? poly.geometry : d.geometry_point }`,
    { '@c': C.units_scatter, '@up': C.unitpoly, s: species })
  writeFileSync(`work/examples/data/units-geo-${slug(species)}.geojson`, JSON.stringify({ type: 'FeatureCollection', features: geo }))
  meta.units_geo = geo.length
  console.log(`units with geometry (unrestricted): ${geo.length}, with polygons ${geo.filter((f) => f.properties.polygon).length}`)
  writeFileSync('work/examples/data/meta.json', JSON.stringify(meta, null, 1))
  console.log(`units ${units.length}; meta written`)
} catch (e) { console.error(explain(e)); process.exit(1) }
