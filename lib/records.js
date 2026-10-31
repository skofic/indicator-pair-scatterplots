// Builders for this project's documents. Every stored property name is a dictionary term; the climate
// values nest under properties.<source>.<period>[.<model>.<ssp> | .<rcp>].<gid>, exactly as GeoService nests
// the Chelsa / WorldClim values under period → model → ssp. Facts that have no descriptor (the original LAEA
// coordinates, source counts, the species table's flags) go under `_custom`, the dictionary's extension
// container that it stores as written and never reads.
import { GID, SOURCES } from '../config/indicators.js'

const r4 = (v) => (Number.isInteger(v) ? v : Number(v.toFixed(4)))

/**
 * Map an indicator tree (keys = indicator short names at the leaves, period / model / scenario keys above)
 * to a GID tree, applying the source's raster scaling. Null leaves are dropped.
 */
export function toGids(src, tree) {
  const scale = SOURCES[src]?.scale ?? {}
  const out = {}
  for (const [k, v] of Object.entries(tree ?? {})) {
    if (v === null || v === undefined) continue
    if (GID[k]) out[GID[k]] = r4(v * (scale[k] ?? 1))
    else if (typeof v === 'object') { const sub = toGids(src, v); if (Object.keys(sub).length) out[k] = sub }
    else throw new Error(`no GID configured for indicator "${k}" (${src})`)
  }
  return out
}

/**
 * ScatterOccurrences document. `climate` = { <source>: { geometry_hash?, periods: { <period>: <indicator tree> } } }
 * where a period's tree is flat for the historical period and nested (rcp | model → ssp) for future ones.
 * `sourceKeys` = { <source>: Dataset _key } for sources whose record key is assigned at insert (EU-Trees4F).
 */
export function occurrenceDoc(occ, climate = {}, datasetIds = [], sourceKeys = {}) {
  const doc = {
    _key: occ.key,
    geometry_point: { type: 'Point', coordinates: [occ.lon, occ.lat] },
    species_list: occ.species,
    std_dataset_ids: [],
    _custom: { x: occ.x, y: occ.y, sources: occ.sources, in_mask: occ.in_mask },
    properties: {},
  }
  const ids = new Set(datasetIds)
  for (const [src, c] of Object.entries(climate)) {
    const block = climateBlock(src, c)
    if (!block) continue
    doc.properties[src] = block
    const k = sourceKeys[src] ?? SOURCES[src]?.datasetKey   // a source's Dataset key: static for the grids, assigned at insert for EU-Trees4F
    if (k) ids.add(k)
  }
  doc.std_dataset_ids = [...ids]
  return doc
}

/** One source block: { geometry_hash?, <period>: {...} }, or null when it holds no value. */
export function climateBlock(src, c) {
  if (!c) return null
  const block = {}
  if (c.geometry_hash) block.geometry_hash = c.geometry_hash
  let any = false
  for (const [period, tree] of Object.entries(c.periods ?? {})) {
    const g = toGids(src, tree)
    if (Object.keys(g).length) { block[period] = g; any = true }
  }
  return any ? block : null
}

/** ScatterSpecies document from a species line (sources/species/build.js). */
export function speciesDoc(s) {
  const { _key, species, ...rest } = s
  return { _key, species, _custom: rest }
}

/** The GIDs a climate-bearing load may write, for the dictionary snapshot. */
export function occurrenceGids() {
  return ['geometry_point', 'species_list', 'std_dataset_ids', '_custom', 'geometry_hash', ...Object.values(GID)]
}

/** Wrap a grid's future-period values into the model → ssp nesting GeoService uses. */
export function nestFuture(src, period, values) {
  const S = SOURCES[src]
  if (!S.future) return values
  if (S.future.model) return { [S.future.model]: { [S.future.ssp]: values } }
  return values // EU-Trees4F: already { rcp45: {...}, rcp85: {...} }
}
