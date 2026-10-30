// Verify the offline cell-key derivation against the live WorldClim and Chelsa collections before any batch
// lookup relies on it: for a random sample of occurrences, compute the containing cell's key, read the document
// by key, check that its geometry_point is the centre we computed, and for a smaller subset compare with the
// GEO_INTERSECTS query the Foxx /click route uses. Also prints the shape of one document per collection.
// Usage: node sources/climate/geoservice/probe.js [--sample 500] [--geo 25]
import { readFileSync } from 'node:fs'
import { connect, loadCredentials, explain } from '../../../lib/db.js'
import { containingCellCentre, containingCellKey } from '../../../lib/geometry.js'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? Number(process.argv[i + 1]) : d }
const SAMPLE = arg('--sample', 500), GEO = arg('--geo', 25)

try {
  const creds = loadCredentials(); const { db, collections: C } = connect(creds)
  const occ = readFileSync('work/occurrences.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((o) => o.in_mask)
  let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
  const sample = Array.from({ length: SAMPLE }, () => occ[Math.floor(rnd() * occ.length)])

  for (const coll of [C.worldclim, C.chelsa]) {
    console.log(`\n=== ${coll} ===`)
    const one = (await db.query('FOR d IN @@c LIMIT 1 RETURN d', { '@c': coll }).then((c) => c.all()))[0]
    const desc = (o, depth = 0) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? `array[${v.length}]${v.length && typeof v[0] === 'object' ? ' of ' + JSON.stringify(Object.keys(v[0]).slice(0, 8)) : ''}` : (v && typeof v === 'object' && depth < 2) ? desc(v, depth + 1) : typeof v]))
    console.log('document shape:', JSON.stringify(desc(one)).slice(0, 1500))
    console.log('geometry_point sample:', JSON.stringify(one.geometry_point), 'bounds[0][0]:', JSON.stringify(one.geometry_bounds.coordinates[0][0]))

    const keys = sample.map((o) => containingCellKey(o.lon, o.lat))
    const docs = await db.query('FOR k IN @keys LET d = DOCUMENT(@@c, k) RETURN d == null ? null : { k: d._key, p: d.geometry_point.coordinates }', { '@c': coll, keys }).then((c) => c.all())
    let found = 0, centreOk = 0
    docs.forEach((d, i) => { if (!d) return; found++; const [clon, clat] = containingCellCentre(sample[i].lon, sample[i].lat); if (Math.abs(d.p[0] - clon) < 1e-9 && Math.abs(d.p[1] - clat) < 1e-9) centreOk++ })
    console.log(`key lookup: ${found}/${SAMPLE} found, ${centreOk} with the computed centre`)
    let geoAgree = 0, geoFound = 0
    for (let i = 0; i < Math.min(GEO, SAMPLE); i++) {
      const r = await db.query('FOR d IN @@c FILTER GEO_INTERSECTS(GEO_POINT(@lon, @lat), d.geometry_bounds) RETURN d._key', { '@c': coll, lon: sample[i].lon, lat: sample[i].lat }).then((c) => c.all())
      if (r.length) { geoFound++; if (r.includes(keys[i])) geoAgree++ }
    }
    console.log(`geo query: ${geoFound}/${GEO} found, ${geoAgree} agree with the offline key`)
    const miss = sample.map((o, i) => (docs[i] ? null : o)).filter(Boolean).slice(0, 3)
    if (miss.length) console.log('not found, e.g.:', miss.map((o) => `${o.lon},${o.lat} (${o.species[0]})`).join(' | '))
  }
} catch (e) { console.error(explain(e)); process.exit(1) }
