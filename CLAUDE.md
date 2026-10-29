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

Nothing is built yet. The work follows the four-phase plan in section 5, one phase at a time.

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
| **`metadata-external-databases`** | Ingestion side of the `GeoService` database: environmental grids incl. **WorldClim 2.1** and **CHELSA** covering the project region. Read its `CLAUDE.md` for the database layout and credentials. | `/Users/milko/Local/Development/Git/Projects/Metadata/metadata-external-databases` |
| **`metadata-store`** | Central data dictionary: standards and metadata used by all project databases | `/Users/milko/Local/Development/Git/Projects/Metadata/metadata-store` |
| **`species-distribution`** (v1, reference only) | The earlier attempt at the scatterplot data side, see section 4; GitHub [`skofic/species-distribution`](https://github.com/skofic/species-distribution) | `/Users/milko/Local/Development/Workshop/species-distribution` |
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
**Status: in progress. Item 1 done and its decisions confirmed on 2026-10-29; item 2 (EU-Trees4F study) is next.**

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
3. Study `metadata-external-databases` and the `GeoService` database, in particular the WorldClim and
   CHELSA grids covering the project region.
4. Study `metadata-store` for the metadata and standards used across project databases.

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
**Status: not started.**

Compile the Phase 1 findings into a proposal:

1. What data can we use?
2. Advantages and issues of each data choice.
3. Where does the data come from? Can the `GeoService` database be used?
4. Settle on one solution.
5. Data collection plan.

Outcome: the plan to collect and compile the data, probably into a database — `GeoService` if the
data matches what is already there, otherwise a new database for this task.

### Phase 3 — Display plan
**Status: not started.**

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
- **No database access from this repository yet.** Reading the sibling repos is fine; running
  anything against ArangoDB waits for the Data Plan.
- Commit messages follow the conventional-commits style used in the sibling repositories.
