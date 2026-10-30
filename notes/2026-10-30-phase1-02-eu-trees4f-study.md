# Phase 1, item 2 — EU-Trees4F study

Date: 2026-10-30. Status: **complete; the decisions in section 6 were confirmed by Milko the same day**, together with the decision not to reproduce the suitability model (see the decisions log in `CLAUDE.md`).

Questions from the brief: (2.1) how were occurrences joined with environmental data, so it can be
replicated with WorldClim 2.1 / CHELSA; (2.2) how were the continuous colour maps obtained;
(2.3) which indicator pairs make scientific sense for the scatterplots.

**Reference.** Mauri A., Girardello M., Strona G., Beck P.S.A., Forzieri G., Caudullo G., Manca F.,
Cescatti A. (2022). *EU-Trees4F, a dataset on the future distribution of European tree species.*
Scientific Data 9:37. doi:10.1038/s41597-022-01128-5 (Europe PMC PMC8813948). Data and scripts:
figshare collection doi:10.6084/m9.figshare.c.5525688 (v2, 2022-08-10). Local copy:
`/Users/milko/Local/Development/Workshop/EU-Trees4F` (dataset, paper PDF, reproducibility scripts
and their input datasets, FORGENIUS deliverable D4.7). Sources read on 2026-10-30: the paper full
text, `EU-Tree4F_readme.txt`, `version_history.txt`, the three R scripts, the `datasets` folder, and
the D4.7 deliverable (converted from `.docx`).

---

## 1. What EU-Trees4F is

Current and future **climatic suitability** maps for **67 tree species** (`datasets/species_list.txt`),
three future periods (centred 2035, 2065, 2095) × two scenarios (RCP 4.5, RCP 8.5), produced with an
ensemble of species distribution models (SDMs) trained on EU-Forest occurrences. Everything is at
**5 arc-minutes (~10 km)**. It is a FORGENIUS output (JRC, grant 862221) and was already used inside
FORGENIUS for GCUs (section 5).

## 2. Item 2.1 — how occurrences were joined with environmental data

### Occurrences
- EU-Forest, complemented with ICP Forests intensive-monitoring plots and, for Poland, occurrences
  from Zając et al. Tree species only (single stem, defined crown), plus *Corylus avellana*; aliens
  excluded except *Robinia pseudoacacia*; species with < 30 occurrences dropped.
- **Trimmed by native range**: occurrences outside the species' chorology polygon (Caudullo et al.
  2017; Euro+Med PlantBase at country level where no chorology exists) were removed, to drop planted
  populations that survive but do not reproduce (the paper's example: *Quercus ilex* in Scotland).
  Result: 67 species, 589 862 occurrences.
- Local files: `datasets/species_occurrences/all/<Species>.csv`, columns `LON,LAT` (WGS84), 67 species
  plus two stray files (`Alnus_cordata.csv`, `Pistacia_lentiscus (copy).csv`). The paper's
  `p_ICP`, `p_Poland` and `input_sdm` sub-folders are **not** in the local copy. Counts exceed EU-Forest
  for the same species, e.g. *Fagus sylvatica* 37 001 vs 35 862, *Abies alba* 10 031 vs 9 383, and
  strikingly *Quercus ilex* 53 071 vs 22 661; the extra points are the ICP / Poland additions and
  possibly other sources not detailed in the paper. **These files are not a subset of EU-Forest.**

### Thinning (for model training only)
1. Duplicates of a species within the same 5′ cell removed: the script snaps every point to the
   centre of the predictor-raster cell it falls in (`cellFromXY` → unique cells → `xyFromCell`).
2. One random occurrence per 40 × 40 km tile (`datasets/r_list.rds` holds the tiles).
Result: 50 453 training presences for all species. Plus 10 000 pseudo-absences per species drawn
outside a surface-range-envelope of the climatic predictors (`PA.strategy = 'sre'`).

### The join itself
The "join" is a plain raster lookup: `extract(predictor_stack, points)` on the 5′ grid, after the
points have been moved to cell centres. There is no interpolation, buffering or averaging. **This is
exactly what the GeoService `/chelsa/click` and `/worldclim/click` routes do at 30″**, so replicating
the join with WorldClim 2.1 or CHELSA 2.1 is a change of grid, not of method.

### Environmental predictors
Nine were retained after collinearity tests (four dropped: coldest-month mean temperature, GDD5,
winter temperature, humidity index α):

| Code | Predictor | Local file (`datasets/climate/historical`) | Importance (Table 1, 1−r) |
|---|---|---|---|
| Mat | mean annual temperature (bio1) | `bio1.tif` | 0.55 |
| Ts | summer temperature | `temp10_summer.tif` | 0.49 |
| Ci | continentality (envirem) | `continentality.tif` | 0.46 |
| Ps | summer precipitation (mm/month) | `prec_summer.tif` | 0.35 |
| Ptot | annual precipitation (bio12) | `bio12.tif` | 0.28 |
| Pw | winter precipitation (mm/month) | `prec_winter.tif` | 0.25 |
| pH | topsoil pH (SoilGrids, 1 km → 5′) | `soil/ph_eu.tif` | 0.21 |
| Occ | topsoil organic carbon (SoilGrids) | `soil/occ_eu.tif` | 0.17 |
| Pse | precipitation seasonality (bio15) | `bio15.tif` | 0.13 |

Grid: WGS84 (EPSG:4326), 0.0833° (5′), 1128 × 540 cells (verified with `gdalinfo`). **Current
climate = WorldClim 1.4 at 5′; the paper states the 1961–1990 period** (chosen to match the climate
under which the inventoried trees established). Continentality, GDD5 and α were computed with the
R `envirem` package. Future climate: 11 EURO-CORDEX regional models, change-factor downscaled to 5′
(additive for temperature, multiplicative for precipitation, bilinear interpolation of anomalies
added to the WorldClim 1.4 baseline), plus their ensemble mean (`datasets/climate/future/ensemble`,
periods 1991-2020, 2021-2050, 2051-2080).

## 3. Item 2.2 — how the continuous maps were obtained

Pipeline per species (`1_EU-Trees4F_sdm_present_future.R`, 1 096 lines, biomod2 on R 3.6.3):

1. Six SDM algorithms (GLM, GAM, GBM, MARS, MaxEnt with product/threshold/hinge off, RF), block
   cross-validation, prevalence 0.5, evaluated with TSS; mean TSS 0.74.
2. **Consensus model** = mean of the algorithms with TSS > 0.7, projected as a probability scaled to
   0–1000; binarised with the TSS-optimal threshold.
3. **MESS mask** (multivariate environmental similarity): cells whose climate is outside the range of
   the training points are set to no-data, to avoid extrapolation.
4. **Realised vs potential**: the binary map masked by the chorology polygon = `nat`; unmasked = `pot`.
5. Future: either project the consensus on the RCM ensemble mean (`ens-clim`) or project on each of
   the 11 RCMs and average the 11 binaries, keeping cells with ≥ 8 valid models (`ens-sdms`, with
   standard deviation).
6. **Dispersal** (`2_…` and `3_…` scripts, MigClim): 30-year steps, negative-exponential kernel from
   species mean dispersal distances (`datasets/MDD4migclim_CA.csv`), 30 replicates → `disp`.
7. **Land-use clip** (`lu`): forest fraction ≥ 40 % from a global land-use projection (Chen et al.
   2020, SSP2 for RCP 4.5), `datasets/landuse/derived`.

Published layers (local `EU-Trees4F_dataset`): `ens_clim/bin` 1 742 files, `ens_clim/prob` 469,
`ens_sdms/bin` 1 742, `ens_sdms/prob` 469, `ens_sdms/std` 402, `single_models` per species
(bin / prob / cv). **Probability layers are WGS84 5′ Int16 (0–1000, no-data −32768); binary layers are
ETRS89-LAEA (EPSG:3035) on the INSPIRE 10 km grid** (v2 change). Naming:
`<Species>_<ens-clim|ens-sdms|RCM>_[rcp45|rcp85]_<cur2005|fut2035|fut2065|fut2095>_<bin|prob|std|cv>_<pot|nat|disp>[_lu].tif`.

So the "continuous colour map" is the **consensus probability surface of an SDM ensemble**, a
statistical model of climatic suitability, not a density of observations. It is a third kind of map
next to the Atlas RPP (observed presence frequency) and MHS (climate similarity). Reproducing it
means re-running biomod2: feasible with the scripts and a new predictor set, but by the decision of
2026-10-29 we serve the published rasters instead.

**The paper's Figure 1** (our `notes/scatterplot-example.png.webp`) is also worth decoding: grey =
all (mean annual temperature, annual precipitation) combinations of the 5′ cells, present and future,
for all 67 species; coloured bins = cells classified from the current and 2095 binary maps as stable
(yellow), decolonised (red) or newly suitable (blue); arrows = climate change per bin. It is a
**cell-based diagram of modelled suitability**, whereas the Atlas autoecology diagram is a
**plot-based diagram of observations**. Ours follows the Atlas; a "future suitability" overlay in the
style of Figure 1 is a possible later layer, since the binary rasters for it are on disk.

## 4. Item 2.3 — indicator pairs

Three sources of evidence for which variables matter:

- **Atlas autoecology diagrams** (peer-reviewed template, item 1): (bio1 × bio12), (coldest-month
  mean temperature × spring-summer solar radiation), (precipitation seasonality × driest-month
  precipitation).
- **EU-Trees4F variable importance** (Table 1): Mat 0.55 > Ts 0.49 > Ci 0.46 > Ps 0.35 > Ptot 0.28 >
  Pw 0.25 > pH 0.21 > Occ 0.17 > Pse 0.13. Soil ranks low; precipitation seasonality is last.
- **FORGENIUS D4.7** (section 5): a PCA of the nine EU-Trees4F variables over the GCUs explains 84 %
  of variance with two axes; axis 1 = mean annual temperature (+) and summer precipitation (−),
  axis 2 = continentality (+) and winter precipitation (−).

Availability of each axis per climate source (WC = WorldClim, CH = CHELSA, as loaded in GeoService:
WorldClim 2.1 has bio01–19 plus monthly `tas/tasmin/tasmax/pr/srad/vapr/wind` and elevation; CHELSA
2.1 has bio01–19 plus annual aggregates incl. `rsds_{min,mean,max}`, `gdd5`, `gsl`, `cmi`, `pet` and
monthly sections; to be confirmed in item 3):

| # | Pair (x × y) | Why | EU-Trees4F 5′ | WC 2.1 | CH 2.1 |
|---|---|---|---|---|---|
| P1 | mean annual temperature × annual precipitation | Atlas pair 1; EU-Trees4F Fig. 1; top SDM predictor | `bio1`, `bio12` | bio01, bio12 | bio01, bio12 |
| P2 | summer temperature × summer precipitation | 2nd and 4th SDM predictors; D4.7 PCA axis 1; drought stress | `temp10_summer`, `prec_summer` | mean of Jun–Aug monthly `tas` and `pr` | same from monthly |
| P3 | continentality × winter precipitation | 3rd SDM predictor; D4.7 PCA axis 2 | `continentality`, `prec_winter` | envirem definition (warmest-month minus coldest-month mean temperature) from monthly `tas`; Dec–Feb `pr` | same |
| P4 | coldest-month mean temperature × spring-summer solar radiation (**renamed**, actual radiation, decision 2026-10-30) | Atlas pair 2 | — | min of monthly `tas`; Mar–Aug sum of `srad` | from monthly `tas`; `rsds` |
| P5 | precipitation seasonality × driest-month precipitation | Atlas pair 3 (Atlas defines seasonality as (P_wettest − P_driest)/P_wettest; bio15 is a coefficient of variation) | `bio15` only | bio15 or Atlas definition from monthly `pr`; bio14 | same |

**Recommendation**: P1–P3 as the core set. They are the three strongest axes by SDM importance and by
the GCU-level PCA, and all three are computable from the EU-Trees4F historical layers, so the
"EU-Trees4F first" run covers the whole core set. P4 and P5 come with the switch to WorldClim 2.1 /
CHELSA 2.1. Pair definitions live in configuration, as in v1, so the set can change without code
changes.

## 5. FORGENIUS D4.7 — prior use of EU-Trees4F for GCUs

The deliverable *"FORGENIUS – D4.7"* (local `FORGENIUS - D4.7[35].docx`) already combined EU-Trees4F
with the GCU polygons: (i) a **climatic marginality index** per GCU = distance, in the 2-D PCA space
of the nine EU-Trees4F variables, from the GCU to the edge of the species' kernel-density niche;
(ii) a **climate suitability trend** per GCU and species from the current, 2035, 2065 and 2095
suitability scores; (iii) MODIS NDVI / NDWI trends 2003–2021. Only single-species GCUs could be
matched: **1 706 GCUs, 42 species**. Results: 84 % of GCUs sit in currently suitable climate, 57 % of
those are projected to decline; Mediterranean GCUs decline, central Europe and northern Scandinavia
improve. Annex A2 (a shapefile of the per-GCU indicators) is referenced but not in the local copy.

Why it matters here: it is the scientific precedent for putting **GCUs into the species' climate
space**, which is our top layer; it confirms which climate axes separate GCUs (P2, P3); and the
42-species intersection is a first estimate of the species coverage the Data Plan must verify.

## 6. Decisions (confirmed 2026-10-30)

1. **Join method** = containing-cell lookup at the native resolution of the climate grid (5′ for
   EU-Trees4F, 30″ for WorldClim 2.1 / CHELSA 2.1), occurrence coordinates reprojected from
   EPSG:3035 to WGS84 as v1 did. **No thinning**: thinning served model training, not the diagram.
2. **Species layer source = EU-Forest only**, not the EU-Trees4F occurrence files. The Atlas diagram
   needs species ⊂ base, and the EU-Trees4F files contain points that are not in EU-Forest (up to
   2.3× more for *Quercus ilex*) of undocumented origin. Chorology trimming is noted as an option, not
   applied by default.
3. **Core indicator pairs P1–P3**, P4–P5 added with the 1 km sources (section 4).
4. **Future-suitability overlay** (EU-Trees4F Figure 1 style) recorded as an optional later layer,
   not in scope now.

## 7. Answers to the Phase 1 questions, as they stand after items 1 and 2

- *Can WorldClim 1.4 be substituted?* For the scatterplots, yes, by a grid change in the lookup. For
  the maps, no substitution is needed because we serve published rasters.
- *Can we build a system fed with environmental data that generates both products?* Scatterplots:
  yes, that is the pipeline. Maps: only by re-running the SDM ensemble, which is out of scope by
  decision.
- *Can the existing EU-Trees4F data be used for maps and scatterplots?* Maps: yes (decided). The
  scatterplot climate axes: yes for P1–P3 at 10 km, as the first run.
