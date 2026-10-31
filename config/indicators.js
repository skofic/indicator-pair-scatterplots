// The indicator pairs, the climate sources and the dictionary GIDs the pipeline writes.
// Every stored property name must be a dictionary term. The seven derived indicators are REQUESTED
// (notes/2026-10-30-term-requests-derived-indicators.md); until the dictionary carries them, their
// values are computed into work files but refused by the loader's dictionary check.

export const GID = {
  bio01: 'env_climate_bio01',           // mean annual air temperature, °C
  bio12: 'env_climate_bio12',           // annual precipitation, mm
  bio14: 'env_climate_bio14',           // precipitation of the driest month, mm
  bio15: 'env_climate_bio15',           // precipitation seasonality (CV)
  tas: 'env_climate_tas',               // monthly mean air temperature (12), °C
  pr: 'env_climate_pr',                 // monthly precipitation (12), mm
  srad: 'env_climate_srad',             // monthly solar radiation (12), kJ m-2 day-1  (WorldClim only)
  // requested terms (provisional spelling)
  tas_summer: 'env_climate_tas_summer',
  pr_summer: 'env_climate_pr_summer',
  pr_winter: 'env_climate_pr_winter',
  continentality: 'env_climate_continentality',
  tas_coldest: 'env_climate_tas_coldest',
  srad_spring_summer: 'env_climate_srad_spring-summer',
  ai: 'env_climate_ai',                 // aridity index (CHELSA only), dimensionless
  pr_seasonality_ratio: 'env_climate_pr_seasonality-ratio',
}

/** Indicator pairs: x × y, by GID key. P1–P3 are the core set; P4–P5 need the 1 km sources. */
export const PAIRS = {
  P1: { x: 'bio01', y: 'bio12', title: 'Annual mean temperature × annual precipitation' },
  P2: { x: 'tas_summer', y: 'pr_summer', title: 'Summer temperature × summer precipitation' },
  P3: { x: 'continentality', y: 'pr_winter', title: 'Continentality × winter precipitation' },
  P4: { x: 'srad_spring_summer', y: 'tas_coldest', title: 'Spring-summer solar radiation × coldest-month temperature' },
  P5: { x: 'pr_seasonality_ratio', y: 'bio14', title: 'Precipitation seasonality × driest-month precipitation' },
}

/** Climate sources. `key` is the sub-object name in ScatterOccurrences / ScatterUnits / ScatterCells. */
export const SOURCES = {
  eutrees4f: {
    key: 'eutrees4f',
    title: 'EU-Trees4F historical predictors (WorldClim 1.4, 1961–1990, 5 arc-minutes)',
    period: '1961-1990',
    // Future: ensemble mean of the 11 EURO-CORDEX RCMs on the WorldClim 1.4 baseline, 3 periods × 2 RCPs
    future: { periods: ['1991-2020', '2021-2050', '2051-2080'], scenarios: ['rcp45', 'rcp85'] },
    dir: '/Users/milko/Local/Development/Workshop/EU-Trees4F/Reproducibility_scripts/datasets/climate/historical',
    // raster file → indicator key; scaling is read from the raster metadata and checked by sample.py
    rasters: { 'bio1.tif': 'bio01', 'bio12.tif': 'bio12', 'bio15.tif': 'bio15', 'temp10_summer.tif': 'tas_summer',
               'prec_summer.tif': 'pr_summer', 'prec_winter.tif': 'pr_winter', 'continentality.tif': 'continentality' },
    // Stored → physical. Established from the sampled statistics on 2026-10-30 (sample.py): bio1 and
    // temp10_summer are °C × 10 (means 86 and 168 over 250 k forest cells); prec_summer / prec_winter are
    // THREE-MONTH TOTALS in mm (means 190 and 192 ≈ 3 × 773/12), so ÷ 3 gives the mean monthly amount our
    // terms define; bio12 is mm/year, bio15 a CV in %, continentality already °C (float). To be confirmed
    // against Table S2 of Mauri et al. 2022 by Milko.
    scale: { bio01: 0.1, tas_summer: 0.1, pr_summer: 1 / 3, pr_winter: 1 / 3 },
  },
  worldclim: { key: 'worldclim', title: 'WorldClim 2.1 (1970–2000, 30 arc-seconds)', collection: 'worldclim', period: '1970-2000',
    datasetKey: 'bf102320-3726-48d1-b3fc-421f131c6666',          // the existing GeoService Dataset record
    annual: { bio01: 'env_climate_bio01', bio12: 'env_climate_bio12', bio14: 'env_climate_bio14', bio15: 'env_climate_bio15' },
    monthly: ['env_climate_tas', 'env_climate_pr', 'env_climate_srad'],
    // Future: CMIP6 MPI-ESM1-2-HR under SSP3-7.0, nested period → model → ssp as in the grid itself. Monthly
    // future layers are pr / tasmax / tasmin only, so the tas-derived indicators (summer T, continentality,
    // coldest-month T) are computed from tas ≈ (tasmax + tasmin) / 2 — an APPROXIMATION, stated in the
    // Dataset record; no radiation in the future periods.
    future: { periods: ['2021-2040', '2041-2060', '2061-2080', '2081-2100'], model: 'MPI-ESM1-2-HR', ssp: 'ssp370',
      annual: { bio01: 'env_climate_bio01', bio12: 'env_climate_bio12', bio14: 'env_climate_bio14', bio15: 'env_climate_bio15' },
      monthly: ['env_climate_tasmax', 'env_climate_tasmin', 'env_climate_pr'], tasApprox: true } },
  chelsa: { key: 'chelsa', title: 'CHELSA 2.1 (1981–2010, 30 arc-seconds)', collection: 'chelsa', period: '1981-2010',
    datasetKey: '4badf85d-270a-463c-89d3-04bc52d806bd',
    annual: { bio01: 'env_climate_bio01', bio12: 'env_climate_bio12', bio14: 'env_climate_bio14', bio15: 'env_climate_bio15', ai: 'env_climate_ai' },
    monthly: ['env_climate_tas', 'env_climate_pr'],
    // Future: same model / ssp; monthly tas and pr present, so every derived indicator except radiation; no `ai`.
    future: { periods: ['2011-2040', '2041-2070', '2071-2100'], model: 'MPI-ESM1-2-HR', ssp: 'ssp370',
      annual: { bio01: 'env_climate_bio01', bio12: 'env_climate_bio12', bio14: 'env_climate_bio14', bio15: 'env_climate_bio15' },
      monthly: ['env_climate_tas', 'env_climate_pr'] } },
}

export const EU_FOREST_CSV = '/Users/milko/Local/Backup/ArangoDB/data/EU-Forest_species.csv'
export const LAND_MASK = '/Users/milko/Local/Development/Git/Projects/Metadata/metadata-external-databases/data/forgenius-land-mask.geojson'
