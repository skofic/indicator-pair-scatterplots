// Step 7, part 3: the ScatterMaps manifest — one document per served map file (raster COG or GeoJSON), with the
// facts the map pane needs under _custom (source, layer, period, scenario, variant, path, crs, resolution,
// licence, citation) and `species` + std_dataset_ids as dictionary terms. Scans maps/eutrees4f, maps/atlas (once
// unzipped to maps/atlas/<rpp|mhs>/tif) and maps/chorology/geojson. Idempotent.
// Chorology GeoJSON is written with `ogr2ogr -f GeoJSON -t_srs EPSG:4326 -lco RFC7946=YES` — RFC 7946 form, no `crs`
// member: OpenLayers does not reproject features from a file that carries one (seen 2026-10-31).
// Usage: node sources/maps/manifest.js [--dry-run]
import { readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator } from '../../lib/dictionary.js'
import { md5 } from '../../lib/geometry.js'
import { ensureSchema } from '../../setup.js'
import { ensureDatasetRecords, datasetGids } from '../datasets/records.js'

const dryRun = process.argv.includes('--dry-run')
const files = (dir, ext) => existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`) : []
// gdalinfo takes ~0.3 s per file; results are cached by path + mtime in work/gdalinfo-cache.json.
import { readFileSync, writeFileSync } from 'node:fs'
const CACHE = 'work/gdalinfo-cache.json'
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
function gdalinfo(path) {
  const id = `${path}@${statSync(path).mtimeMs}`
  if (cache[id]) return cache[id]
  try {
    const j = JSON.parse(execFileSync('gdalinfo', ['-json', path], { encoding: 'utf8', maxBuffer: 64 << 20 }))
    const epsg = j.stac?.['proj:epsg'] ?? j.coordinateSystem?.wkt?.match(/ID\["EPSG",(\d+)\]\]$/)?.[1] ?? null
    cache[id] = { crs: epsg ? `EPSG:${epsg}` : null, resolution: j.geoTransform ? [Math.abs(j.geoTransform[1]), Math.abs(j.geoTransform[5])] : null, size: j.size, nodata: j.bands?.[0]?.noDataValue ?? null }
    return cache[id]
  } catch { return {} }
}
const SPECIES_RE = /^([A-Z][a-z]+)[_-]([a-z]+)/

export function manifestDocs(keys) {
  const docs = []
  // EU-Trees4F: <Species>_<ens>_[rcp]_<period>_<type>_<distrib>[_lu].tif
  for (const ens of ['ens_sdms', 'ens_clim']) for (const kind of ['prob', 'bin']) for (const f of files(`maps/eutrees4f/${ens}/${kind}`, '.tif')) {
    const b = f.split('/').pop().replace('.tif', ''); const parts = b.split('_')
    const species = `${parts[0]} ${parts[1]}`; const rest = parts.slice(2)
    const scenario = rest.find((p) => /^rcp\d+$/.test(p)) ?? null, period = rest.find((p) => /^(cur|fut)\d{4}$/.test(p)) ?? null
    const variant = rest.find((p) => ['pot', 'nat', 'disp'].includes(p)) ?? null, lu = rest.includes('lu')
    docs.push({ _key: md5(f), species, std_dataset_ids: [keys['SCATTER_MAPS'], keys['EU-TREES4F_MAPS_2022']].filter(Boolean),
      _custom: { source: 'eutrees4f', ensemble: rest[0], layer: kind === 'prob' ? 'suitability probability (0–1000)' : 'suitability binary', period, scenario, variant: variant + (lu ? '_lu' : ''), path: f, format: 'COG', ...gdalinfo(f), licence: 'CC0', citation: 'Mauri et al. 2022, doi:10.1038/s41597-022-01128-5' } })
  }
  // Atlas: maps/atlas/<rpp|mhs>/tif/<Genus-species>_<rpp|mhs>.tif  (after unzip)
  for (const kind of ['rpp', 'mhs']) for (const f of files(`maps/atlas/${kind}/tif`, '.tif')) {
    const m = f.split('/').pop().match(SPECIES_RE); const species = m ? `${m[1]} ${m[2]}` : f
    docs.push({ _key: md5(f), species, std_dataset_ids: [keys['SCATTER_MAPS'], keys[kind === 'rpp' ? 'ATLAS_RPP_2016' : 'ATLAS_MHS_2016']].filter(Boolean),
      _custom: { source: `atlas_${kind}`, layer: kind === 'rpp' ? 'relative probability of presence' : 'maximum habitat suitability', period: '2016', path: f, format: 'COG', ...gdalinfo(f), licence: 'European Commission reuse policy (Decision 2011/833/EU), CC BY 4.0', citation: 'de Rigo et al. 2016, European Atlas of Forest Tree Species; per-layer DOI in the JRC Data Catalogue' } })
  }
  // chorology: maps/chorology/geojson/<Genus>_<species>[_<subsp>][_syn]_<plg|pnt>.geojson
  for (const f of files('maps/chorology/geojson', '.geojson')) {
    const b = f.split('/').pop().replace('.geojson', ''); const parts = b.split('_')
    const geom = parts.pop(); const syn = parts[parts.length - 1] === 'syn' && parts.pop()
    const species = `${parts[0]} ${parts[1]}`; const subspecies = parts.length > 2 ? parts.slice(2).join(' ') : null
    docs.push({ _key: md5(f), species, std_dataset_ids: [keys['SCATTER_MAPS'], keys['ATLAS_CHOROLOGY_2017']].filter(Boolean),
      _custom: { source: 'atlas_chorology', layer: syn ? 'introduced / synanthropic occurrences' : geom === 'plg' ? 'native range (polygons)' : 'isolated populations (points)', subspecies, geometry: geom === 'plg' ? 'Polygon' : 'Point', path: f, format: 'GeoJSON', crs: 'EPSG:4326', size_bytes: statSync(f).size, licence: 'CC BY 4.0', citation: 'Caudullo, Welk & San-Miguel-Ayanz 2017, doi:10.1016/j.dib.2017.05.007' } })
  }
  return docs
}

if (process.argv[1].endsWith('manifest.js')) try {
  const creds = loadCredentials()
  // 1. dataset keys (one short-lived connection)
  const first = connect(creds, { requireLoadTarget: !dryRun })
  const { dictionary, missing } = await loadDictionary([...datasetGids(), 'species', 'std_dataset_ids', '_custom'], creds)
  const keys = await ensureDatasetRecords(first.db, first.collections.dataset, { write: !dryRun, dictionary, missing })
  // 2. the file scan. When it took ten minutes (gdalinfo on 2 449 files, before the cache) the server closed
  //    the idle keep-alive socket and the import failed with EPIPE — and a NEW arangojs Database did not help,
  //    because arangojs 9 goes through Node's global fetch, whose pool handed back the same stale socket. The
  //    cache keeps the scan to seconds, which is the actual fix; the second connect below is kept as hygiene.
  const docs = manifestDocs(keys)
  writeFileSync(CACHE, JSON.stringify(cache))
  // 3. the write
  const { db, collections } = connect(creds, { requireLoadTarget: !dryRun })
  const report = validator.createReport()
  for (const d of docs) { const r = validator.validateByDictionary(d.species, 'species', dictionary); report.add(r, { gid: 'species' }); if (r.errors.length) throw new Error(`bad species ${d.species}`) }
  const by = {}; for (const d of docs) by[d._custom.source] = (by[d._custom.source] ?? 0) + 1
  console.log('manifest:', by, 'dataset keys:', keys)
  if (!dryRun) {
    await ensureSchema(db, collections)
    for (let i = 0; i < docs.length; i += 200) await db.collection(collections.maps).import(docs.slice(i, i + 200), { onDuplicate: 'replace' })
    console.log(`${collections.maps}: ${docs.length} imported, now ${await db.query('RETURN LENGTH(@@c)', { '@c': collections.maps }).then((c) => c.next())} documents`)
  }
  console.log(report.format())
} catch (e) { console.error(explain(e)); if (process.env.DEBUG) console.error(e.stack, e.cause?.stack); process.exit(1) }
