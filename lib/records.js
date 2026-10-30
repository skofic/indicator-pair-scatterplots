// Builders for this project's documents. Every stored property name is a dictionary term; the climate
// values nest under a source key (eutrees4f / worldclim / chelsa) inside `properties`, exactly as GeoService
// nests Chelsa / WorldClim values under period keys. Facts that have no descriptor (the original LAEA
// coordinates, source counts, the species table's flags) go under `_custom`, the dictionary's extension
// container that it stores as written and never reads.
import { GID, SOURCES } from '../config/indicators.js'

/** ScatterOccurrences document from an occurrence line and (optionally) climate lines keyed by source. */
export function occurrenceDoc(occ, climate = {}, datasetIds = []) {
  const doc = {
    _key: occ.key,
    geometry_point: { type: 'Point', coordinates: [occ.lon, occ.lat] },
    species_list: occ.species,
    std_dataset_ids: datasetIds,
    _custom: { x: occ.x, y: occ.y, sources: occ.sources, in_mask: occ.in_mask },
    properties: {},
  }
  const ids = new Set(datasetIds)
  for (const [src, line] of Object.entries(climate)) {
    if (!line || !line.values || !Object.keys(line.values).length) continue
    if (SOURCES[src]?.datasetKey) ids.add(SOURCES[src].datasetKey)
    const block = {}
    if (line.geometry_hash) block.geometry_hash = line.geometry_hash
    const scale = SOURCES[src]?.scale ?? {}
    for (const [ind, raw] of Object.entries(line.values ?? {})) {
      if (raw === null || raw === undefined) continue
      const gid = GID[ind]
      if (!gid) throw new Error(`no GID configured for indicator "${ind}"`)
      const v = raw * (scale[ind] ?? 1)
      block[gid] = Number.isInteger(v) ? v : Number(v.toFixed(4))
    }
    doc.properties[src] = block
  }
  doc.std_dataset_ids = [...ids]
  return doc
}

/** ScatterSpecies document from a species line (sources/species/build.js). */
export function speciesDoc(s) {
  const { _key, species, ...rest } = s
  return { _key, species, _custom: rest }
}

/** The GIDs an occurrence load may write, for the dictionary snapshot. */
export function occurrenceGids() {
  return ['geometry_point', 'species_list', 'std_dataset_ids', '_custom', 'geometry_hash', ...Object.values(GID)]
}
