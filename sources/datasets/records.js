// The Dataset records this project registers in GeoService.Dataset, in the `std_dataset` target shape
// (metadata-store, 2026-10-24): top-level std_dataset_code / dates / count / _info, std_dataset_domn,
// std_dataset_prop. Inserted WITHOUT a key (the collection assigns a short one); looked up by code.
// Usage: node sources/datasets/records.js [--write]   (without --write: validate and show what would be inserted)
import { connect, loadCredentials, explain } from '../../lib/db.js'
import { loadDictionary, validator } from '../../lib/dictionary.js'
import { GID } from '../../config/indicators.js'

const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const eng = (s) => ({ ISO_639_3_eng: s })

export const RECORDS = [
  {
    std_dataset_code: 'EU-FOREST_2017',
    std_date_submission: today, std_date_start: '2005', std_date_end: '2005',
    _info: {
      _title: eng('EU-Forest, a high-resolution tree occurrence dataset for Europe'),
      _description: eng('Tree species occurrences from 21 National Forest Inventories, Forest Focus and BioSoil, harmonised to the centroids of the INSPIRE 1 km grid (ETRS89-LAEA, EPSG:3035): 588 983 occurrences of 242 species in 249 410 plots. Presence-only; survey years are not published (inventories up to the 2008 JRC framework contract, recorded around 2005). Used here as the base and species layers of the indicator pair scatterplots, aggregated to 250 569 cells in ScatterOccurrences.'),
      _references: {
        _citation: ['Mauri, A., Strona, G., San-Miguel-Ayanz, J. (2017). EU-Forest, a high-resolution tree occurrence dataset for Europe. *Scientific Data* 4:160123. doi: [10.1038/sdata.2016.123](https://doi.org/10.1038/sdata.2016.123)'],
        _url: ['[EU-Forest on figshare (CC0)](https://doi.org/10.6084/m9.figshare.c.3288407)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterOccurrences'], std_terms: ['species_list', 'geometry_point'], std_terms_key: ['geometry_point'] },
  },
  {
    std_dataset_code: 'EU-TREES4F_PREDICTORS_2022',
    std_date_submission: today, std_date_start: '1961', std_date_end: '2080',
    _info: {
      _title: eng('EU-Trees4F climate predictors, historical and future (WorldClim 1.4 baseline, EURO-CORDEX ensemble, 5 arc-minutes)'),
      _description: eng('The seven climate layers EU-Trees4F used to calibrate and project its species distribution models: mean annual temperature, annual precipitation, precipitation seasonality, summer temperature, summer and winter precipitation, continentality. Historical: WorldClim 1.4, 1961–1990. Future: the ensemble mean of 11 EURO-CORDEX regional climate models, change-factor downscaled onto the same baseline, for 1991–2020, 2021–2050 and 2051–2080 under RCP 4.5 and RCP 8.5 — the exact climate behind the EU-Trees4F suitability maps. 5 arc-minutes (~10 km), WGS84. Sampled at every EU-Forest cell and every unit probe point into properties.eutrees4f.<period>[.<rcp>] of ScatterOccurrences and ScatterUnits. Stored values are converted to physical units (temperatures ÷ 10; seasonal precipitation totals ÷ 3 to the mean monthly amount).'),
      _references: {
        _citation: ['Mauri, A., Girardello, M., Strona, G., Beck, P.S.A., Forzieri, G., Caudullo, G., Manca, F., Cescatti, A. (2022). EU-Trees4F, a dataset on the future distribution of European tree species. *Scientific Data* 9:37. doi: [10.1038/s41597-022-01128-5](https://doi.org/10.1038/s41597-022-01128-5)'],
        _url: ['[EU-Trees4F on figshare (CC0)](https://doi.org/10.6084/m9.figshare.c.5525688)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterOccurrences'], std_terms: [GID.bio01, GID.bio12, GID.bio15, GID.tas_summer, GID.pr_summer, GID.pr_winter, GID.continentality], std_terms_key: ['geometry_point'] },
  },
]

/** Every GID the Dataset records refer to, so the dictionary snapshot can validate them (term keys included). */
export function datasetGids() {
  const g = new Set(['std_dataset'])
  for (const r of RECORDS) for (const k of ['std_terms', 'std_terms_key']) for (const t of r.std_dataset_prop?.[k] ?? []) g.add(t)
  return [...g]
}

/**
 * Insert the records that do not exist yet (looked up by code) and return { code: _key }.
 * `missing` = GIDs the dictionary does not know yet (the requested derived terms): they are removed from the
 * record's std_terms before validation and insertion, and the record is completed when the terms land
 * (re-run with --update once they exist).
 */
RECORDS.push(
  {
    std_dataset_code: 'EU-TREES4F_MAPS_2022',
    std_date_submission: today, std_date_start: '2005', std_date_end: '2095',
    _info: {
      _title: eng('EU-Trees4F species distribution maps (current and future suitability, 5 arc-minutes)'),
      _description: eng('Ensemble species distribution model outputs of EU-Trees4F for 67 European tree species: climatic suitability as probability (WGS84, 5 arc-minutes, 0–1000) and as binary presence (ETRS89-LAEA 10 km INSPIRE grid), for the current period (centred on 2005) and three future periods (2035, 2065, 2095) under RCP 4.5 and RCP 8.5; potential (pot), realised within the native range (nat), natural dispersal (disp) and forest land-use clipped (lu) variants; SDM ensemble (ens-sdms) and climatic ensemble (ens-clim). Served as cloud-optimised GeoTIFF files listed in ScatterMaps. Known defect of the published files: the natural-dispersal binary rasters carry no coordinate reference system; they sit on the 10 km INSPIRE EPSG:3035 grid of the potential ones, cropped by whole cells (verified), and the served copies have the CRS assigned.'),
      _references: {
        _citation: ['Mauri, A., Girardello, M., Strona, G., Beck, P.S.A., Forzieri, G., Caudullo, G., Manca, F., Cescatti, A. (2022). EU-Trees4F, a dataset on the future distribution of European tree species. *Scientific Data* 9:37. doi: [10.1038/s41597-022-01128-5](https://doi.org/10.1038/s41597-022-01128-5)'],
        _url: ['[EU-Trees4F on figshare (CC0)](https://doi.org/10.6084/m9.figshare.c.5525688)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterMaps'], std_terms: ['species'], std_terms_key: ['species'] },
  },
  {
    std_dataset_code: 'ATLAS_CHOROLOGY_2017',
    std_date_submission: today, std_date_start: '2016', std_date_end: '2016',
    _info: {
      _title: eng('Chorological maps for the main European woody species'),
      _description: eng('Expert-drawn native and introduced ranges of the main European tree and shrub species (polygons for contiguous areas, points for isolated populations and synanthropic occurrences), compiled for the European Atlas of Forest Tree Species from Meusel & Jäger, Hultén & Fries, the Atlas Florae Europaeae, EUFORGEN and other sources. 145 taxa, 238 layers. Served as GeoJSON (WGS84) listed in ScatterMaps as the range outline of the map pane.'),
      _references: {
        _citation: ['Caudullo, G., Welk, E., San-Miguel-Ayanz, J. (2017). Chorological maps for the main European woody species. *Data in Brief* 12:662–666. doi: [10.1016/j.dib.2017.05.007](https://doi.org/10.1016/j.dib.2017.05.007)'],
        _url: ['[Chorological maps on Mendeley Data (CC BY 4.0)](https://data.mendeley.com/datasets/hr5h2hcgg4)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_shape' },
    std_dataset_prop: { _collection_list: ['ScatterMaps'], std_terms: ['species'], std_terms_key: ['species'] },
  },
  {
    std_dataset_code: 'ATLAS_RPP_2016',
    std_date_submission: today, std_date_start: '2016', std_date_end: '2016',
    _info: {
      _title: eng('European Atlas of Forest Tree Species: relative probability of presence (C-SMFA), 1 km'),
      _description: eng('Modelled relative probability of presence of 39 tree taxa at 1 km (constrained spatial multi-frequency analysis of harmonised forest plot data, land-cover constrained), from the European Atlas of Forest Tree Species (JRC, 2016). The default species map layer. Reuse under the European Commission reuse policy (Decision 2011/833/EU, CC BY 4.0); each layer has its own JRC Data Catalogue DOI, recorded in ScatterMaps. Served as cloud-optimised GeoTIFF.'),
      _references: {
        _citation: ['de Rigo, D., Caudullo, G., Houston Durrant, T., San-Miguel-Ayanz, J. (2016). The European Atlas of Forest Tree Species: modelling, data and information on forest tree species. In: San-Miguel-Ayanz, J. et al. (eds.), European Atlas of Forest Tree Species. Publ. Off. EU, Luxembourg, pp. e01aa69+. [w3id.org/mtv/FISE-Comm/v01/e01aa69](https://w3id.org/mtv/FISE-Comm/v01/e01aa69)'],
        _url: ['[Atlas data and metadata](https://forest.jrc.ec.europa.eu/en/european-atlas/atlas-data-and-metadata/)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterMaps'], std_terms: ['species'], std_terms_key: ['species'] },
  },
  {
    std_dataset_code: 'ATLAS_MHS_2016',
    std_date_submission: today, std_date_start: '2016', std_date_end: '2016',
    _info: {
      _title: eng('European Atlas of Forest Tree Species: maximum habitat suitability (RDS-MHS), 1 km'),
      _description: eng('Modelled maximum habitat suitability of 27 tree taxa at 1 km (relative distance similarity of each cell\u2019s bioclimate to the bioclimate of the plots where the taxon occurs; WorldClim 1.4 and GMTED2010 covariates), from the European Atlas of Forest Tree Species (JRC, 2016). Reuse under the European Commission reuse policy (CC BY 4.0); per-layer JRC Data Catalogue DOIs in ScatterMaps. Served as cloud-optimised GeoTIFF.'),
      _references: {
        _citation: ['de Rigo, D., Caudullo, G., Houston Durrant, T., San-Miguel-Ayanz, J. (2016). The European Atlas of Forest Tree Species: modelling, data and information on forest tree species. In: San-Miguel-Ayanz, J. et al. (eds.), European Atlas of Forest Tree Species. Publ. Off. EU, Luxembourg, pp. e01aa69+. [w3id.org/mtv/FISE-Comm/v01/e01aa69](https://w3id.org/mtv/FISE-Comm/v01/e01aa69)'],
        _url: ['[Atlas data and metadata](https://forest.jrc.ec.europa.eu/en/european-atlas/atlas-data-and-metadata/)'],
      },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterMaps'], std_terms: ['species'], std_terms_key: ['species'] },
  },
)

const SCATTER_TERMS = () => Object.values(GID)
RECORDS.push(
  {
    std_dataset_code: 'SCATTER_OCCURRENCES',
    std_date_submission: today, std_date_start: '1961', std_date_end: '2100',
    _info: {
      _title: eng('Indicator pair scatterplots: EU-Forest occurrence cells with present and future climate'),
      _description: eng('One document per EU-Forest 1 km cell (250 569): the species observed there, the cell centroid, and the indicator values of the three climate sources side by side under properties.<source>.<period>: EU-Trees4F predictors (1961–1990; 1991–2020, 2021–2050, 2051–2080 under RCP 4.5 / 8.5 at 10 km), WorldClim 2.1 (1970–2000; 2021–2100 in four periods under MPI-ESM1-2-HR SSP3-7.0 at 1 km) and CHELSA 2.1 (1981–2010; 2011–2100 in three periods, same model and scenario, 1 km). Annual and monthly-derived indicators (summer / winter means, continentality, coldest-month temperature, spring-summer radiation, seasonality ratio) at full precision. Caveats: WorldClim future monthly layers carry only daily extremes, so its future temperature-derived indicators use tas ≈ (tasmax + tasmin) / 2; radiation exists for the WorldClim historical period only; 1 715 cells outside the project land mask have no 1 km climate. The base and species layers of the scatterplots (European Atlas of Forest Tree Species autoecology definition).'),
      _references: { _url: ['[indicator-pair-scatterplots on GitHub](https://github.com/skofic/indicator-pair-scatterplots)'] },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterOccurrences', 'ScatterCells'], std_terms: ['species_list', 'geometry_point', 'geometry_hash', ...SCATTER_TERMS()], std_terms_key: ['geometry_point'] },
  },
  {
    std_dataset_code: 'SCATTER_UNITS',
    std_date_submission: today, std_date_start: '1961', std_date_end: '2100',
    _info: {
      _title: eng('Indicator pair scatterplots: gene conservation units in present and future climate'),
      _description: eng('One document per EUFGIS gene conservation unit (3 669) at its climate reference point, with the unit number, its target species, the coordinate-restriction flag and the same per-source, per-period indicator blocks as ScatterOccurrences. Restricted units carry climate values only: no point and no cell reference. Rebuilt from GeoService.Units by a refresh command; the top layer of the scatterplots, the layer the visualisation exists for.'),
      _references: { _url: ['[indicator-pair-scatterplots on GitHub](https://github.com/skofic/indicator-pair-scatterplots)'] },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_gcu', std_dataset_scope: 'std_dataset_scope_shape' },
    std_dataset_prop: { _collection_list: ['ScatterUnits'], std_terms: ['gcu_id_number', 'species_list', 'gcu_loc_coordinates-restriction', 'geometry_point', 'geometry_hash', ...SCATTER_TERMS()], std_terms_key: ['gcu_id_number'] },
  },
  {
    std_dataset_code: 'SCATTER_SPECIES',
    std_date_submission: today, std_date_start: '2016', std_date_end: '2026',
    _info: {
      _title: eng('Indicator pair scatterplots: species table'),
      _description: eng('The catalogue of taxa named by any source of the scatterplots and maps (271): the scientific name as identifier (a surrogate key allows UPOV codes to be added later without re-keying), synonyms folded in, and per taxon the EU-Forest occurrence counts and the availability of EU-Trees4F maps, Atlas presence and suitability maps and EUFGIS target-species units. A catalogue, not spatial data: extent and scope are those of the data it indexes.'),
      _references: { _url: ['[indicator-pair-scatterplots on GitHub](https://github.com/skofic/indicator-pair-scatterplots)'] },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterSpecies'], std_terms: ['species'], std_terms_key: ['species'] },
  },
  {
    std_dataset_code: 'SCATTER_MAPS',
    std_date_submission: today, std_date_start: '2005', std_date_end: '2095',
    _info: {
      _title: eng('Indicator pair scatterplots: map layer manifest'),
      _description: eng('One document per served map file: EU-Trees4F suitability rasters (SDM ensemble, current and future, cloud-optimised GeoTIFF), European Atlas of Forest Tree Species relative probability of presence and maximum habitat suitability rasters (1 km, EPSG:3035), and the Atlas chorology polygons (GeoJSON), with species, source, period, scenario, variant, file path, projection, resolution, licence and citation. A catalogue of files, not spatial data itself.'),
      _references: { _url: ['[indicator-pair-scatterplots on GitHub](https://github.com/skofic/indicator-pair-scatterplots)'] },
    },
    std_dataset_domn: { std_dataset_extent: 'std_dataset_extent_region', std_dataset_scope: 'std_dataset_scope_grid' },
    std_dataset_prop: { _collection_list: ['ScatterMaps'], std_terms: ['species'], std_terms_key: ['species'] },
  },
)

export async function ensureDatasetRecords(db, datasetCollection, { write = false, dictionary = null, missing = [], update = false } = {}) {
  const coll = db.collection(datasetCollection)
  const keys = {}
  for (const original of RECORDS) {
    const rec = structuredClone(original)
    const dropped = (rec.std_dataset_prop.std_terms ?? []).filter((g) => missing.includes(g))
    if (dropped.length) {
      rec.std_dataset_prop.std_terms = rec.std_dataset_prop.std_terms.filter((g) => !missing.includes(g))
      console.log(`  ${rec.std_dataset_code}: std_terms without ${dropped.join(', ')} (not in the dictionary yet)`)
    }
    if (dictionary) {
      // the schema requires _key, which the collection assigns at insertion: validate with a placeholder
      const r = validator.validateByDictionary({ _key: 'pending', ...rec }, 'std_dataset', dictionary, { strict: false })
      if (r.errors.length) throw new Error(`Dataset record ${rec.std_dataset_code} invalid: ${JSON.stringify(r.errors.slice(0, 3))}`)
      if (r.warnings.length) console.warn(`  ${rec.std_dataset_code}: ${r.warnings.length} warning(s), e.g. ${r.warnings[0].code} ${r.warnings[0].path}`)
    }
    const found = await db.query('FOR d IN @@c FILTER d.std_dataset_code == @code RETURN d._key', { '@c': datasetCollection, code: rec.std_dataset_code }).then((c) => c.all())
    if (found.length) {
      keys[rec.std_dataset_code] = found[0]
      if (update && write) { await coll.update(found[0], { _info: rec._info, std_dataset_domn: rec.std_dataset_domn, std_dataset_prop: rec.std_dataset_prop }); console.log(`  ${rec.std_dataset_code}: updated`) }
      continue
    }
    if (!write) { keys[rec.std_dataset_code] = null; continue }
    const ins = await coll.save(rec)
    keys[rec.std_dataset_code] = ins._key
  }
  return keys
}

if (process.argv[1].endsWith('records.js')) {
  try {
    const write = process.argv.includes('--write')
    const update = process.argv.includes('--update')
    const creds = loadCredentials()
    const { db, collections } = connect(creds, { requireLoadTarget: write })
    const { dictionary, missing } = await loadDictionary(datasetGids(), creds)
    if (missing.includes('std_dataset')) throw new Error('dictionary lacks std_dataset')
    const keys = await ensureDatasetRecords(db, collections.dataset, { write, dictionary, missing, update })
    console.log(write ? 'Dataset records:' : 'Dataset records (dry run, nothing written):', keys)
  } catch (err) { console.error(explain(err)); process.exit(1) }
}
