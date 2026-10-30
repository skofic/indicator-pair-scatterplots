# Term requests to `metadata-store`: seven derived climate indicators

From: `indicator-pair-scatterplots` (Milko, with Claude), 2026-10-30. Identifiers reviewed by Milko on
2026-10-30: namespaces are the existing terms `env_climate`, `env_climate_tas`, `env_climate_pr` and
`env_climate_srad`; local identifiers with two words use a hyphen, never an underscore.

All seven are **derived from the monthly layers** already in `GeoService` (`env_climate_tas`,
`env_climate_pr`, `env_climate_srad`) or from the EU-Trees4F predictor rasters, computed by this
project at load time (`sources/climate/geoservice/lookup.js`), and stored in the `ScatterCells`,
`ScatterOccurrences` and `ScatterUnits` collections under the climate-source sub-objects, never in the
`WorldClim` or `Chelsa` collections. `_domn` as the other climate descriptors (`_class_quantity`,
`chr_envi`, `chr_subject_stand`, `_term_role_descriptor`); `_decimals` 2 (a display hint; values are
stored at full precision); `_data._scalar._number_float`.

## The terms

| `_nid` | `_lid` | `_gid` | Title |
|---|---|---|---|
| `env_climate_tas` | `summer` | `env_climate_tas_summer` | Summer mean air temperature |
| `env_climate_pr` | `summer` | `env_climate_pr_summer` | Summer monthly precipitation |
| `env_climate_pr` | `winter` | `env_climate_pr_winter` | Winter monthly precipitation |
| `env_climate` | `continentality` | `env_climate_continentality` | Continentality |
| `env_climate_tas` | `coldest` | `env_climate_tas_coldest` | Mean air temperature of the coldest month |
| `env_climate_srad` | `spring-summer` | `env_climate_srad_spring-summer` | Spring-summer solar radiation |
| `env_climate_pr` | `seasonality-ratio` | `env_climate_pr_seasonality-ratio` | Precipitation seasonality, wettest-driest ratio |

### `env_climate_tas_summer`
- **Definition:** Mean of the June, July and August monthly mean air temperatures.
- **Description:** The mean of the three summer months' mean air temperature at 2 m, computed from the twelve monthly means of `env_climate_tas`. One of the nine predictors of EU-Trees4F (`Ts`, the second most important), where it was computed from WorldClim 1.4; here from WorldClim 2.1 and CHELSA 2.1. Characterises growing-season warmth and summer heat stress.
- **Unit:** `unit_Temperature_deg-C`. **Valid range:** the unit's physical bound. **Normal range:** −5 … 35.
- **Reference:** Mauri et al. 2022, doi:10.1038/s41597-022-01128-5, Table S2.

### `env_climate_pr_summer`
- **Definition:** Mean of the June, July and August monthly precipitation amounts.
- **Description:** The mean monthly precipitation of the three summer months, from the twelve monthly values of `env_climate_pr`. EU-Trees4F predictor `Ps` (summer precipitation), there stored as the three-month total; this term holds the monthly mean (total ÷ 3) so that it is directly comparable with `env_climate_pr`. Captures summer drought.
- **Unit:** the unit of `env_climate_pr` (`unit_MassFluxDensity_kg-per-m2-per-month`, 1 kg m⁻² = 1 mm). **Valid range:** ≥ 0. **Normal range:** 0 … 400.
- **Reference:** Mauri et al. 2022, Table S2.

### `env_climate_pr_winter`
- **Definition:** Mean of the December, January and February monthly precipitation amounts.
- **Description:** As `env_climate_pr_summer`, for the three winter months (December of the same climatological year, January, February). EU-Trees4F predictor `Pw`. Separates oceanic winter-wet climates from continental winter-dry ones; the second axis of the GCU climate space in FORGENIUS D4.7.
- **Unit:** as `env_climate_pr`. **Valid range:** ≥ 0. **Normal range:** 0 … 600.
- **Reference:** Mauri et al. 2022, Table S2.

### `env_climate_continentality`
- **Definition:** Mean air temperature of the warmest month minus mean air temperature of the coldest month.
- **Description:** The annual range of the monthly mean air temperature, the `envirem` definition of continentality (Title & Bemmels 2018), computed from the twelve monthly values of `env_climate_tas`. Differs from BIO7, which is the range between the warmest month's mean daily maximum and the coldest month's mean daily minimum. EU-Trees4F predictor `Ci`, the third most important; the dominant axis of the GCU climate space after temperature in FORGENIUS D4.7.
- **Unit:** `unit_Temperature_deg-C` (a temperature difference). **Valid range:** ≥ 0. **Normal range:** 0 … 45.
- **References:** Title P.O., Bemmels J.B. (2018) ENVIREM, Ecography 41:291–307, doi:10.1111/ecog.02880; Mauri et al. 2022.

### `env_climate_tas_coldest`
- **Definition:** The lowest of the twelve monthly mean air temperatures.
- **Description:** The mean air temperature of the coldest month, from the twelve monthly values of `env_climate_tas`. Not BIO6 (`env_climate_bio06`), which is the lowest monthly mean daily *minimum* temperature and is therefore several degrees lower. The y axis of the second autoecology diagram of the European Atlas of Forest Tree Species (winter cold limit of a species).
- **Unit:** `unit_Temperature_deg-C`. **Valid range:** the unit's physical bound. **Normal range:** −40 … 25.
- **Reference:** de Rigo et al. 2016, European Atlas of Forest Tree Species, modelling chapter, https://w3id.org/mtv/FISE-Comm/v01/e01aa69.

### `env_climate_srad_spring-summer`
- **Definition:** Sum of the March to August incoming shortwave solar radiation at the surface.
- **Description:** The solar energy received per square metre over the six months from March to August, computed from the monthly mean daily totals of `env_climate_srad` (kJ m⁻² day⁻¹) as Σ(monthly value × days in the month) ÷ 3 600, in kWh m⁻². This is *actual* radiation, including the effect of cloud cover, available from WorldClim 2.1 only (CHELSA holds annual statistics of radiation, not monthly values).
- **`_issues`:** The European Atlas of Forest Tree Species plots *potential* spring-summer irradiation computed from a digital elevation model with GRASS r.sun under a clear sky, a topographic quantity. This descriptor holds actual surface radiation from the climate grids, a climatic quantity that includes cloud cover; values are not comparable with the Atlas axis (decision of 2026-10-30 to substitute rather than recompute).
- **Unit:** `unit_Irradiance_kWh-per-m2`. **Valid range:** ≥ 0. **Normal range:** 400 … 1 600.
- **Reference:** de Rigo et al. 2016 (the Atlas axis being substituted); Fick & Hijmans 2017 for `srad`.

### `env_climate_pr_seasonality-ratio`
- **Definition:** Precipitation of the wettest month minus precipitation of the driest month, divided by the precipitation of the wettest month.
- **Description:** A dimensionless measure of how unevenly precipitation is spread over the year, between 0 (every month equal) and 1 (a completely dry month), computed from the twelve monthly values of `env_climate_pr`. This is the definition used by the autoecology diagrams of the European Atlas of Forest Tree Species ("seasonal variation of monthly precipitation"). Not BIO15 (`env_climate_bio15`), the coefficient of variation of the monthly totals in percent.
- **Unit:** `unit_Dimensionless_1`. **Valid range:** 0 … 1. **Normal range:** 0 … 1.
- **Reference:** de Rigo et al. 2016, European Atlas of Forest Tree Species, modelling chapter.

## After creation

Tell this project the final `_gid`s if any spelling changes. The three loaders are then re-run
(`occurrences/load.js`, `climate/geoservice/load_cells.js`, `units/load.js`), which fills the seven
properties in from the work files, and `datasets/records.js --write --update` completes the
`EU-TREES4F_PREDICTORS_2022` Dataset record's `std_terms` with the four it currently lacks.

References
- de Rigo D., Caudullo G., Houston Durrant T., San-Miguel-Ayanz J. (2016). The European Atlas of
  Forest Tree Species: modelling, data and information on forest tree species. In: European Atlas of
  Forest Tree Species, Publ. Off. EU, pp. e01aa69+. https://w3id.org/mtv/FISE-Comm/v01/e01aa69
- Mauri A. et al. (2022). EU-Trees4F, a dataset on the future distribution of European tree species.
  Scientific Data 9:37. doi:10.1038/s41597-022-01128-5
- Title P.O., Bemmels J.B. (2018). ENVIREM: an expanded set of bioclimatic and topographic variables
  increases flexibility and improves performance of ecological niche modeling. Ecography 41:291–307.
  doi:10.1111/ecog.02880
- Fick S.E., Hijmans R.J. (2017). WorldClim 2: new 1 km spatial resolution climate surfaces for global
  land areas. International Journal of Climatology 37:4302–4315. doi:10.1002/joc.5086
