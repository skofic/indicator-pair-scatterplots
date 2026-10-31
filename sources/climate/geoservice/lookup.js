// Steps 4–5 of the collection plan: WorldClim 2.1 / CHELSA 2.1 values for every occurrence cell, by key.
//
// For each occurrence the containing 30″ cell key is derived offline (lib/geometry.js, verified 500/500 against
// both collections on 2026-10-30), the unique keys are read in batches with DOCUMENT(), projecting only the
// period's annual indicators and the monthly tas / pr (/ srad) arrays, and the seven derived indicators are
// computed here:
//   tas_summer = mean(tas Jun–Aug)   pr_summer = mean(pr Jun–Aug)   pr_winter = mean(pr Dec, Jan, Feb)
//   continentality = max(tas) − min(tas)   tas_coldest = min(tas)
//   srad_spring_summer = Σ Mar–Aug (srad kJ m⁻² day⁻¹ × days in month) / 3600  → kWh m⁻²   (WorldClim only)
//   pr_seasonality_ratio = (max(pr) − min(pr)) / max(pr)
// Outputs: work/cells-<source>.jsonl (one line per cell: the ScatterCells cache) and work/climate-<source>.jsonl
// (one line per occurrence: {key, geometry_hash, values}), the input of sources/occurrences/load.js.
// Usage: node sources/climate/geoservice/lookup.js --source worldclim|chelsa [--batch 1000] [--limit N]
import { createReadStream, createWriteStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { connect, loadCredentials, explain } from '../../../lib/db.js'
import { containingCellKey } from '../../../lib/geometry.js'
import { SOURCES } from '../../../config/indicators.js'

const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const r4 = (v) => Number(v.toFixed(4))

export function derive(S, annual, monthly) {
  const m = (gid) => monthly.map((x) => x[gid])
  const ok = (a) => a.length === 12 && a.every((v) => typeof v === 'number')
  let tas = m('env_climate_tas'); const pr = m('env_climate_pr')
  if (!ok(tas) && S.tasApprox) { const mx = m('env_climate_tasmax'), mn = m('env_climate_tasmin'); if (ok(mx) && ok(mn)) tas = mx.map((v, i) => (v + mn[i]) / 2) }
  const out = {}
  for (const [ind, gid] of Object.entries(S.annual)) if (typeof annual?.[gid] === 'number') out[ind] = annual[gid]
  if (ok(tas)) {
    out.tas_summer = r4((tas[5] + tas[6] + tas[7]) / 3)
    out.continentality = r4(Math.max(...tas) - Math.min(...tas))
    out.tas_coldest = Math.min(...tas)
  }
  if (ok(pr)) {
    out.pr_summer = r4((pr[5] + pr[6] + pr[7]) / 3)
    out.pr_winter = r4((pr[11] + pr[0] + pr[1]) / 3)
    const mx = Math.max(...pr), mn = Math.min(...pr)
    out.pr_seasonality_ratio = mx > 0 ? r4((mx - mn) / mx) : 0
  }
  if (S.monthly.includes('env_climate_srad')) {
    const srad = m('env_climate_srad')
    if (ok(srad)) out.srad_spring_summer = r4(srad.slice(2, 8).reduce((s, v, i) => s + v * DAYS[i + 2], 0) / 3600)
  }
  return out
}

/** Read the cells `keys` from the source's collection and derive the indicators: Map key → values. */
/**
 * The source descriptor for a period: the historical one (S itself) or S.future with the period's path.
 * `path` = the AQL expression that reaches the period's values inside `d.properties`.
 */
export function periodSource(S, period) {
  if (!period || period === S.period) return { ...S, period: S.period, path: 'd.properties[@period]', bind: { period: S.period } }
  if (!S.future?.periods?.includes(period)) throw new Error(`${S.key} has no period ${period}`)
  return { ...S, ...S.future, period, path: 'd.properties[@period][@model][@ssp]', bind: { period, model: S.future.model, ssp: S.future.ssp } }
}

export async function fetchCells(db, coll, S, keys, { batch = 1000, onProgress = null, period = null } = {}) {
  const P = periodSource(S, period)
  const monthlyFields = P.monthly.map((g) => `${g}: x.${g}`).join(', ')
  const annualFields = Object.values(P.annual).map((g) => `${g}: p.${g}`).join(', ')
  const aql = `FOR k IN @keys LET d = DOCUMENT(@@c, k) FILTER d != null LET p = ${P.path} FILTER p != null
    RETURN { k, annual: { ${annualFields} }, monthly: (FOR x IN p.std_date_span_month SORT x.std_month RETURN { ${monthlyFields} }) }`
  const cells = new Map()
  for (let i = 0; i < keys.length; i += batch) {
    const rows = await db.query(aql, { '@c': coll, keys: keys.slice(i, i + batch), ...P.bind }, { batchSize: batch }).then((c) => c.all())
    for (const r of rows) cells.set(r.k, derive(P, r.annual, r.monthly))
    if (onProgress) onProgress(Math.min(i + batch, keys.length), keys.length)
  }
  return cells
}

if (process.argv[1].endsWith('lookup.js')) try {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d }
  const source = arg('--source'); const BATCH = Number(arg('--batch', 1000)); const LIMIT = Number(arg('--limit', Infinity))
  const period = arg('--period', null)
  if (!SOURCES[source]?.collection) throw new Error('--source worldclim|chelsa [--period <future period>]')
  const S = SOURCES[source]
  const suffix = period && period !== S.period ? `-${period}` : ''
  const t0 = Date.now()
  const creds = loadCredentials(); const { db, collections } = connect(creds)
  const coll = collections[S.collection]
  const occ = []
  for await (const line of createInterface({ input: createReadStream('work/occurrences.jsonl') })) if (line.trim() && occ.length < LIMIT) occ.push(JSON.parse(line))
  const keyOf = new Map(occ.map((o) => [o.key, containingCellKey(o.lon, o.lat)]))
  const cellKeys = [...new Set(keyOf.values())]
  console.log(`${source}${suffix}: ${occ.length} occurrences → ${cellKeys.length} distinct cells`)

  const cells = await fetchCells(db, coll, S, cellKeys, { period, batch: BATCH, onProgress: (n, N) => { if (n % (BATCH * 25) === 0) console.log(`  ${n} / ${N} cells, ${Math.round((Date.now() - t0) / 1000)} s`) } })
  const outCells = createWriteStream(`work/cells-${source}${suffix}.jsonl`)
  for (const [k, values] of cells) outCells.write(JSON.stringify({ key: k, values }) + '\n')
  outCells.end()
  const outOcc = createWriteStream(`work/climate-${source}${suffix}.jsonl`)
  let missing = 0
  for (const o of occ) { const k = keyOf.get(o.key); const v = cells.get(k); if (!v) missing++; outOcc.write(JSON.stringify({ key: o.key, geometry_hash: k, values: v ?? {} }) + '\n') }
  outOcc.end()
  const stat = (ind) => {
    let n = 0, mn = Infinity, mx = -Infinity, sum = 0
    for (const v of cells.values()) { const x = v[ind]; if (typeof x === 'number') { n++; sum += x; if (x < mn) mn = x; if (x > mx) mx = x } }
    return n ? `${ind} n=${n} min=${mn} max=${mx} mean=${(sum / n).toFixed(2)}` : `${ind} none`
  }
  for (const ind of ['bio01', 'bio12', 'bio14', 'bio15', 'ai', 'tas_summer', 'pr_summer', 'pr_winter', 'continentality', 'tas_coldest', 'srad_spring_summer', 'pr_seasonality_ratio']) console.log('  ' + stat(ind))
  console.log(`cells found ${cells.size}/${cellKeys.length}; occurrences without a cell ${missing}; ${Math.round((Date.now() - t0) / 1000)} s`)
} catch (e) { console.error(explain(e)); process.exit(1) }
