# CLAUDE.md

Authoritative context for working in **`indicator-pair-scatterplots`**. Read this first in every
session. The original brief is [`notes/Indicator Pair Scatterplots.md`](notes/Indicator%20Pair%20Scatterplots.md);
this file is the **living plan** derived from it and is amended as decisions are reached.

---

## 1. What this project is

This repository is built for the **[EUFGIS](http://www.eufgis.org)** portal (the European forest
gene conservation unit information system) within the
**[FORGENIUS](https://www.forgenius.eu)** project.

> **Mission:** build a database of tree species observations and environmental data, and use it to
> generate **tree species distribution maps** and **indicator pair scatterplots**, both served as
> web panes that work stand-alone *and* embedded in the existing EUFGIS TYPO3 portal.

The data pipeline is being built (Phase 2, collection plan). The work follows the four-phase plan in section 5, one phase at a time.

---

## 2. Background

Two studies provide the scientific basis:

- **[EU-Forest](https://www.nature.com/articles/sdata2016123)** — a high-resolution pan-European
  tree occurrence dataset (genus and species level, ~1 km grid).
- **[EU-Trees4F](https://www.nature.com/articles/s41597-022-01128-5)** — joins the EU-Forest
  occurrences with present and modelled future environmental data to produce
  [tree species distribution maps](https://www.nature.com/articles/s41597-022-01128-5/figures/2) and
  [indicator pair scatterplots](https://www.nature.com/articles/s41597-022-01128-5/figures/1).

A third source turned out to matter as much as the first two (found in Phase 1, item 1):

- **[European Atlas of Forest Tree Species](https://forest.jrc.ec.europa.eu/en/european-atlas/)**
  (San-Miguel-Ayanz et al. 2016, JRC) — built from the same harmonised plot data as EU-Forest. It
  publishes, per species, the 1 km **relative probability of presence** map (C-SMFA model), the 1 km
  **maximum habitat suitability** map (RDS-MHS model), chorology polygons, and the **autoecology
  diagrams** that are the model for our scatterplots. See
  [`notes/2026-10-29-phase1-01-eu-forest-study.md`](notes/2026-10-29-phase1-01-eu-forest-study.md).

### The two products

1. **Indicator pair scatterplots** (web pane). Three layers, bottom to top:
   - *Base* (grey dots): indicator pair values for **all** occurrence locations.
   - *Species* (coloured dots): indicator pair values for occurrences of the **target species**.
   - *Units* (not in the paper's figure): the EUFGIS **gene conservation unit (GCU)** locations.
   Example images: `notes/scatterplot-example-simple.jpeg`, `notes/scatterplot-example.png.webp`.
2. **Tree species distribution maps** (web pane), as in the
   [EU-Trees4F figure](https://www.nature.com/articles/s41597-022-01128-5/figures/6), with the GCU
   locations added as a top layer.

### The improvement we are after

EU-Trees4F used **WorldClim 1.4**, which is obsolete. The goal is to replicate the workflow with
**[WorldClim 2.1](https://www.worldclim.org/data/worldclim21.html)** and/or
**[CHELSA](https://www.chelsa-climate.org)** data, both of which already exist as grids in the
`GeoService` database (see section 3).

---

## 3. Ecosystem

EUFGIS is an [ArangoDB](https://arangodb.com) backend (Milko develops it) with a
[TYPO3](https://typo3.org) portal UI built by an external company. All backend repositories share
one ArangoDB instance (`http://localhost:8529`), distinguished by database name.

| Repo / resource | Role for this project | Local path |
|---|---|---|
| **`indicator-pair-scatterplots`** (this repo) | Data + web panes for scatterplots and distribution maps | `/Users/milko/Local/Development/Git/Projects/Metadata/indicator-pair-scatterplots` |
| **`metadata-external-databases`** | Ingestion side of the `GeoService` database: environmental grids incl. **WorldClim 2.1** and **CHELSA** covering the project region. Read its `CLAUDE.md` for the database layout and credentials. `GeoService` on the work server is the only reference database (`NeoGeoService` was erased). | `/Users/milko/Local/Development/Git/Projects/Metadata/metadata-external-databases` |
| **`metadata-store`** | Central data dictionary: standards and metadata used by all project databases | `/Users/milko/Local/Development/Git/Projects/Metadata/metadata-store` |
| **`species-distribution`** (v1, reference only) | The earlier attempt at the scatterplot data side, see section 4; GitHub [`skofic/species-distribution`](https://github.com/skofic/species-distribution) | `/Users/milko/Local/Development/Workshop/species-distribution` |
| **`ecological-niche-data`**, **`ecological-niche-service`** (installed as Foxx `scat` in `GeoService`), **`ecological-niche-scatterplots`** (v2, 2025–2026, **proof of concept, not vetted; reference only, do not build on it**) | A second prior attempt built on EU-Trees4F at 5′: `OCCURRENCE` (species probabilities per grid point, current and future), `PAIRS` (EU-Trees4F climate indicators per cell), `CHOROLOGY`; a Foxx API with `/species`, `/map`, `/pair` incl. per-unit routes; a Flask + Plotly prototype. See [`notes/2026-10-30-phase1-03-geoservice-study.md`](notes/2026-10-30-phase1-03-geoservice-study.md) §6. GitHub `skofic/ecological-niche-{data,service,scatterplots}` | `/Users/milko/Local/Development/Workshop/ecological-niche-data`, `/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/scat/APP`, `/Users/milko/Local/Development/Projects/EUFGIS/ecological-niche-scatterplots` |
| **GeoService Foxx services** (`env`, `grid`, `area`, `scat`) | The served read API over `GeoService` (`/chelsa/click`, `/worldclim/click`, `/data/climate` per unit, `/hash`). **From the previous GeoService version; to be updated** (`Dataset` changed most). This project will write its own Foxx service, future base of the new GeoService service | `/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/<service>/APP` |
| **Local EU-Trees4F data** | The published dataset (`EU-Trees4F_dataset`: `ens_clim`, `ens_sdms`, `single_models`, `pngs`), the paper PDF, the FORGENIUS D4.7 deliverable, and **`Reproducibility_scripts`** (R functions, `maxent.jar`, chorology shapefiles, climate / soil / land-use predictors, species occurrences) | `/Users/milko/Local/Development/Workshop/EU-Trees4F` |

GitHub: [`skofic/indicator-pair-scatterplots`](https://github.com/skofic/indicator-pair-scatterplots).

---

## 4. Prior work (v1) — reference only

[`notes/old-version-readme.md`](notes/old-version-readme.md) is the README of an earlier attempt at
the scatterplot **data** side (the `species-distribution` repository, see section 3). It is a useful head start for the Data Plan, but it must be
**re-evaluated, not imported blindly**. What it did:

- Three layers as ArangoDB collections: **CHELSA** grid (base), **EU-Forest** occurrences crossed
  with the CHELSA grid (species), **EUFGIS** GCU shapes crossed with the grid (units).
- Pair collections named `<pair prefix>_<chelsa|eu|eufgis>_<full|round>`, keyed by the hash of the
  indicator pair values, with a `count` weight (usable for heat maps), `properties` holding the pair,
  plus `species_list` (EU-Forest) or GCU id lists (EUFGIS).
- `_full` = full resolution; `_round` = values binned by an interval per axis to cut point counts.
- A `Stats` collection with min / avg / max per indicator and per pair collection.

Known problems it documented, which this project must solve properly:

- **Point volume**: temperature × precipitation for CHELSA alone is >27 million points. Rounding was
  the v1 answer; binning / density rendering on the display side is the likely v2 answer.
- **Long AQL queries from Node.js timed out** unpredictably; v1 fell back to shell scripts.
- All indicators used had to be indexed in the CHELSA collection or aggregations were unworkable.

---

## 5. Plan

Phases run **in order, one item at a time**. Each phase ends in decisions that are recorded here
(with the date) and that may amend the following phases.

### Phase 1 — Scientific study
**Status: complete (2026-10-29 … 2026-10-30). All four items done, all decisions confirmed. Phase 2 is next.**

1. Study the **EU-Forest** project and data.
   1. Its distribution maps show species as **continuous areas** rather than the point occurrences in
      the data. Understand how that was done and what additional datasets were used to interpolate /
      spread the points, so the technique can be replicated.
      → **Done.** Study note: [`notes/2026-10-29-phase1-01-eu-forest-study.md`](notes/2026-10-29-phase1-01-eu-forest-study.md).
      EU-Forest publishes 1 km cell centroids (EPSG:3035) only; the continuous maps are the Atlas
      RPP / MHS rasters (modelled, not interpolated); the Atlas autoecology diagram defines our
      scatterplot, with the base layer = all surveyed plots including absences.
2. Study the **EU-Trees4F** project and data.
   1. Understand the process used to **join occurrence data with environmental data**, so it can be
      replicated with WorldClim 2.1 and/or CHELSA.
   2. Understand how the **continuous colour maps** were obtained (same question as 1.1).
   3. Select the **indicator pairs** that make scientific sense for the scatterplots.
   → **Done.** Study note: [`notes/2026-10-30-phase1-02-eu-trees4f-study.md`](notes/2026-10-30-phase1-02-eu-trees4f-study.md).
   The join is a containing-cell raster lookup on a 5′ WorldClim 1.4 (1961–1990) grid; the maps are
   biomod2 ensemble-SDM probability surfaces (6 algorithms, MESS mask, chorology mask, MigClim
   dispersal, land-use clip); core pairs proposed: annual T × annual P, summer T × summer P,
   continentality × winter P, with the two remaining Atlas pairs added on the 1 km sources.
   FORGENIUS D4.7 already placed 1 706 single-species GCUs (42 species) in the EU-Trees4F climate space.
3. Study `metadata-external-databases` and the `GeoService` database, in particular the WorldClim and
   CHELSA grids covering the project region.
   → **Done.** Study note: [`notes/2026-10-30-phase1-03-geoservice-study.md`](notes/2026-10-30-phase1-03-geoservice-study.md).
   Both grids are loaded and validated on the work server (27.1 M CHELSA cells 1981–2010, 26.2 M
   WorldClim cells 1970–2000, one SSP3-7.0 future each), awaiting the production cutover; cell keys
   are derivable offline, so the batch join can be key lookups instead of v1's geo query; `Units`
   carries a climate probe point per unit; CHELSA has no monthly radiation. A second prior attempt
   (v2, EU-Trees4F-based, 2025–2026) was found, see the ecosystem table.
4. Study `metadata-store` for the metadata and standards used across project databases.
   → **Done.** Study note: [`notes/2026-10-30-phase1-04-metadata-store-study.md`](notes/2026-10-30-phase1-04-metadata-store-study.md).
   Every property name is a term GID; all loaded climate variables have terms, our derived axes do
   not yet; dataset records follow the `std_dataset` target shape; species are Latin binomials
   reconciled against the EUFGIS `taxa` collection. Dictionary corrections for the `metadata-store`
   Claude: [`notes/2026-10-30-handoff-metadata-store-climate-terms.md`](notes/2026-10-30-handoff-metadata-store-climate-terms.md).

**Questions to answer**
- Can the old WorldClim 1.4 data be substituted with other sources?
- Given the occurrence dataset, can we build a system that is fed environmental data and generates
  both distribution maps and indicator pair scatterplots?
- If not, can the existing EU-Trees4F data be used to generate the maps and scatterplots?

**Things to keep in mind**
- Solutions must have a **scientific background**; any deviation from the published workflow must
  be backed by scientific evidence.
- We need **grid data** (or equivalent) because users must be able to indicate a location on the map
  and see that location rendered in the scatterplot.
- Note from the first read of the brief (2026-10-29): the scatterplots need only a climate-grid
  lookup at occurrence points, whereas the EU-Trees4F maps are **species distribution models**
  (MaxEnt / ensembles with chorology masks and soil / land-use predictors), i.e. a modelling exercise
  rather than an interpolation. Phase 1 must size that honestly; reusing the published EU-Trees4F
  rasters for the maps while recomputing the scatterplots with current climate data is a legitimate
  outcome of the Data Plan.

### Phase 2 — Data plan
**Status: complete (2026-10-30 … 2026-10-31). All nine steps done, future climate loaded, the three closing items decided. Phase 3 is next.** (plan: [`notes/2026-10-30-phase2-data-plan.md`](notes/2026-10-30-phase2-data-plan.md) §6; coverage: [`notes/2026-10-30-species-coverage.csv`](notes/2026-10-30-species-coverage.csv); term requests: [`notes/2026-10-30-term-requests-derived-indicators.md`](notes/2026-10-30-term-requests-derived-indicators.md); comparison: [`notes/2026-10-30-phase2-step9-source-comparison.md`](notes/2026-10-30-phase2-step9-source-comparison.md)).

What is in `GeoService` now (laptop): `ScatterSpecies` 271 taxa (242 EU-Forest, 67 EU-Trees4F, 43 Atlas, 123 unit target species, 4 synonyms folded); `ScatterOccurrences` 250 569 cells with EU-Trees4F, WorldClim 2.1 and CHELSA 2.1 blocks, **present and future**, nested `properties.<source>.<period>[.<model>.<ssp> | .<rcp>]` (EU-Trees4F 1961–1990 + 1991–2020 / 2021–2050 / 2051–2080 × RCP 4.5 / 8.5; WorldClim 1970–2000 + four periods to 2100 under MPI-ESM1-2-HR SSP3-7.0, future temperature indicators from (tasmax + tasmin)/2, no future radiation; CHELSA 1981–2010 + three periods to 2100, same model and scenario); `ScatterCells` 251 234 climate cells with the same per-period blocks; `ScatterUnits` 3 669 units (340 restricted, climate only); `ScatterMaps` 2 515 manifest documents (EU-Trees4F SDM-ensemble COGs 2 211, Atlas RPP 39 and MHS 27 COGs at 1 km EPSG:3035, chorology GeoJSON 238); ten `Dataset` records (EU-Forest, EU-Trees4F predictors incl. future and maps, Atlas RPP, MHS, chorology, and one per Scatter collection, with `count` filled). **The seven derived indicators are stored** (terms created in `metadata-store` on 2026-10-30, commit `b06aee3`; all three collections reloaded with `--on-missing fail`, 0 errors; the EU-Trees4F predictors Dataset record completed). Known data facts: 1 715 occurrence cells lie outside the land mask and have no 1 km climate; 26 unit target species (e.g. *Fagus orientalis*, 28 units) match no source; one unit (ESP00372) repeats a species in `Units.species_list`; EU-Trees4F rasters store temperatures × 10 and seasonal precipitation as three-month totals; the published EU-Trees4F dispersal binary rasters (804 files) carry no projection and get EPSG:3035 assigned at conversion.

Compile the Phase 1 findings into a proposal:

1. What data can we use?
2. Advantages and issues of each data choice.
3. Where does the data come from? Can the `GeoService` database be used?
4. Settle on one solution.
5. Data collection plan.

Outcome: the plan to collect and compile the data, probably into a database — `GeoService` if the
data matches what is already there, otherwise a new database for this task.

### Phase 3 — Display plan
**Status: in progress since 2026-10-31.** Plan and decisions: [`notes/2026-10-31-phase3-display-plan.md`](notes/2026-10-31-phase3-display-plan.md). Questions 3–4 answered by measurement (base layers static, the rest dynamic through our Foxx service); **the map pane is settled on OpenLayers** (`examples/map-openlayers.html`, approved 2026-10-31); **the scatterplot is D3 + Canvas** (`examples/scatter-d3-canvas.html`, chosen 2026-11-01; Plotly retired); the EU-Trees4F Figure 1 classification view and the map → scatterplot link (`examples/linked.html`, two pages talking by `postMessage`) are built (2026-11-01, pending review); next the Serve Plan context; the unit reference-point distance flag is pending. Examples run with `node examples/serve.mjs 8080` → http://localhost:8080/examples/ .

1. Users must be able to navigate the maps.
2. Users must be able to zoom on areas of the scatterplot.
3. Is it feasible to create maps and scatterplots on the fly from database data?
4. What share of the data can be dynamic and what must be static?
5. Do we use GeoTIFF maps as the base?
6. Which technologies draw the plots? (Milko knows **D3.js**; it can do virtually anything,
   including **other graph types that convey the same message** as the scatterplots — relevant given
   the point volumes in section 4.)
7. Final decision on all of the above.

Outcome: a set of examples to choose from, the chosen libraries, and the technical foundations.

### Phase 4 — Serve plan
**Status: not started.**

1. Which web server?
2. How do we target a **pane** of an existing web page?
3. How can the product be **both stand-alone** (header, body, footer) **and a pane** of a page in
   the EUFGIS TYPO3 site?
4. How is it easily installed?

### Decisions log

| Date | Decision |
|---|---|
| 2026-10-29 | Repository bootstrapped; brief adopted as the initial plan. |
| 2026-10-29 | Phase 1 item 1 complete. **Confirmed by Milko:** (a) **Maps: do not replicate the Atlas C-SMFA / RDS-MHS models; serve published rasters directly** — Atlas relative probability of presence (1 km, default layer), Atlas maximum habitat suitability (1 km), EU-Trees4F current and future suitability (10 km, time slider) — with GCU locations as a vector layer on top. Data Plan must check species coverage (Atlas list vs EU-Trees4F 67 species vs EUFGIS target species) and licences. (b) **Scatterplot base layer = the Atlas autoecology definition**: all surveyed EU-Forest cells (~250 k), species layer = cells with the species, top layer = GCUs. The whole-climate-grid base (v1 approach, >27 M points) stays an optional toggle, not the default. The full climate grid is still needed for the map-click → scatterplot lookup. (c) **Climate sources in this order: EU-Trees4F historical predictors first** (7 layers at 5 arc-min ≈ 10 km, WGS84, in `Reproducibility_scripts/datasets/climate/historical`: bio1, bio12, bio15, temp10_summer, prec_winter, prec_summer, continentality), **then WorldClim 2.1 and CHELSA 2.1 from GeoService** (1 km), only if the overlay of the same pair from the three sources shows a visible difference. Build the lookup pipeline once with a pluggable climate source so the comparison is cheap. Note: the EU-Trees4F set lacks coldest-month temperature, driest-month precipitation and solar irradiation, so the three Atlas pairs cannot all be reproduced from it. |
| 2026-10-30 | **Solar irradiation axis: substitute, not recompute.** The Atlas uses DEM-derived *potential* spring-summer irradiation (GRASS `r.sun`, clear sky). We use the spring-summer sum of *actual* surface shortwave radiation from the climate grids (WorldClim 2.1 `srad`, CHELSA 2.1 `rsds`) and **rename the axis label** accordingly (e.g. "Spring-summer solar radiation"), stating the difference in the documentation. Decided by Milko; final say on keeping the pair at all rests with item 2.3. |
| 2026-10-30 | Phase 1 item 2 complete. **Confirmed by Milko:** (a) join = containing-cell lookup at the grid's native resolution, occurrences reprojected EPSG:3035 → WGS84, no thinning; (b) species layer from EU-Forest only (the EU-Trees4F occurrence files add points of undocumented origin and would break species ⊂ base); (c) core indicator pairs P1 annual T × annual P, P2 summer T × summer P, P3 continentality × winter P, all computable from the EU-Trees4F 5′ layers; P4 coldest-month T × spring-summer radiation and P5 precipitation seasonality × driest-month P added with WorldClim 2.1 / CHELSA 2.1; pair definitions in configuration; (d) an EU-Trees4F-style future-suitability overlay noted as optional later work. |
| 2026-10-30 | **No reproduction of the EU-Trees4F suitability model.** Re-running the biomod2 workflow on WorldClim 2.1 / CHELSA 2.1 would gain 1 km resolution and data consistency, but would lose the JRC study's scientific backing (unpublished, unreviewed product; a 1981–2010 baseline matches the ~2005 occurrences worse than the authors' 1961–1990; fewer future models than the 11 EURO-CORDEX RCMs), and the effort is considerable (porting R 3.6 / biomod2-2020 / MigClim scripts, 100× more cells, SoilGrids not in GeoService). Decided by Milko. **Optional research track, not scheduled:** after the lookup pipeline and the three-source scatterplot comparison exist, and only if that comparison shows the species clouds moving visibly, re-run the *current-period* suitability only (same nine predictors, no dispersal, no land-use clip) at 1 km and compare with the published current maps and the Atlas MHS. |
| 2026-10-30 | Phase 1 item 3 complete. **Confirmed by Milko:** (a) units layer = the `Units` climate probe points with `species_list`, restricted units in the scatterplot but never on the map; (b) batch join by offline cell-key derivation + key lookups for the 1 km grids (sample-verified against the server), direct raster sampling for the EU-Trees4F 5′ layers, `/click` routes at runtime; (c) P4 WorldClim-only unless annual mean radiation is accepted for CHELSA; CHELSA `ai`, `cmi`, `gdd5`, `gsl`, `pet`, `vpd` on the candidate list; (d) **v2 prior work (`ecological-niche-*`) is proof of concept, not scientifically vetted: clean slate, do not build on it** (data may be glanced at, but we redo the work). **Corrections from Milko:** `NeoGeoService` has been erased, `GeoService` is the only reference database; the installed Foxx services (`env`, `grid`, `area`, `scat`) are from the **previous** GeoService version and need updating (most will still work; the `Dataset` collection changed significantly) — that update was paused to start this repository. **Decision:** this project creates **its own GeoService Foxx service**, which will later become the base of the new GeoService service once work on `metadata-external-databases` resumes. CHELSA is used for indicators WorldClim lacks (e.g. aridity). A dictionary-corrections document for the `metadata-store` Claude is produced from the issues flagged in item 3. |
| 2026-10-30 | Phase 1 item 4 complete. **Confirmed by Milko:** (a) our collections follow the dictionary (term GIDs as property names, validator before load, `std_dataset` target shape, `std_dataset_ids` on every document); (b) derived indicator terms are requested from `metadata-store` once the Data Plan fixes the pair set, never improvised in loaded data; (c) **a species table of our own**: for now it holds the scientific name, which is the unique identifier; **UPOV codes will be adopted soon across all repositories**, so the table must be able to take a UPOV code as the key later without re-keying the data; a species coverage table goes in the Data Plan; (d) Milko delivers the handoff document to the `metadata-store` session (its §D, the future terms, marked as "for later") and updates the dictionary himself. **Phase 1 closed.** |
| 2026-10-30 | The `metadata-store` session applied the handoff's §A and §B (14 terms corrected, `bio03` → `unit_Percent_pct`, `gdd*` → `unit_DegreeDays_deg-C-day`), committed `2098d97`, both servers reloaded; §D (our derived terms) waits for the final pair set. |
| 2026-10-30 | **Step 9 decided (Milko):** the scatterplots are served from the 1 km grids, **WorldClim 2.1 as the default source**, **CHELSA 2.1 as the selectable alternative** (its 15–20 % higher precipitation stated in the documentation), the **EU-Trees4F block kept as the "as modelled" view**; all three stored side by side, so the choice is a display setting. Evidence: [`notes/2026-10-30-phase2-step9-source-comparison.md`](notes/2026-10-30-phase2-step9-source-comparison.md). |
| 2026-10-30 | **Derived-indicator terms created** in `metadata-store` (`b06aee3`), identifiers as in the request note after Milko's review (two-word local identifiers take a hyphen: `env_climate_srad_spring-summer`, `env_climate_pr_seasonality-ratio`; `env_climate_tas`, `env_climate_pr`, `env_climate_srad` became namespaces). The three loaders reran with the terms required; a cache of 3 287 cells written under the earlier underscore names was found and rebuilt, and the units loader now validates every cell it caches. |
| 2026-10-31 | **Future climate is the core of the scatterplot** (Milko): the plots must show where today's populations, the conservation units above all, will sit in the climate of the coming periods, so that managers can find the units at the edge of their species' climate and plan seed transfer and new units. Decided: (a) **future periods of all three sources loaded** as further blocks per cell and per unit, structure `properties.<source>.<period>[.<model>.<ssp> | .<rcp>]` mirroring GeoService; the WorldClim future temperature indicators use tas ≈ (tasmax + tasmin)/2, stated in the `SCATTER_OCCURRENCES` Dataset record; (b) **EU-Trees4F SDM ensemble only** is served (eleven projections averaged, with a standard deviation; the climatic ensemble is not converted); (c) **Dataset records for the four Scatter collections**: occurrences, species and maps as region / grid, units as unit / shape; every document carries its own collection's record key. The future view is a projection of present occurrences into a future climate, to be labelled as such in the display (Phase 3). **Phase 2 closed.** |
| 2026-10-30 | **Phase 2 settled.** Four `Scatter`-prefixed collections in `GeoService` (`ScatterSpecies` with a surrogate key and the scientific name as identifier, synonyms from day one; `ScatterOccurrences`, one document per EU-Forest cell with per-source indicator values at full precision; `ScatterUnits`, **materialised**, rebuilt by a refresh command; `ScatterMaps`, the raster/vector manifest with files on disk as COG) plus a `ScatterCells` cache of derived indicators per climate cell; `Dataset` records for every source and every new collection; the seven derived-indicator terms requested before loading. **Units** come from `GeoService.Units` for now (yearly refresh; no web service for live units exists; Milko coordinates with the portal developers on the live climate reference point); probe point for the scatterplot, **polygon from `UnitPolygons` for the map** where it exists and the unit is unrestricted (at 1 km only 1.8 % of shapes span ≥ 3 cells, so polygons add nothing to the scatterplot). **Range outline = Atlas chorology** (Caudullo 2017), not the EU-Forest α-shapes. **The laptop is the working platform**: its `GeoService` holds the full grids; the work server is a reduced copy for colleagues. Size is no constraint (< 1 GB added to 1.6 TB). **Atlas licence resolved**: "European Commission reuse notice" = Decision 2011/833/EU, i.e. CC BY 4.0; credit the layer DOI and chapter, indicate changes. |

---

## 6. Working conventions

- **One phase, one item at a time.** Finish and record the decision before moving on. Amend this
  file (status lines, decisions log, and the plan itself) as decisions are reached.
- **If something goes sideways, stop and re-plan** — do not keep pushing in the wrong direction.
- **Scientific grounding first.** Every substitution or shortcut must be justified with a reference.
- **Coordinate-restricted GCUs.** EUFGIS has ~340 units whose coordinates must not be exposed (see
  `metadata-external-databases`). A scatterplot of climate values does not reveal coordinates, but a
  map layer does; the Serve Plan must respect this rule.
- **`notes/`** holds briefs, study notes and decision documents and is committed.
  **`scrapbook/`** is ignored scratch space.
- **Database access (since 2026-10-30, Phase 2 collection plan):** the laptop's `GeoService` is the
  working database; `metadata` is read for the dictionary snapshot. Credentials live in
  `globals/auth/db.credentials.json` (gitignored, copied from `metadata-external-databases`; the
  prototype is committed). Write tools refuse to run unless that file carries `"is_load_target": true`.
  Every loaded value is checked against the dictionary first (`lib/dictionary.js`); a property whose
  GID the dictionary does not know is dropped and listed, never loaded under an undefined name.
- **Pipeline layout:** `config/indicators.js` (pairs, sources, GIDs, scaling), `lib/` (db, geometry,
  dictionary, records), `sources/<step>/` (species, occurrences, climate/eutrees4f, units, datasets,
  maps), `setup.js` (collections and indexes), `work/` (JSONL work files, ignored), `maps/` (rasters,
  ignored). Python (`.venv`, rasterio / pyproj / shapely) does raster sampling and reprojection; Node
  does keys, validation and loading, as in the ingestion repository.
- Commit messages follow the conventional-commits style used in the sibling repositories.
