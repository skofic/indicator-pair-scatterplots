# Term requests to `metadata-store`: seven derived climate indicators

From: `indicator-pair-scatterplots` (Milko, with Claude), 2026-10-30. Follows §D of
`notes/2026-10-30-handoff-metadata-store-climate-terms.md`; the pair set is now final (Data Plan,
2026-10-30), so these are **requests**, not a heads-up.

All seven are **derived from the monthly layers** already in `GeoService` (`env_climate_tas`,
`env_climate_pr`, `env_climate_srad`) or from the EU-Trees4F predictor rasters, computed by this
project at load time. Namespace `env_climate`; `_domn` as the other climate descriptors
(`_class_quantity`, `chr_envi`, `chr_subject_stand`, `_term_role_descriptor`); `_decimals` 2. The
`_lid`s below are proposals; the dictionary owner chooses the final spelling.

| Proposed `_gid` | Title | Definition | Unit | Valid range | Reference |
|---|---|---|---|---|---|
| `env_climate_tas_summer` | Summer mean air temperature | Mean of the June, July and August monthly mean air temperatures. | `unit_Temperature_deg-C` | ≥ −273.15 (unit bound) | EU-Trees4F `Ts` (Mauri et al. 2022, Table S2) |
| `env_climate_pr_summer` | Summer monthly precipitation | Mean of the June, July and August monthly precipitation amounts. | same as `env_climate_pr` | ≥ 0 | EU-Trees4F `Ps` |
| `env_climate_pr_winter` | Winter monthly precipitation | Mean of the December, January and February monthly precipitation amounts. | same as `env_climate_pr` | ≥ 0 | EU-Trees4F `Pw` |
| `env_climate_continentality` | Continentality | Mean air temperature of the warmest month minus mean air temperature of the coldest month. | `unit_Temperature_deg-C` (a difference) | ≥ 0 | `envirem` definition (Title & Bemmels 2018, doi:10.1111/ecog.02880), used by EU-Trees4F `Ci` |
| `env_climate_tas_coldest` | Mean air temperature of the coldest month | The lowest of the twelve monthly mean air temperatures. Not BIO6, which is the lowest monthly mean daily *minimum*. | `unit_Temperature_deg-C` | unit bound | European Atlas of Forest Tree Species autoecology diagrams (de Rigo et al. 2016) |
| `env_climate_srad_spring_summer` | Spring-summer solar radiation | Sum of the March to August monthly incoming shortwave solar radiation at the surface (actual radiation, including cloud cover). Replaces the Atlas's DEM-derived *potential* irradiation; see `_issues`. | `unit_Irradiance_kWh-per-m2` (the Atlas unit; WorldClim `srad` is kJ m⁻² day⁻¹, converted as Σ(monthly mean daily value × days in month) / 3 600) | ≥ 0 | Atlas autoecology diagrams; decision 2026-10-30 to substitute actual for potential radiation |
| `env_climate_pr_seasonality_ratio` | Precipitation seasonality, wettest-driest ratio | (precipitation of the wettest month − precipitation of the driest month) / precipitation of the wettest month. Dimensionless, 0–1. Not BIO15, which is a coefficient of variation. | `unit_Dimensionless_1` or `unit_Percent_pct` if expressed ×100 | 0–1 | Atlas autoecology diagrams (de Rigo et al. 2016) |

Suggested `_issues` text for `env_climate_srad_spring_summer`: *"The European Atlas of Forest Tree
Species plots potential spring-summer irradiation computed from a digital elevation model with GRASS
r.sun under a clear sky. This descriptor holds actual surface radiation from the climate grids,
which includes cloud cover and is a climatic, not a topographic, quantity; values are not comparable
with the Atlas axis."*

Where each will be stored: in the `ScatterCells`, `ScatterOccurrences` and `ScatterUnits`
collections of `GeoService` (Data Plan §5), under the climate-source sub-objects, never in the
`WorldClim` or `Chelsa` collections themselves.

References
- de Rigo D., Caudullo G., Houston Durrant T., San-Miguel-Ayanz J. (2016). The European Atlas of
  Forest Tree Species: modelling, data and information on forest tree species. In: European Atlas of
  Forest Tree Species, Publ. Off. EU, pp. e01aa69+. https://w3id.org/mtv/FISE-Comm/v01/e01aa69
- Mauri A. et al. (2022). EU-Trees4F, a dataset on the future distribution of European tree species.
  Scientific Data 9:37. doi:10.1038/s41597-022-01128-5
- Title P.O., Bemmels J.B. (2018). ENVIREM: an expanded set of bioclimatic and topographic variables
  increases flexibility and improves performance of ecological niche modeling. Ecography 41:291–307.
  doi:10.1111/ecog.02880
