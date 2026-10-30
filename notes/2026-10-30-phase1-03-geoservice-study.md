# Phase 1, item 3 — `metadata-external-databases` and the GeoService climate grids

Date: 2026-10-30. Status: **complete; decisions confirmed by Milko the same day** (see the decisions log in `CLAUDE.md`, which also records his corrections: `NeoGeoService` erased, Foxx services from the previous GeoService version, v2 prior work is proof of concept only, this project writes its own Foxx service).

Question from the brief: study the repository that created the GeoService database of environmental
data, in particular the WorldClim and CHELSA grids covering the project region.

Sources read (all read-only, no database access): `metadata-external-databases` (`CLAUDE.md`,
`ROADMAP.md`, `HANDOVER.md`, `notes/2026-07-15-worldclim.md`, `sources/climate/chelsa/config.js`,
`lib/geometry.js`, `data/Dataset.json`, `data/forgenius-land-mask.geojson`); the installed GeoService
Foxx services under `/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/` (`env` README, `grid`
routes and setup, `scat`); the v1 `species-distribution` queries; and three further repositories found
along the way (section 6).

---

## 1. The ingestion repository in one paragraph

`metadata-external-databases` is the **write side** of `GeoService`: Node/JavaScript pipeline
(`arangojs`), Python/`rasterio` for raster crunching, AQL where needed, values validated against the
data dictionary (`metadata-store-validator`). Ingestion is grouped by theme (`sources/climate/`,
`sources/drought/`, `sources/remote-sensing/`). The **Foxx services own the served schema** (`grid`
and `area` create collections, views and indexes); the ingestion repo only verifies they exist. All
gridded sources are clipped to one shared **land mask** (`data/forgenius-land-mask.geojson`, built
from a hand-drawn KML). Climate grids are **static**: reloaded only on a source version or mask
change, never appended. Every property name is a dictionary term GID.

**Status (ROADMAP, 2026-09-18):** `Chelsa` and `WorldClim` are fully loaded on the **work server**
(`work.eufgis.org`, database `GeoService`), validated cell by cell (10.5 billion CHELSA values and 8.5
billion WorldClim values, 0 errors), **dumped and waiting for a single production cutover** that is
gated on dictionary changes being agreed with the portal managers. The laptop holds only test slices
(`NeoGeoService`); **laptop copies are not authoritative**. Consequence for us: any bulk lookup
against the grids runs on the work server, or not against the database at all (section 4).

## 2. The two climate grids as stored

Both collections hold **one document per 30″ cell** (1/120°, half-cell radius 1/240°), clipped to the
land mask, whose bounding box is **lon −31.3° … 50.7°, lat 11.8° … 74.6°** (Europe, Anatolia, the
Caucasus, North Africa's fringe, Iceland, the Canaries).

| | `Chelsa` | `WorldClim` |
|---|---|---|
| Source | CHELSA v2.1 | WorldClim v2.1 |
| Cells | 27 071 711 | 26 210 178 |
| Historical period | **1981–2010** | **1970–2000** |
| Future periods | 2011–2040, 2041–2070, 2071–2100 | 2021–2040, 2041–2060, 2061–2080, 2081–2100 |
| Future model / scenario | MPI-ESM1-2-HR / **SSP3-7.0** only (confirmed 2026-07-15 as a precautionary high-end choice) | same |
| Annual variables | bio01–bio19; gdd0/5/10, ngd0/5/10, gddlgd10, gdgfgd10, gsl, gsp, gst, npp, scd, kg0–kg5; historical only: ai, clt_*, cmi_*, hurs_*, pet_penman_*, **rsds_{min,mean,max,range}**, sfcWind_*, vpd_*, swb; future only: fgd, lgd | bio01–bio19 |
| Monthly variables (`std_date_span_month[12]`) | **pr, tas, tasmax, tasmin** only (both periods) | historical: pr, tas, tasmax, tasmin, **srad**, vapr, wind; future: pr, tasmax, tasmin |
| Topography | — | `geo_shape_elevation` |
| Dataset record | `4badf85d-270a-463c-89d3-04bc52d806bd` | `bf102320-3726-48d1-b3fc-421f131c6666` |

Record shape (both): `_key` = lowercase MD5 of the compact GeoJSON of `geometry_bounds`;
`geometry_point` (cell centre), `geometry_bounds` (axis-aligned square), `std_dataset_ids`,
`properties.<period>[.<MODEL>.<SSP>]` with the variables, monthly values in `std_date_span_month`.
Indexes: `geo` on `geometry_bounds` and on `geometry_point`. Scaling is applied at load (values are
stored in physical units: °C, mm, etc.).

**Dictionary issues already flagged by the ingestion work** (not ours to fix, but they touch our
axes): the `bio06` definition says "maximum" but BIO6 is the minimum temperature of the coldest month;
`bio16–19` titles say "mean monthly" but WorldClim ships quarter totals; `bio03` carries a °C unit
although it is dimensionless.

## 3. The served read API (Foxx `env` / `grid`)

Per grid: `GET /chelsa/click?lat&lon` and `GET /worldclim/click?lat&lon` return the one cell that
contains the point (AQL `GEO_INTERSECTS(GEO_POINT(lon,lat), geometry_bounds)` on the geo index);
`POST …/dist`, `…/contain`, `…/intersect` select cells by distance from, containment in, or
intersection with a reference geometry, returning keys, shapes, data or MIN/AVG/MAX/STD/VAR
aggregates. `/hash`, `/hash/poly`, `/hash/multipoly` compute the server-side geometry keys.

Units: the `Units` collection (≈ 2 819 units, 6 390 shapes) holds per unit `gcu_id_number`, a
**`gcu_loc_coordinates-restriction` flag**, a **climate probe point `gcu_loc_climate`** and
`species_list` (the unit's target species). `GET /data/climate?gcu_id_number` returns the unit record
with the CHELSA and WorldClim cells at the probe point, **omitting the point when the unit is
restricted**. This is the natural source of our *units* layer: one probe point per unit, already
chosen by the partners, already used by the portal for climate.

## 4. Joining 250 000 occurrence cells with the grids: three ways

v1 (`species-distribution/queries/LinkSpeciesToChelsa.aql`) ran **one AQL statement** with a nested
`FOR … FILTER GEO_INTERSECTS(point, cell.geometry_bounds)` over every occurrence: 250 k geo lookups in
a single multi-hour query, exported through `arangoexport` with a 3 600 s cap. That, not the geo
index, is why it timed out. The alternatives, in order of preference:

1. **Offline key derivation, then key lookups.** `lib/geometry.js` in the ingestion repo computes a
   cell's `_key` from (lon, lat, radius) exactly as stored (verified 500/500 against the live
   collection on 2026-07-20, valid *for grid cells only*). For an occurrence, the containing cell's
   centre is `floor((lon + 180) · 120)` and `floor((lat + 90) · 120)` plus half a cell, so the key is
   computable without any geo query. The join then becomes batched `DOCUMENT()` lookups by key, i.e.
   250 k primary-key reads, minutes rather than hours, and resumable. The only subtlety is to reuse
   the ingestion repo's exact centre arithmetic (the extractor derives centres from the raster
   transform) and to verify a sample of keys against the server before trusting the batch.
2. **Direct raster sampling.** For the historical layers the inputs are public GeoTIFFs (WorldClim
   bio and monthly zips; CHELSA per-variable tifs). Sampling 250 k points from them with `rasterio`
   takes seconds and needs no database at all. The ingestion pipeline downloads them on the work
   server, so they exist there; on the laptop they would have to be fetched (2–7 GB for WorldClim
   monthly sets, less for the bio set). Values must then be scaled exactly as the loader does (the
   `config.js` scale maps) so that stored and sampled numbers agree.
3. **The `/click` route per point** — correct, but 250 k HTTP calls; fine for the runtime
   "user clicks the map" case, wrong for the batch.

Either 1 or 2 is acceptable for the Data Plan; 1 keeps a single source of truth (the database), 2
keeps the batch off the server. The runtime map-click lookup uses the existing `/click` routes in
both cases. For the EU-Trees4F 5′ layers (first run) only option 2 exists, since they are not in the
database.

## 5. Consequences for the indicator pairs (update to item 2.3)

- **P4, spring-summer solar radiation:** WorldClim 2.1 has monthly `srad`, so the Mar–Aug sum is
  computable. **CHELSA in GeoService has no monthly radiation**, only annual `rsds_{min,mean,max}`.
  With CHELSA the axis would have to be annual mean radiation, another renaming, or P4 stays
  WorldClim-only.
- **P2, P3, coldest-month temperature, the Atlas seasonality definition:** all computable from the
  monthly `tas` and `pr` present in both grids.
- **New candidates CHELSA offers that neither the Atlas nor EU-Trees4F used:** aridity index `ai`,
  climate moisture index `cmi_*`, growing-degree days `gdd5`, growing-season length `gsl`,
  potential evapotranspiration `pet_penman_*`, vapour-pressure deficit `vpd_*` (v1 used `vpd_mean`).
  Worth a look in the Data Plan as a drought axis, with a reference before adoption.
- Baselines: EU-Trees4F 1961–1990 → WorldClim 2.1 1970–2000 → CHELSA 2.1 1981–2010. The three-source
  comparison planned on 2026-10-29 therefore also compares three baselines.

## 6. Found along the way: a second prior attempt, built on EU-Trees4F (2025–2026)

Three repositories and one installed service that the brief did not list, later than
`species-distribution` (v1, Oct–Dec 2024):

| What | Where | Content | Dates |
|---|---|---|---|
| **`ecological-niche-scatterplots`** | `/Users/milko/Local/Development/Projects/EUFGIS/ecological-niche-scatterplots`, GitHub `skofic/ecological-niche-scatterplots` | Flask + **Plotly.js** prototype: three layers (grid, species, unit) fetched from a Foxx service in a database `EcologicalNiche`, pair `tas_pr`, `type=low` (the v1 rounded data) | Jan 2025, one commit. Contains a hard-coded ArangoDB root JWT in `app.py` (expired Jan 2025, but it should not be in a repository) |
| **`ecological-niche-data`** | `/Users/milko/Local/Development/Workshop/ecological-niche-data`, GitHub `skofic/ecological-niche-data` | Node scripts + AQL that turn the **EU-Trees4F** rasters into three collections: `OCCURRENCE` (one document per 5′ point with each species' probability for cur2005 / fut2035 / fut2065 / fut2095 × rcp45 / rcp85, scaled 0–100), `PAIRS` (one document per 5′ cell with the EU-Trees4F climate indicators bio01, bio12, bio15, ci, ps, pw, ts for 1960-1990 and three future periods × two RCPs), `CHOROLOGY` (species range polygons) | Mar–Dec 2025 |
| **`ecological-niche-service`** (installed as **`scat`** in `GeoService`) | `/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/scat/APP`, GitHub `skofic/ecological-niche-service` v1.0.1 | Foxx routes: `/species/list`, `/species/chorology`; `/map/{stat,array,point}` and `/map/species/…` (probability grid points per species); `/pair/{stat,array,object}`, `/pair/species/…`, `/pair/unit/…` (pair values for the grid, for a species, for a GCU, by period and scenario, with per-combination counts) | Jan 2026 |

In other words, **v2 already implements, at 5′ and on EU-Trees4F's WorldClim 1.4 climate, most of
what our "EU-Trees4F first" run was going to do**, including future periods and scenarios, GCU
lookups through `UnitPolygons`, and a service API, and it has a throw-away Plotly front end. What it
does **not** do: the Atlas-style base (its base is the whole 5′ grid), EU-Forest observations as the
species layer (its species layer is modelled probability, EU-Trees4F Figure 1 style), 1 km climate,
or maps as rasters (it serves probability grid points).

**Question for Milko:** how should the plan treat v2? The options are (a) reference only, like v1;
(b) reuse its data pipeline for the EU-Trees4F first run and extend it; (c) something in between,
such as reusing the service's route design. The answer changes Phase 2 and Phase 4 more than
Phase 1, so item 4 can proceed meanwhile.

## 7. Decisions (confirmed 2026-10-30)

1. **Units layer = the `Units` probe points** (`gcu_loc_climate`), one point per unit, with
   `species_list` to filter units by species; not the full polygons crossed with the grid as v1 did.
   Restricted units are included in the scatterplot (a climate value is not a location) but never in
   the map layer; to be confirmed as acceptable.
2. **Batch join = offline key derivation + key lookups** (option 1 in section 4) when the 1 km grids
   are used, with a sample verified against the server first; **direct raster sampling** for the
   EU-Trees4F 5′ layers. The runtime map-click lookup uses the existing `/click` routes.
3. **P4 is WorldClim-only** unless we accept annual mean radiation for CHELSA; CHELSA's `ai`,
   `cmi`, `gdd5`, `gsl`, `pet`, `vpd` go on the candidate list for the Data Plan, each needing a
   reference before adoption.
4. The three v2 repositories and the `scat` service are added to the ecosystem table in
   `CLAUDE.md` as **prior work, status to be decided** (section 6).
