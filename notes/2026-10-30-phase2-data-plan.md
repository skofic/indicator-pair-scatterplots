# Phase 2 — Data Plan (proposal)

Date: 2026-10-30. Status: **settled with Milko on 2026-10-30; executed 2026-10-30 … 2026-10-31; closed.**
Amendment of 2026-10-31: the future periods of all three climate sources were added to the collections
(decision in `CLAUDE.md`), the document structure became `properties.<source>.<period>[...]`, and the
four Scatter collections got Dataset records; the SDM ensemble only is served for EU-Trees4F. Items 1–3 of the phase
are the inventory, the coverage and the options below; item 4 is the solution in section 5.
Inputs: the four Phase 1 study notes and the decisions log in `CLAUDE.md`.

---

## 0. What the data must support

- **Scatterplot** with three layers in the Atlas autoecology sense: base = all surveyed EU-Forest
  cells, species = cells where the species occurs, units = GCU climate probe points; pairs P1–P5
  (annual T × annual P; summer T × summer P; continentality × winter P; coldest-month T ×
  spring-summer radiation; precipitation seasonality × driest-month P); climate sources EU-Trees4F
  5′ first, then WorldClim 2.1 and CHELSA 2.1 at 1 km; a map click must resolve to a point in the
  scatterplot; full precision stored, binning left to the display.
- **Maps**: Atlas relative probability of presence (default) and maximum habitat suitability at 1 km,
  EU-Trees4F current and future suitability at 10 km, GCU overlay without restricted units.
- **Species table** keyed by scientific name for now, UPOV codes later without re-keying.
- Dictionary compliance (term GIDs, validator, `std_dataset` records); our own Foxx service in
  `GeoService`; nothing built on v1 or v2.

## 1. Inventory — what data we can use (item 1)

| # | Dataset | Role | Content | Grid / CRS | Size | Licence | Where it is |
|---|---|---|---|---|---|---|---|
| D1 | **EU-Forest species occurrences** (Mauri et al. 2017) | base + species layers | 588 983 rows, 242 species, 250 569 cells, source flags, DBH class, EOO flag | 1 km INSPIRE cell centroids, EPSG:3035 | 37 MB | **CC0** (figshare 3497885) | local `/Users/milko/Local/Backup/ArangoDB/data/EU-Forest_species.csv`; figshare |
| D2 | EU-Forest EOO α-shapes | optional range outline | 203 species polygons | WGS84 | 0.3 MB | CC0 | figshare 3497894 |
| D3 | **GeoService `Units`** + **`UnitPolygons`** / `Shapes` | units layer | ≈ 2 819 units: `gcu_id_number`, climate probe point (every unit has one), restriction flag, `species_list`; polygons for the units that have a geometry (not all) | WGS84 points and polygons | — | internal; **frozen for a year** in GeoService, the live units live in the `metadata` database with no web service yet (checked 2026-10-30) | `GeoService` on the laptop |
| D4 | **GeoService `WorldClim`** (2.1) | climate, 1 km | bio01–19 + monthly tas/tasmin/tasmax/pr/**srad**/vapr/wind, elevation; 1970–2000; one SSP3-7.0 future | 30″, cells keyed by MD5 of bounds | 26.2 M cells | WorldClim: free for research; CMIP6: CC BY-SA | `GeoService` on the laptop (full copy; the work server holds a slower copy for colleagues) |
| D5 | **GeoService `Chelsa`** (2.1) | climate, 1 km | bio01–19 + monthly tas/tasmin/tasmax/pr + annual ai, cmi, gdd, gsl, pet, rsds stats, vpd, …; 1981–2010; one SSP3-7.0 future | 30″ | 27.1 M cells | CHELSA: CC BY 4.0 | `GeoService` on the laptop |
| D6 | **EU-Trees4F historical predictors** | climate, first run | bio1, bio12, bio15, temp10_summer, prec_winter, prec_summer, continentality; WorldClim 1.4, 1961–1990 | 5′ (≈ 10 km), WGS84, 1128 × 540 | 8 MB | **CC0** (figshare c.5525688) | local `EU-Trees4F/Reproducibility_scripts/datasets/climate/historical` |
| D7 | **EU-Trees4F suitability rasters** | maps, current + future | 67 species; prob (WGS84 5′, 0–1000) and bin (EPSG:3035 10 km INSPIRE); cur2005, fut2035/65/95 × rcp45/85; pot / nat / disp / lu | 5′ | 2.1 GB local | CC0 | local `EU-Trees4F/EU-Trees4F_dataset`; figshare |
| D8 | **Atlas RPP** (relative probability of presence) | maps, default layer | 39 taxa (36 species + *Abies*, *Betula*, *Tilia* sp.) | 1 km, GeoTIFF | ≈ 20 MB zip each, ≈ 0.8 GB | JRC Data Catalogue, one DOI per layer (e.g. 10.2905/JRC.ZHQSSK0); use conditions "European Commission reuse notice", access "no limitations" (read by Milko 2026-10-30) = Commission Decision 2011/833/EU on the reuse of Commission documents, implemented as **CC BY 4.0**: reuse and redistribution allowed with credit and with changes indicated | `https://ies-ows.jrc.ec.europa.eu/efdac/download/Atlas/<Genus>-<species>_rpp.zip`; also INSPIRE **WMS view services** |
| D9 | **Atlas MHS** (maximum habitat suitability) | maps | 27 taxa (4 not in RPP: *Acer platanoides*, *Ostrya carpinifolia*, *Sorbus aria*, *S. torminalis*) | 1 km | ≈ 12 MB each, ≈ 0.3 GB | same as D8 | `…_mhs.zip`; WMS |
| D10 | **Atlas chorology polygons** (Caudullo et al. 2017) | **range outline on the map (decided 2026-10-30 over the coarser EU-Forest α-shapes D2)** | native / introduced ranges, the same mask EU-Trees4F used for its realised maps | vector | small | CC BY 4.0 | Mendeley Data `hr5h2hcgg4`, figshare per species |

Not used, by decision: the EU-Trees4F occurrence files (undocumented extra points), the v1 and v2
collections, any re-run of the suitability models.

## 2. Species coverage (item 1, continued)

Computed on 2026-10-30 from D1, D6/D7 and D8/D9 by scientific name; the table is
[`notes/2026-10-30-species-coverage.csv`](2026-10-30-species-coverage.csv) (249 rows; the
`eufgis_target` column is empty until the unit species list is read from `Units` at collection time).

| Set | Species | Notes |
|---|---|---|
| EU-Forest | 242 | 59 species with ≥ 1 000 occurrences, 125 with ≥ 100 |
| EU-Trees4F | 67 | 63 match EU-Forest by name; **4 use newer nomenclature**: *Aria edulis* (= *Sorbus aria*), *Cormus domestica* (= *S. domestica*), *Torminalis glaberrima* (= *S. torminalis*), *Borkhausenia intermedia* (= *S. intermedia*) |
| Atlas RPP ∪ MHS | 43 taxa | 3 are genus-level (*Abies*, *Betula*, *Tilia* sp.), 40 species |
| EU-Trees4F ∩ Atlas | 34 | the species with both a current 1 km map and future 10 km maps |
| EUFGIS target species | 98 (Atlas, 2016); 42 matched to EU-Trees4F in single-species units (FORGENIUS D4.7) | to be read from `Units.species_list` |

Consequences: the EU-Trees4F species cover 90 % of EU-Forest rows (528 539 of 588 983), so the
first scatterplot run covers nearly all observations; the **species table needs synonyms** from day
one (the four *Sorbus* cases prove it), which is also the hook for UPOV codes; map coverage is
43 species at best, so the map pane must say plainly when a species has no map.

## 3. Options and trade-offs (item 2)

**A. Climate source for the scatterplot axes**

| Option | For | Against | Pairs it serves |
|---|---|---|---|
| A1 EU-Trees4F 5′ (D6) | consistent with the EU-Trees4F maps; on disk; no database needed; the authors' baseline (1961–1990) matches the inventory years | 10 km: the 250 k cells collapse onto far fewer distinct values; WorldClim 1.4; only 7 variables | P1, P2, P3 (bio15 only for P5) |
| A2 WorldClim 2.1 (D4) | 1 km; monthly `srad`; 1970–2000; same grid family as the maps' inputs | database on the work server only; one future model | P1–P5 all |
| A3 CHELSA 2.1 (D5) | 1 km; 1981–2010; aridity, moisture, degree-days, PET extras | no monthly radiation (P4 would need annual mean); 1981–2010 is furthest from the inventory years | P1, P2, P3, P5; extras |

Decided order: A1 first, then A2 and A3 **if the three-source overlay shows a visible difference**.
The data design must therefore hold values from several sources side by side.

**B. Where the climate lookup runs**

| Option | For | Against |
|---|---|---|
| B1 key lookups in `GeoService` (decided for A2/A3) | single source of truth; keys derivable offline; batched primary-key reads; **the laptop holds the full grids, so this runs locally** (confirmed 2026-10-30) | must reuse the loader's centre arithmetic and verify a sample |
| B2 raster sampling with `rasterio` (decided for A1) | seconds; no database | WorldClim/CHELSA tifs are 2–7 GB per variable set and not on the laptop; scaling must mirror the loaders |
| B3 `/click` route per point | correct | 250 k HTTP calls; for the runtime map click only |

**C. Map data**

| Option | For | Against |
|---|---|---|
| C1 Atlas RPP/MHS GeoTIFFs (D8/D9), served by us | 1 km; EUFGIS samples among inputs; default layer | 43 taxa; ≈ 1.1 GB to host; licence line to confirm |
| C2 EU-Trees4F GeoTIFFs (D7), served by us | current + future, two scenarios; CC0; on disk | 10 km; 67 species |
| C3 JRC WMS view services for the Atlas layers | nothing to host | external dependency and styling; no future layers; portal embedding of a third-party WMS to be checked |
| C4 re-run the models | rejected 2026-10-30 | — |

**D. Storage**

| Option | For | Against |
|---|---|---|
| D-a new collections in `GeoService` + raster files on disk (recommended) | units, grids and the `Dataset` registry are there; our Foxx service lives there by decision; rasters do not belong in ArangoDB | adds collections to a production-bound database; naming must follow the dictionary |
| D-b a separate database | isolation | duplicates units and the registry; contradicts the Foxx decision |

**E. Granularity of the scatterplot data**

| Option | For | Against |
|---|---|---|
| E1 one document per EU-Forest cell with all indicator values per source, full precision (recommended) | one table serves every pair and every source; binning, density and rounding are display-time choices; 250 k documents | a pair query returns up to 250 k points: the Display Plan decides whether to aggregate on the fly or cache |
| E2 pre-binned pair collections per pair × source (v1) | tiny responses | combinatorial, frozen rounding, must be rebuilt for every change; can always be derived from E1 later |

**F. Units: point or polygon**

| Option | For | Against |
|---|---|---|
| F1 probe point (every unit has one) for the scatterplot; **polygon for the map** where a geometry exists and the unit is not restricted, point otherwise (decided) | one climate lookup per unit; the Atlas's own EUFGIS inputs were points; at 1 km only 1.8 % of unit shapes cover three or more grid cells (ingestion repo sizing, 2026-07-20), so a polygon-derived cloud would collapse to one or two points for almost every unit | large units are under-represented in the scatterplot |
| F2 polygon × grid for the scatterplot too (v1) | faithful for the few large units | a geometry intersection per unit for no visible gain on 98 % of them; optional later as a per-cell cloud for large units |

**G. Unit freshness.** `GeoService.Units` is refreshed yearly, while the live units sit in the
`metadata` database, which exposes **no web service for units today** (checked 2026-10-30). Decided:
work from the `Units` collection for now; Milko coordinates with the portal developers on how the
current climate reference point will be obtained. The design keeps the derived climate indicators
**cached by climate cell**, so a future live-units feed only has to supply number, species,
restriction flag, probe point and polygon, and the units snapshot rebuilds in seconds.

## 4. Where the data comes from and whether GeoService can be used (item 3)

Yes, GeoService is the right home, for three reasons that Phase 1 established: the units layer is
already there (`Units` probe points, restriction flag, species list); the 1 km climate grids are there
with offline-derivable keys; and the project's own Foxx service was decided to live there. What
GeoService does **not** hold and we bring in: D1 EU-Forest (local CSV), D6 and D7 EU-Trees4F (local),
D8 and D9 Atlas rasters (download), and the derived indicators, which are not stored anywhere today.

Where things run: **the laptop is the working platform** (decided 2026-10-30). Its `GeoService`
holds the full grids, units and registry; the work server, now reduced, carries a slower copy for
colleagues to look at and receives our results when they are ready. Everything, grid lookups
included, runs on the laptop; results are loaded into `GeoService` through the same `arangojs` path
the ingestion repository uses, with credentials taken from its `globals/auth` convention, never
committed here. Size is not a constraint: the new collections add well under 1 GB to a 1.6 TB
database, and the rasters stay on disk.

## 5. Proposed solution (item 4)

Four collections in `GeoService`, prefixed **`Scatter`** (decided 2026-10-30), every property a
dictionary term:

1. **`ScatterSpecies`** — the species table. `_key` = a stable surrogate (MD5 of the scientific name)
   so that a UPOV code can be added as an indexed property later without re-keying;
   `species` (scientific name, unique index, the identifier for now), `aliases` (synonyms, e.g. the
   four *Sorbus* cases), coverage flags and counts (`euforest`, `eutrees4f`, `atlas_rpp`, `atlas_mhs`,
   `eufgis_target`), the available map layers.
2. **`ScatterOccurrences`** — one document per EU-Forest cell (250 569). `_key` = MD5 of the EPSG:3035
   centroid string (stable); `geometry_point` WGS84; the original X, Y; `species_list`; source flags;
   then **one sub-object per climate source**, each holding the containing cell's key (`geometry_hash`
   for WorldClim / CHELSA) and the indicator values needed by P1–P5 plus the derived ones
   (summer T, summer P, winter P, continentality, coldest-month mean T, spring-summer radiation,
   Atlas seasonality), full precision. This is E1: every pair and every source is a projection of this
   collection.
3. **`ScatterUnits`** — one document per unit (≈ 2 819), **materialised** (decided), rebuilt by a
   refresh command from `Units` + `UnitPolygons` at any time. `_key` = `gcu_id_number`; `species_list`;
   restriction flag; the probe point's climate-cell keys; the same per-source climate sub-objects at
   the probe point; a reference to the unit's polygon(s) for the map when a geometry exists. Restricted
   units are present with climate values only: no coordinates and no geometry in our documents.
4. **`ScatterMaps`** — the raster and vector manifest: species, source (Atlas RPP / Atlas MHS /
   EU-Trees4F / Atlas chorology), layer type, period, scenario, variant (pot / nat / disp / lu), file
   path, CRS, resolution, licence, citation (the layer's DOI and chapter for the Atlas). The GeoTIFFs
   live on disk under a `maps/` tree, converted to Cloud-Optimised GeoTIFF on ingest so Phase 3 can
   tile them; the chorology polygons (D10) are stored as GeoJSON next to them.

Plus **`Dataset` records** in the `std_dataset` target shape: one per external source (EU-Forest,
EU-Trees4F predictors, EU-Trees4F rasters, Atlas RPP, Atlas MHS, Atlas chorology) and **one per new
collection** (`ScatterSpecies`, `ScatterOccurrences`, `ScatterUnits`, `ScatterMaps`), so the maps and
scatterplots cite what they show; and **seven term requests** to `metadata-store` (the handoff's §D)
before any derived value is loaded.

The pipeline, in Node following the ingestion repository's conventions, with a pluggable climate
source: `species` (build the table from D1 + D6/D7 + D8/D9 + `Units`) → `occurrences` (aggregate D1 by
cell, reproject, key) → `climate:<source>` (EU-Trees4F raster sampling; WorldClim / CHELSA key
lookups on the server) → `derive` (the seven indicators from monthly values) → `validate` (dictionary
validator) → `load` → `units` (same for probe points) → `maps` (download, verify, convert, manifest)
→ `stats` → `compare` (the three-source overlay report that decides whether A2/A3 are worth it).

Settled on 2026-10-30: prefix `Scatter`; the Atlas chorology (D10) as range outline; `ScatterUnits`
materialised; units from the `Units` collection for now; **Atlas licence resolved**: the catalogue
records (e.g. https://data.jrc.ec.europa.eu/dataset/01009127-5ddf-4f69-8a6b-30e6218f17bb) state
"European Commission reuse notice" and "no limitations", which is Commission Decision 2011/833/EU,
implemented as CC BY 4.0 (https://commission.europa.eu/legal-notice_en). Obligations: credit the
source (the layer's DOI and the chapter citation, as the Atlas asks), indicate changes (our COG
conversion and any reprojection), never imply Commission endorsement. Nothing else is open.

## 6. Data collection plan (item 5, final)

| Step | Input | Output | Check |
|---|---|---|---|
| 1 | D1 CSV, D6/D7 lists, D8/D9 catalogue, `Units.species_list` | `ScatterSpecies` + the coverage CSV refreshed with `eufgis_target` | 242 EU-Forest names present; the 4 synonyms resolve; every unit species maps to a row or is reported |
| 2 | D1 | `ScatterOccurrences` skeleton: 250 569 cells, keys, WGS84 points, species lists | row and cell counts equal the Phase 1 figures; keys unique; all points inside the land mask |
| 3 | D6 rasters | EU-Trees4F sub-object on every cell (7 values) | sampled values spot-checked against `gdalinfo -stats` and manual reads; no-data cells reported |
| 4 | `GeoService.WorldClim` | WorldClim sub-object (cell key + values + derived), via a **`ScatterCells` cache of derived indicators per climate cell** | 500 offline keys verified by `DOCUMENT()`; `/worldclim/click` agrees on 50 random points |
| 5 | `GeoService.Chelsa` | CHELSA sub-object, same cache | same checks |
| 6 | `Units` + `UnitPolygons` + the cache | `ScatterUnits` (materialised; the refresh command) | one row per unit; restricted units carry no coordinates or geometry; `/data/climate` agrees on 50 units |
| 7 | D7, D8, D9, D10 downloads | `maps/` tree (COG + GeoJSON) + `ScatterMaps` manifest | checksums; CRS and resolution per file; one manifest row per file; licence and citation filled |
| 8 | all | `Dataset` records (sources + the four collections); validator sweep over every document | 0 validator errors; counts match |
| 9 | `ScatterOccurrences` | the three-source comparison report (same pair, three sources, per species) | the decision input for A2/A3 |

All steps run on the laptop against its `GeoService`; the work server receives the result afterwards.

Order of work: steps 1–3 and 7 need no database and start first; steps 4–6 need the seven
dictionary terms before their derived values are loaded (the computation can be built and tested
meanwhile); step 9 closes the phase's climate question. Follow-up outside this plan: Milko's
coordination with the portal developers on a live source for the units' climate reference point.
