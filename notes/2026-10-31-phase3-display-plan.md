# Phase 3 — Display Plan

Date: 2026-10-31. Status: **in progress.** Questions 3 and 4 answered by measurement (section 2);
candidates in section 3; examples built (section 4). **The map pane is settled on the OpenLayers
example** ("now it is perfect", Milko, 2026-10-31): base maps, species-driven layers, live faceted unit
search, per-layer transparency, click read-out. **Next session: the scatterplot** — what the interface
shows, with the same search pane — and the context for the Serve Plan. Pending for the units: the
reference-point distance flag (threshold 5 km unless Milko prefers another).

## 0. What the display must do (from the brief and the Phase 1–2 decisions)

**Scatterplot pane.** The Atlas autoecology diagram with a third layer: grey = all 250 569 EU-Forest
cells, blue = the species' cells (up to 75 720), on top the species' gene conservation units (up to
664 for *Picea abies*, 3 669 in all). Five indicator pairs. Three climate sources, each with a present
period and future periods (EU-Trees4F × 2 RCPs, CHELSA and WorldClim × 1 scenario). **The future is
the core view**: a unit, or the whole species cloud, shown in the climate of a later period, so that
units at the edge of their species' climate can be found. Users must zoom into regions of the plot.
A location clicked on the map must appear as a point in the scatterplot. Restricted units appear in
the scatterplot but never on the map.

**Map pane.** Per species: the Atlas relative probability of presence (default, 1 km), the Atlas
maximum habitat suitability (1 km), EU-Trees4F suitability (10 km, current and three future periods ×
two RCPs, probability or binary, potential / realised / dispersal / land-use variants), the chorology
polygons as range outline, and the units on top (polygons where they exist and are unrestricted,
points otherwise). Users must navigate the map.

**Both panes** must work stand-alone and embedded in a TYPO3 page (Phase 4), which argues for plain
web components with no framework lock-in and for data served by our own Foxx service in GeoService.

## 1. The data to display, as it is stored

| Layer | Source | Size |
|---|---|---|
| base | `ScatterOccurrences`, one pair of values per cell per source and period | 250 569 points |
| species | the same, filtered by `species_list` (persistent array index) | 35 795 (beech) … 73 987 (Scots pine) |
| units | `ScatterUnits`, filtered by species | 530 (beech) … 664 (spruce) |
| map rasters | `ScatterMaps` → COG files on disk | Atlas 19–25 MB per layer with overviews; EU-Trees4F 0.1 MB |
| range outline | chorology GeoJSON | ≤ 0.1 MB per taxon |
| clicked location | `WorldClim` / `Chelsa` cell by geo index | 1 document |

## 2. Questions 3 and 4 — on the fly, or static? (measured 2026-10-31, laptop ArangoDB 3.12)

| Query | Rows | Time | JSON |
|---|---|---|---|
| base pair, WorldClim present | 247 881 | 0.9 s | 2.7 MB |
| base pair, CHELSA 2071–2100 | 248 836 | 0.8 s | 3.3 MB |
| species pair, beech | 35 795 | 0.14 s | 0.4 MB |
| species pair, Scots pine | 73 987 | 0.31 s | 0.8 MB |
| units pair, beech, present + 2071–2100 | 530 | 5 ms | 20 KB |
| base binned 0.5 °C × 50 mm (density) | 1 487 | 0.47 s | 20 KB |
| species binned, beech | 593 | 0.14 s | 10 KB |
| base rounded 0.1 °C / 1 mm, unique (the v1 idea) | 102 898 | 0.6 s | 1.2 MB |
| climate at a clicked point (geo index over 26 M cells) | 1 | 19 ms | — |
| species table, map manifest for a species | 271 / 40 | 2 ms | — |

**Answer.** Everything is feasible on the fly; the only query that is too slow and too large to repeat
per user interaction is the **base layer** (a second and 3 MB, and there are 5 pairs × 3 sources ×
up to 5 periods = up to 75 of them). So:

- **Static:** the base layer per pair × source × period, precomputed once at load time into compact
  files (a typed float array is 2 MB, gzipped under 1 MB) and served as files; the rasters as COG files.
- **Dynamic:** the species layer (0.1–0.3 s, index-backed), the units (milliseconds), the clicked
  location, the species table and the manifest, all through our Foxx service.
- **Either:** server-side binning returns in 0.5 s and 20 KB, so a density view of the base can be
  dynamic if the display chooses it, or precomputed alongside the point files.

## 3. Candidate technologies

**Scatterplot.** The base layer is the sizing problem: 250 k points with zoom.

| Candidate | How it draws | 250 k points | Zoom | Notes |
|---|---|---|---|---|
| D3 + Canvas 2D | own drawing loop | fine (one redraw ≈ 50–100 ms) | d3-zoom, rescaled axes | Milko's library; full control; density (d3-hexbin, d3-contour) in the same toolkit |
| D3 + WebGL via `regl-scatterplot` | GPU points, D3 axes | instant, millions | built in, lasso | small dependency; the proven way to draw this many points interactively |
| Plotly.js `scattergl` | WebGL, batteries included | fine | built in | heavy bundle (3 MB); the v2 prototype used it |
| Observable Plot | D3 under the hood, SVG/Canvas | too slow in SVG; Canvas marks fine | limited | declarative, little control |

Other graph types that convey the same message, for the base or for comparison: hexbin density of
the base with the species as points on top (what the Atlas effectively shows at print resolution);
contour (kernel density) outlines per species and per period, which make "the cloud moves" readable;
unit "arrows" from present to future position, as in EU-Trees4F Figure 1.

**Map.** The question is how a 20 MB 1 km COG reaches the browser.

| Candidate | Rasters | Vectors | Notes |
|---|---|---|---|
| OpenLayers | reads COG **directly** in the browser (`ol/source/GeoTIFF`, HTTP range requests, overviews) with client-side styling; EPSG:3035 native | GeoJSON, WFS | no tile server; needs a static file server that honours `Range`; the Foxx service does not, a web server does (Phase 4) |
| MapLibre GL JS | raster tiles only: needs a tile server (TiTiler) or a COG protocol plugin | vector tiles, GeoJSON | best vector cartography; an extra service for rasters |
| Leaflet + georaster-layer | reads COG client-side | GeoJSON | simpler, older; projection support weaker (EPSG:3035 needs proj4leaflet) |
| deck.gl | GPU layers over MapLibre; `ScatterplotLayer` could draw the scatterplot too | GeoJSON | one stack for both panes, heavier |

## 4. The examples (question 6)

Built under `examples/` against the real data exported by `sources/export/pair.js` (pair P1, beech,
present and future, `work/examples/data/`), served locally by `examples/serve.mjs` (static files with
`Range` support, so COGs work):

1. `scatter-d3-canvas.html` — D3 + Canvas: three layers, zoom, period switch, hexbin density toggle,
   present → future arrows for the units.
2. `scatter-webgl.html` — D3 axes + `regl-scatterplot` for the points: the same, at GPU speed.
3. `map-openlayers.html` — OpenLayers: Atlas RPP COG styled client-side, EU-Trees4F future layer,
   chorology outline, units; click → the clicked cell's values shown as a point on the scatterplot.

The choice is made on these, not on prose. **Built 2026-10-31**, to be opened by Milko: start the
server with `node examples/serve.mjs 8080` and open http://localhost:8080/examples/ . Libraries come
from CDNs (D3 7.9, d3-hexbin, Plotly 2.35, OpenLayers 10.2, proj4); the map works in the Atlas rasters'
own projection (EPSG:3035) so the 1 km COGs are read directly by byte range, never warped. The unit
geometries for the map come from `UnitPolygons` (all 441 unrestricted beech units have a polygon).

## 5. Decisions

| Date | Decision |
|---|---|
| 2026-10-31 | **Map pane, after review of the OpenLayers example (Milko):** the map is good. **Base maps**, in this order: none · Esri hillshade only · **OpenStreetMap grey (default)** · OpenStreetMap colour · OpenTopoMap (relief, contours). The grey default keeps the vegetation texture without the colour that collided with the Atlas green. Each service's attribution and usage terms are a Phase 4 item. |
| 2026-10-31 | **EU-Trees4F future layers:** the published future periods exist as potential, natural dispersal and their land-use clips (no "realised"); the example shows natural dispersal for 2095 RCP 8.5 in red next to the current realised map in orange; the pane must name the variant it shows. |
| 2026-10-31 | **A shared unit search pane** for map and scatterplot (Milko): country = the first three characters of the unit number (ISO 3166-1 alpha-3), unit number, species; Milko researches further fields. **Coordinate restriction is a request parameter**: restricted units are hidden by default; never on the map, on request in the scatterplot. **Per-layer transparency sliders** on both panes. First version built in the map example from an index exported from `ScatterUnits` (3 669 units, 37 countries, 123 species, 340 restricted). |
| 2026-10-31 | **Map pane colours and layout (Milko):** base map list gains "country boundaries only" (Natural Earth 1:50 m, public domain, drawn by the page) after "none"; Atlas presence green and suitability blue stay; EU-Trees4F current = yellow, future = magenta (orange = units, purple = chorology outline); the click read-out is its own row below the map. **Map pane approved.** Pending: a per-unit flag when the reference point lies more than 5 km from the unit polygon (28 units exceed 20 km today; data quality is a work in progress on the EUFGIS side). |
| 2026-10-31 | **Serving strategy (Milko agrees, Claude chooses):** two channels. **A Foxx service in `GeoService`** for everything that is a query — species layer, units, facet counts, manifest, click lookup, optional binned density; **static file hosting** (Phase 4) for the bulk: precomputed base layers per pair × source × period and the COG rasters read by byte range. Examples switch from exported files to the service once the scatterplot library is chosen. |
| 2026-10-31 | **Restricted units.** Only the portal talks to the database, which simplifies the model: the service takes a **restriction level** set by the portal per request — `hidden` (default for the public: restricted units absent everywhere), `values` (identifiers and climate values returned, no coordinates or geometry: the scatterplot default, since managers must see which units risk becoming unfit and a pair of 1 km climate values is shared by thousands of cells), `geometry` (coordinates and polygons returned, for an authenticated unit manager of that country, e.g. to review or edit the unit). The service never returns geometry below the `geometry` level, whatever else is asked. Measured 2026-10-31: every unit has a stored reference point and a polygon; of the 340 restricted units 135 points lie inside their polygon and the rest a median 0.6 km from it (max 25 km), so restricted units' climate values are representative and they belong in the scatterplot. |
