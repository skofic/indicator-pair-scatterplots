// Grid-cell geometry and keys, computed OFFLINE, reproducing the convention of GeoService's Chelsa and
// WorldClim collections: a cell is the square (lon ± r, lat ± r) with r = 1/240 for a 30″ grid, the ring
// SW→SE→NE→NW→SW, and _key = LOWER(MD5(<compact GeoJSON polygon>)). Verified by metadata-external-databases
// (lib/geometry.js) 500/500 against the live Chelsa collection on 2026-07-20 — for grid cells only, whose
// coordinates are exact multiples of the cell step, so JSON.stringify and ArangoDB's TO_STRING agree.
// Never use this on arbitrary geometry (69 % of GCU polygons would hash differently).
import { createHash } from 'node:crypto'

/** Half-cell radius of the 30 arc-second grids. */
export const RADIUS_30S = 1 / 240

export function cellPolygon(lon, lat, radius) {
  return {
    type: 'Polygon',
    coordinates: [[
      [lon - radius, lat - radius], [lon + radius, lat - radius],
      [lon + radius, lat + radius], [lon - radius, lat + radius],
      [lon - radius, lat - radius],
    ]],
  }
}

export function cellPoint(lon, lat) {
  return { type: 'Point', coordinates: [lon, lat] }
}

export function geometryHash(polygon) {
  return createHash('md5').update(JSON.stringify(polygon)).digest('hex')
}

/**
 * Centre of the 30″ cell containing (lon, lat), on the global grid whose cell edges sit at multiples of
 * 1/120° from (−180, −90), ROUNDED TO SIX DECIMALS exactly as the WorldClim and CHELSA extractors store it
 * (`round(float(lon), 6)` in extract_worldclim.py / extract_chelsa.py); the loaders then build the square
 * from that rounded centre, so the hash of cellPolygon(rounded centre) is the stored _key. Verified against
 * both live collections on 2026-10-30 (sources/climate/geoservice/probe.js).
 */
export function containingCellCentre(lon, lat, radius = RADIUS_30S) {
  const step = 2 * radius
  const i = Math.floor((lon + 180) / step)
  const j = Math.floor((lat + 90) / step)
  return [Number((-180 + (i + 0.5) * step).toFixed(6)), Number((-90 + (j + 0.5) * step).toFixed(6))]
}

/** The stored _key of the 30″ cell containing (lon, lat). */
export function containingCellKey(lon, lat, radius = RADIUS_30S) {
  const [clon, clat] = containingCellCentre(lon, lat, radius)
  return geometryHash(cellPolygon(clon, clat, radius))
}

/** MD5 of an arbitrary string, lowercase hex — used for the stable surrogate keys of our own records. */
export function md5(s) {
  return createHash('md5').update(s).digest('hex')
}
