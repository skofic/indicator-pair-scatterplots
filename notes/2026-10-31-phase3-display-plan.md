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

The choice is made on these, not on prose.

**Scatterplot iteration 1 (2026-11-01)**, after Milko's design brief (one climate selector moving all
three layers; densities for base and species; the envelope; arrows; species and unit search; per-layer
dials): both pages rebuilt. Data: `sources/export/pair.js` writes pair P1 for every source × period ×
scenario (16 climates) and three species (beech, holm oak, spruce), 91 MB of JSON under
`work/examples/data/`. Each page: climate selector (16 entries), species selector, country / unit
search with the restriction toggle at the "values" level, base as hexagon (D3) or square (Plotly)
density or points, species as points or density, the **95 % envelope** of the species cloud (present
dashed, selected period solid — in D3 the boundary of the hexagon set holding 95 % of the points, in
Plotly a contour at the count level enclosing 95 %), arrows from present to selected period for the
units, opacity dials, URL parameters `?species=&climate=`. Screenshot of the D3 page for beech under
CHELSA 2071–2100: [`compare/d3-example-fagus-chelsa-2071-2100.png`](compare/d3-example-fagus-chelsa-2071-2100.png).
**Iteration 2 (2026-11-01, Milko's review):** points as the default for base and species; the climate
selector became **product → scenario → period** (a user cannot jump between products or mix methods:
the present is the "reference" scenario of each product); the D3 envelope is now a **smooth closed
contour** (blurred pixel histogram cut at the level holding 95 % of the mass, traced with
`d3.contours`), the same rule as Plotly's; **the axes are fixed per product** (present extent padded by
the future shift) so the view does not jump between periods, and the user's zoom survives (Plotly
`uirevision`); **box zoom by dragging** in D3 as in Plotly (wheel zoom, shift-drag pan, double-click
reset); hover on a separate overlay canvas with a 10 px hit radius and a highlight ring. Both pages
verified headless; D3 screenshot: [`compare/d3-example-fagus-eutrees4f-2051-2080-rcp85.png`](compare/d3-example-fagus-eutrees4f-2051-2080-rcp85.png).
**Iteration 3 (2026-11-01): the EU-Trees4F Figure 1 classification view**, a `View` selector on the D3
page, available for the EU-Trees4F product and a future period. Every base cell is classified from the
published binary maps (`sources/export/suitability.js`: current `cur2005` potential map vs the selected
period's map, potential or natural-dispersal variant) as stable (yellow), decolonised (red) or newly
suitable (blue), drawn at the cell's present pair values (or at the selected period's, a toggle) over
the grey cloud of all cells at both periods; black arrows give the mean climate shift per bin of the
species' current envelope (stable + decolonised cells; bin size and minimum count selectable, default
2 °C × 200 mm, ≥ 100 cells; the paper drew fifteen random bins), the thick arrow the shift of the whole
envelope; units stay at their present position with thin arrows to the selected period. **Period
pairing** follows the paper's Methods: a future map is driven by the climate of the previous 30 years,
so map 2035 ↔ climate 1991–2020, 2065 ↔ 2021–2050, 2095 ↔ 2051–2080 (the R scripts' `fut1..3`). Found
on the way: the 804 published dispersal binary rasters carry no CRS (same 10 km EPSG:3035 grid as the
potential ones, cropped by whole cells); the served COGs now get it assigned at conversion, the manifest
and the Dataset record say so. Screenshot, holm oak 2095 RCP 8.5:
[`compare/d3-example-ilex-classes-eutrees4f-2095-rcp85.png`](compare/d3-example-ilex-classes-eutrees4f-2095-rcp85.png).
**Iteration 4 (2026-11-01): the map → scatterplot link.** `examples/linked.html` puts the two pages in
two iframes; the map page gets a Draw selector (point, box, polygon; a plain click sends a point) and
posts the drawn geometry (WGS84 GeoJSON) with `postMessage`; the host page relays it to the scatterplot
page, which finds the surveyed cells inside (point: the containing cell, else the nearest within 5 km
with its distance stated) and draws them in teal at the selected period with present → period arrows.
The map's species choice travels the same way. Two independent pages, nothing shared but messages:
this is the pane model for the portal (Phase 4), where the host checks message origins. To make this
cheap on static files the export now follows **one global cell order** (`ScatterOccurrences` sorted by
key): `cells.json` holds the coordinates, the base files hold the pair per cell at each climate (null
where missing), the species layer is an **index list** per species (one file, climate-independent), the
suitability digits follow the same order. That is also the shape the Foxx service will serve: static
base per pair × climate, index lists for species, map areas and points, unit values. Deep links for
testing: `?point=lon,lat`, `?bbox=w,s,e,n`. Screenshot, beech cells of a Black Forest box under
WorldClim 2081–2100: [`compare/d3-example-fagus-mapbox-worldclim-2081-2100.png`](compare/d3-example-fagus-mapbox-worldclim-2081-2100.png).
**Iteration 5 (2026-11-01): the unit reference-point distance flag.** `sources/units/distance.js`
measures, for every unit with a reference point and a polygon (restricted ones included: a distance
reveals no location), the distance from the climate reference point to the polygon on the EPSG:3035
plane (shapely; 0 when inside) and stores it as `_custom.reference_point_distance_km` on `ScatterUnits`
(a non-term fact like the maps manifest; a dictionary term is to be requested if the flag stays);
`sources/units/load.js` keeps it across reloads. The exports carry it, and both pages flag the units
beyond a threshold (select 1 · 2 · **5** · 10 · 20 km): a dashed dark-red ring and a tooltip line in the
scatterplot, a dark-red dashed polygon and the distance in the click read-out on the map, "⚠ n km" in
the unit lists, a count in the status lines. Measured on all 3 669 units (2026-11-01): 3 175 reference
points lie inside their polygon, 115 more than 1 km away, **46 more than 5 km, 25 more than 20 km**, the
farthest 254 km (ROU00389; then IRL00009 220, CZE00084 219, CZE00156 197, LTU00013 156, SWE00356 151,
IRL00008 151, CZE00183 140, SWE00407 126, IRL00010 115, ESP00384 114, SWE00062 111, POL00091 111,
LTU00041 103, ESP00228 86, ESP00220 85, CZE00140 85, CZE00230 37, LTU00037 37, SVN00029 36, CZE00185 32,
SVK00131 28, LTU00125 25, SWE00008 23, LTU00122 21). Of the 530 beech units 13 are flagged at 5 km.
**Iteration 6 (2026-11-01, Milko's review of iterations 3–5):** clearing the map selection on either
pane clears both (the scatterplot's clear travels back through the host); changing the draw mode clears
both; a point sent from the map is a large teal mark with a ring and three expanding pulses on arrival;
the View selector names why its second entry is unavailable (EU-Trees4F and a future period needed);
the native sliders stay as they are (a stylesheet matter for the portal developers). **The joint page
rebuilt** (`examples/linked.html`): a **shared bar** owned by the host page (species, country, unit,
restricted units in the scatterplot, flag threshold, clear, layout), sent to both panes as one `filter`
message, the panes hiding their own copies when embedded (`?embedded=1`); the **layout follows the
window's shape** (side by side when wider than 5:4, stacked when taller, with a manual override), fixed
to the viewport so only the map and the plot react to the wheel. Milko's two set-ups (full-screen
browser on a second monitor; Safari in half a screen) both get near-square panes this way. Decisions
recorded: defaults of the class view accepted (present position, potential variant, 2 °C × 200 mm, ≥ 100
cells), 5 km threshold accepted, a `ui` namespace of dictionary terms for the panes' shared state and
the unit distance descriptor to be requested at the Phase 3 close. **Iteration 7 (same day, Milko):** a species without scatterplot
data **disables the scatterplot pane** (greyed, with the reason) instead of leaving another species on
show; a **divider** between the panes resizes them along the layout's axis (double-click resets); **the
map in its own tab or window**: a selector opens the map page in a new tab (no size given to `window.open`) or window, which keeps talking to the
host through `window.opener` with the same messages (the host hides the map pane, the scatterplot takes
the page; closing the window brings the map back). Two pages opened by hand in two tabs cannot talk,
since they have no common host; a `BroadcastChannel` would allow that for same-origin tabs if ever
needed.
**Iteration 8 (2026-11-09): the panes speak the dictionary.** The terms created in `metadata-store` on
2026-11-09 ([`2026-11-09-metadata-store-ui-terms-created.md`](2026-11-09-metadata-store-ui-terms-created.md))
are now what the three pages run on. `examples/dictionary.js` is the panes' access to the `metadata`
database's `/ui` service (read-only, anonymous, answers cross-origin): one `POST /term/bulk` per page
for every term it names, `POST /validate/document` with `compute: true` for the dictionary's defaults
of `ui_layout_state`. **Every label, option text, hover text, legend entry and axis legend comes from a
term**: `data-term` elements take `_info._title` as text and `_info._definition` as hover, selects take
their options from the enumeration elements in a declared order (value = gid, hover = definition), the
axes show the climate descriptor's title and unit symbol (`unit_*._code._symbol_print`), the status
and tooltips are composed from label terms. **The pane state is keyed by gids** (`species`,
`gcu_id_country` with `ISO_3166_1_*` values, `gcu_id_number`, `gcu_loc_coordinates-restriction_level`,
`gcu_loc_climate_flag`, `std_dataset_ids`, `env_climate_scenario`, `env_climate_period`,
`ui_layout_scatterplot_*`, `ui_layout_map_*`), starts from the dictionary's defaults, accepts any key as
a URL parameter, and is what the host page and the panes exchange (`{ type: 'state', …partial }`; the
map selection is `ui_layout_map_selection`, a geometry or null). `climates.json` now carries the dataset
key and the period and scenario gids per climate, so the files are found from the state. `?lang=<ISO
639-3>` switches every text once the terms carry that language; `?dict=` points at another dictionary
service. Observed defaults: the standalone scatterplot opens at the public restriction level (restricted
units hidden), the joint page sets the values level for both panes. **Hover rule (Milko, 2026-11-09):** hovering a label describes the field (the control term's
`_definition`), hovering a menu describes the chosen element (the selected option's `_definition`,
kept in step on change; the field definition where the options are data, e.g. units). The Source menu's
hover is the dataset record's definition. Still hard-coded: the word "Source" for the dataset selector
(no label term; `std_dataset_ids`'s title is "Dataset IDs"), the EU-Trees4F future map's fixed period on
the map, the interaction hints' language-independent symbols.
**Iteration 9 (2026-11-09): the pages run on the Foxx service.** `examples/service.js` is the panes'
access to `indicator-pair-scatterplots-service` (`/panes` in GeoService; `?api=` for another instance),
the twin of `dictionary.js`. The three pages read the catalogue (datasets, climates, axes, species with
availability, countries), the base layer per pair × climate, the species index list, the units per
restriction level with their values for every climate of the dataset, the map selection resolved by the
service (a polygon → cells; a point → the surveyed cell and the 1 km grid's values, so a click anywhere
gets a value, drawn as a diamond), the suitability classes, the units index and geometries, the maps
manifest. Consequences: **every EU-Forest species** (242) is available in the scatterplot, every unit on
the map; the **X and Y indicator selectors** exist (the five pairs suggested once when X changes, a
custom pair possible), axes fixed per source × pair; the **map's EU-Trees4F future layer has a period ×
scenario selector** and the variant; the unit polygons come on demand when a unit is chosen, the
overview shows reference points; the exported files under `work/examples/data/` are no longer read by
the pages (they stay as the pipeline's fixtures). `PanesSuitability` is filled by
`sources/export/suitability.js --write --all`: all 67 EU-Trees4F species, 804 documents. Found on the way: EU-Trees4F
names four Sorbus species by their modern genera (Aria edulis, Cormus domestica, Borkhausenia intermedia,
Torminalis glaberrima); the loader looks the rasters up under the species' aliases, and the maps manifest
now folds those names into the accepted ones, so the map shows their EU-Trees4F layers too.
Known limit: the arrow-bin sizes of the classes view are named in °C × mm whatever the pair.
**Iteration 10 (2026-11-10, step 3 — layout polish, first pass, for Milko's review).** One shared
stylesheet, `examples/panes.css`, for the three pages: colour and size tokens, one font size, uniform
native controls, a toolbar grammar (a toolbar is a wrapping row of **groups**, a group is a captioned
cluster of controls whose caption is a dictionary term: Climate, X · Y, View, Layer drawing, Unit,
Selection, Map selection; Base map, Draw, Atlas, EU-Trees4F, Map layers), a legend row of chips, a
status line with a busy spinner. The drawing settings of both panes sit in a **collapsible toolbar**
behind a ⚙ button, so the default view keeps the controls to two rows; the interaction hints are a
hover mark "?" at the start of the legend; the counts of the unit rows are short ("530 units · 89
restricted · ⚠ 13", the flag's meaning on hover). In the joint page the pane titles are hidden (the host
names the panes). Not touched: the native look of the controls (decision 2026-11-01), the colours of
the layers. Screenshots: [`compare/layout-joint-wide.png`](compare/layout-joint-wide.png),
[`compare/layout-joint-tall.png`](compare/layout-joint-tall.png).
**Iteration 11 (2026-11-10, step 3 — second pass):** the shared bar's three selectors became **one
search box** (type a species, a country or a unit number; grouped suggestions with counts and the Atlas /
scatterplot marks; arrow keys, Enter, Escape) and **filter chips** (the species always, the country and
the unit removable with ×; choosing a unit of another species switches the species); **the legend chips
toggle the layers** on both panes (map: the six layers; scatterplot: base, species and units, dimmed when
off, the drawing mode or opacity restored on the way back); the scatterplot's **status line became the
hover of an "i" mark** next to the "?" of the hints, with the busy spinner on the mark. The standalone
pane pages keep their selectors for development. Screenshot: [`compare/layout-joint-pass2.png`](compare/layout-joint-pass2.png).
**Iteration 12 (2026-11-10, step 3 — third pass, after Milko's review of passes 1–2):** **functional
grouping of the controls.** A group (`.group`) is now one functional cluster that never breaks across
rows: it moves to the next row as a whole, and only a group alone on its row and wider than the pane
shrinks its long-text menus (source, axes, species, country, unit, variant; never the short enumeration
menus) before the toolbar scrolls. The scatterplot's drawing settings split into one group per layer —
Base layer (drawing, opacity, position), Species layer (drawing, opacity, envelope), Units layer (opacity,
shift arrows) — plus the shared Layer drawing (hexagon radius); the classes controls are their own
group beside View; the unit search splits into Unit and Coordinates privacy on both panes. Labels that
repeat their group's caption lose the repeated words ("Base layer opacity" → "Opacity"; the full title
stays in the hover, `panes.js` `Pop.shortLabels`). The ⚙ buttons are labelled with their term's title
("⚙ Layer drawing", "⚙ Map layers"). The "i" and "?" marks became accent-ringed discs that glow once
when the status changes, and their popover (`panes.js` `Pop`, styled `.pop`: serif, one line per
fact) replaces the native tooltip; a click pins it (touch), Escape or a click elsewhere closes it; the
map gained its own "i" (the species' available layers). The map selection (green) is drawn last, above
the units. The host bar lost its "Pane layout" title and caption. The legend row is a wrapping flex
row (the chips and the projection note wrap). `?settings=1` opens the drawing settings at load.
**Cosmetic fixes after Milko's review of the pass (same day):** the opened drawing settings are a grid,
one row per layer with the captions in the first column and the first control of every row on the same
vertical line (the alignment draws the divider between the three layers and the common drawing section;
same on the map behind "⚙ Map layers"); the map gained a **reset view** button (fits the species' visible
units, else the initial view of Europe), on its own row with "⚙ Map layers"; the map's "i" lists, under the species as heading, its layers, the chosen country and unit (with the
restricted and far-from-polygon marks) and the counts of the units shown, one line each. Screenshot: [`compare/layout-joint-pass3.png`](compare/layout-joint-pass3.png). Left for the next pass
(Milko's list): the unit hover window on the map as on the scatterplot, option-click on the map to
select units, clicking a unit's area selects its reference point in the scatterplot, and an
instructions page for the search box; a `ui_layout_map_label_hints` term would give the map a "?".
**Iteration 13 (2026-11-10, the inter-pane unit selections, Milko's review of pass 3):** the units become one
thing on both panes. **Hover** a unit point on the map and the same window as in the scatterplot opens
(number, restricted mark, far-from-polygon warning, species, country; `.tip` in `panes.css`), the
cursor a pointer. **Option-click** a unit on either pane toggles it in the shared selection
(`ui_layout_scatterplot_units_selection`): the host relays the list to the other pane, and both draw
the selected units with the same black ring. **Click** a unit point or inside the chosen unit's polygon
on the map and the unit is chosen as from the search box: the host sets its chip and country, the map
shows its polygon, the scatterplot enlarges its reference point and pulses it in the units' colour
(the pulse also follows a unit picked in the search box); no climate read-out point is drawn for a
unit click. A unit the map already shows is not re-fitted when its number comes back from the host.
The map's "i" counts the selection. Not exercised headless (clicks and hovers), to be tried by Milko.
**Amended the same day after Milko's test** (hover and option-click fine; a clicked unit became the only
unit shown in the scatterplot, with no way back, and the Selection modes had nothing to act on): **the
three roles of a unit are formalised.** (1) **Filters** — the species and the country, set in the search
box (chips), decide which units are shown. (2) **The chosen unit** (`gcu_id_number`, "one conservation
unit to highlight and zoom to", as its term says) is a highlight, never a filter: set by the search box
or by a plain click on a unit point on either pane; the host shows its chip, the map shows its polygon
and zooms to it, the scatterplot draws it larger and pulses it; the other units stay visible. Cleared
by the chip's ×, by Escape on either pane, or by a plain click on empty space in the scatterplot (a drag
is never a click). A unit chosen on a pane does not change the country filter. (3) **The selection**
(`ui_layout_scatterplot_units_selection`) is the set built by option-click on either pane, drawn with
the black ring on both; the scatterplot's Selection mode (all / selected only / hide selected) and its
"clear" act on it. A unit-only or selection-only message is a light update on the scatterplot (no
reload). Noted: on macOS an option-click into the browser hides the application one comes from (Warp,
here) — a system behaviour, not the page's.
**The Selection group is shared (Milko, same day):** the count, the "Units shown" mode (all / only the
selection / hide the selection) and "clear" moved to the host's bar under the caption "Selected units"
(the title of `ui_layout_scatterplot_units_selection`, so the label names the units); the mode now acts
on both panes — the map hides the points the mode excludes — and the set is kept by the host, so a
reopened map pane gets it. The scatterplot keeps its own group for the stand-alone page only.
**Term follow-up for the next metadata-store batch:** `ui_layout_scatterplot_units_mode` and
`ui_layout_scatterplot_units_selection` now have page-wide scope and belong under `ui_layout_units_*`
(the pages read the gids from one table each; two lines to change).
**Done (2026-11-11): the `metadata-store` session applied the note** (`15e46e7`, work server reloaded `9449f57`):
`ui_layout_units` with `_mode`, `_all`, `_only`, `_hide`, `_selection`; `ui_layout_label_search`;
`ui_layout_map_label_hints`; both hint texts updated; the old `ui_layout_scatterplot_units_mode` /
`_selection` and `ui_layout_scatterplot_label_selection` removed; the state default is `ui_layout_units_all`.
**The three pages switched the same day:** the shared bar's search box is captioned "Search", the Selection group
reads the new gids, the map's legend row has its "?" mark. No old gid is left in the pages.
Not yet: the class of each unit's own cell (a service-side raster sample, so that restricted units get
it too). **Built 2026-10-31**, to be opened by Milko: start the
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
| 2026-11-01 | **Scatterplot library: D3 + Canvas** (Milko, after iteration 2 brought it level with Plotly on defaults, selector, envelope, hover, fixed axes and box zoom): Plotly's ease and polish do not beat D3's flexibility, and the pane must live inside TYPO3, where a 4.5 MB dependency we do not control weighs. Plotly is retired from the examples (kept in git history). **Unit selection**: option-click on a hovered unit toggles it in a selection; modes show all / only the selection / hide the selection; clear. |
| 2026-10-31 | **Map pane colours and layout (Milko):** base map list gains "country boundaries only" (Natural Earth 1:50 m, public domain, drawn by the page) after "none"; Atlas presence green and suitability blue stay; EU-Trees4F current = yellow, future = magenta (orange = units, purple = chorology outline); the click read-out is its own row below the map. **Map pane approved.** Pending: a per-unit flag when the reference point lies more than 5 km from the unit polygon (28 units exceed 20 km today; data quality is a work in progress on the EUFGIS side). |
| 2026-10-31 | **Serving strategy (Milko agrees, Claude chooses):** two channels. **A Foxx service in `GeoService`** for everything that is a query — species layer, units, facet counts, manifest, click lookup, optional binned density; **static file hosting** (Phase 4) for the bulk: precomputed base layers per pair × source × period and the COG rasters read by byte range. Examples switch from exported files to the service once the scatterplot library is chosen. |
| 2026-11-01 | **Figure 1 classification view built** (iteration 3, see §4): classes from the published EU-Trees4F binary maps, never recomputed; period pairing per the paper's 30-year lag; the view is labelled as a projection of present cells into the selected period's suitability. Pending Milko's review. |
| 2026-11-01 | **Map → scatterplot link built** (iteration 4, see §4): panes as independent pages linked by `postMessage`; layers as index lists on one global cell order, the shape the service will serve. Pending Milko's review. |
| 2026-11-01 | **Reference-point distance flag built** (iteration 5, see §4): threshold 5 km by default, selectable; distance stored on `ScatterUnits` under `_custom` and exported; 46 of 3 669 units exceed 5 km, 25 exceed 20 km (list in §4), for the EUFGIS data-quality work. Pending Milko's review. |
| 2026-11-01 | **Review of iterations 3–5 (Milko):** class-view defaults and the 5 km threshold accepted; a `ui` dictionary namespace for the panes' state plus the unit distance descriptor, requested at the Phase 3 close; the joint page gets shared controls and a layout that follows the window's shape; detaching the map to its own tab explored later. Built as iteration 6. |
| 2026-11-01 | **Next step (Milko): define the `ui` terms for the dictionary** before the Serve Plan. Noted by Milko: the dictionary is multilingual, so interface terms give a multilingual user interface for free (labels, option texts, tooltips from the terms' `_info` in each language). |
| 2026-11-09 | **Unit facts under their terms:** `sources/units/distance.js --write` stores `gcu_loc_climate_distance` on all 3 669 units and `gcu_loc_climate` (the reference point) on the 3 329 unrestricted ones, every value validated against the dictionary first (6 998 values, 0 errors); the pre-term `_custom` block is removed; the loader writes the same on a reload; the exports and the pages read the gid; the `SCATTER_UNITS` Dataset record lists both descriptors. 46 units exceed 5 km, unchanged. |
| 2026-11-09 | **The species layer is the reference and never moves** (Milko, agreed): in a future period the species cloud stays at the present climate (the realised niche, as the Atlas diagram and EU-Trees4F Figure 1 treat it); the units, the map-selected cells and the solid envelope move to the selected period; the base layer stays by default and moves **on request** (`ui_layout_scatterplot_base_position`, term requested in the handoff addendum): Europe's future climate space against the present niche shows whether the species' climate will still exist. The classes view keeps its own rule. |
| 2026-11-10 | **Review of passes 1–2 (Milko):** the search box stays (it needs an instructions page with examples); the legend toggles are good; the "i" / "?" marks are elegant provided they are visible without being loud and their text invites reading; "Pane layout" is implied and goes; the ⚙ button needs a label; the map selection must be the top layer; controls must be grouped functionally whatever the window's width. Later: unit hover and option-click selection on the map, a unit's area click selecting its reference point. Built as iteration 12. |
| 2026-11-12 | **Cursor term created** by the `metadata-store` session (`ui_layout_scatterplot_cursor`, default `false` in `ui_layout_state`; the page reads it, nothing changed). **Reset view as a mark** (Milko): both panes' *reset view* buttons became a third round mark (↺) beside the "i" and "?" in the legend row, the term's title as hover. **Elevation (Milko's question, built the same day on his go):** no external service — every 1 km WorldClim cell already stores the WorldClim 2.1 elevation layer (`properties.topography.geo_shape_elevation`) and every unit polygon its averaged topography (`chr_*` legacy names); the service returns the polygon's mean elevation with its minimum and maximum (plus sd, slope, aspect) under the dictionary's terms on the three units routes, and the elevation of a selected point with or without a climate; both hover windows, the map's click line and the scatterplot's map-selection label show it. Service commit on the laptop; **the work server's upgrade waits** for the server-drop check, since an upgrade empties the cache. |
| 2026-11-12 | **Milko's test notes, iteration 14:** (a) *Values* and *Management* differ on the map only through the manager's country: the service returns a restricted unit's point at the manage level for the requester's country alone (rule of 2026-10-31); the map page never sent the country, so restricted units never appeared — fixed: the country selector stands in for the manager's country (the portal will send it per request), the units reload when it changes at the manage level. (b) In the suitability-classes view the species layer ignored the hexagon mode — now one translucent hexagon layer per class, each hexagon more opaque with its count, so mixed bins show their classes superimposed (Milko's amendment the same day, after a first majority-class version hid the minor classes). (c) New *Cursor* option beside the map selection: hairlines from the pointer to both axes with the values tagged on the axes and written beside the switch; off by default; term requested from `metadata-store`: [`2026-11-12-handoff-metadata-store-cursor-term.md`](2026-11-12-handoff-metadata-store-cursor-term.md). |
| 2026-11-11 | **Work server deployed and verified at the public level:** project `Dataset` records copied, the service installed at `/panes` with `maxLevel` public (26 `??` / `?.` sites rewritten for 3.11's V8), the five collections sent from the laptop's dumps through the HTTP import API (250 569 occurrences in 2 h 29 min, 0 errors, every count equal to the dump), every route checked (3 329 units listed, none restricted; `manage` requests clamped to public), Foxx tests adapted to a public-only instance. Open: the static host for the pages and the 2.3 GB of map files (administrator), and **four nginx 502 drops under the service's heavier reads** to be checked in the server's log. Note: [`2026-11-11-work-server-publication.md`](2026-11-11-work-server-publication.md). |
| 2026-11-11 | **Publication on the work server decided (Milko):** the Serve Plan starts with it; restricted units are kept out by the service's `maxLevel` (public there), and the host page mirrors that maximum: the level is clamped to it and the control hidden when the maximum is public. Milko dumps and transfers the collections (no cache), the Foxx setup creates the indexes, Claude takes over from the files on the server. |
| 2026-11-11 | **Units terms moved and the pages switched:** `metadata-store` applied the handoff of 2026-11-10 (`15e46e7`); the pages read `ui_layout_units_*`, `ui_layout_label_search` and `ui_layout_map_label_hints`. |
| 2026-11-10 | **The Selection group is shared** (Milko): count, units-shown mode and clear in the host's bar, labelled "Selected units"; the mode acts on both panes. Term follow-up handed off the same day: [`2026-11-10-handoff-metadata-store-units-terms.md`](2026-11-10-handoff-metadata-store-units-terms.md) (the move under `ui_layout_units_*` with new texts, a `ui_layout_label_search` label for the search box, the hints of both panes). |
| 2026-11-10 | **The three roles of a unit (decided with Milko's test of iteration 13):** species and country filter; the chosen unit (`gcu_id_number`) highlights on both panes and never filters, cleared by chip, Escape or a click on empty plot space; the selection (option-click) is the set the Selection mode and "clear" act on, drawn on both panes. Built the same day. |
| 2026-11-10 | **Inter-pane unit selections built** (iteration 13): unit hover window on the map, option-click selection shared and drawn on both panes, a unit click on the map chooses the unit and pulses its reference point in the scatterplot. Pending Milko's review. |
| 2026-11-10 | **Review of the third pass (Milko):** the marks and their popover are right; cosmetic fixes requested and built — the layer rows aligned as a grid on both panes, a reset view button on the map, one line per layer in the map's "i". Next: the inter-pane unit selections (unit hover and option-click on the map, a unit's area click selecting its reference point). |
| 2026-11-10 | **Layout polish, third pass** (iteration 12): functional groups that never break, one group per layer, short labels under captions, labelled ⚙ buttons, prominent marks with a reading popover, map selection on top. Pending Milko's review. |
| 2026-11-10 | **Layout polish, second pass** (iteration 11): search box with suggestions and chips in the shared bar, legend chips as layer toggles, status as a hover. Pending Milko's review. |
| 2026-11-10 | **Layout polish, first pass** (iteration 10): shared stylesheet, grouped and captioned toolbars, collapsible drawing settings, legend chips, short counts. Pending Milko's review. |
| 2026-11-09 | **The pages run on the Foxx service** (iteration 9): all species, all units, five pairs with X / Y selectors, the map's period selector; click anywhere → the 1 km grid's values. The exported files are fixtures only. |
| 2026-11-09 | **The panes run on the dictionary terms** (iteration 8): labels, options, hovers, legends and axis legends from `metadata/ui`; the state keyed by gids and validated against `ui_layout_state`; `dictionary.js` shared by the three pages. Next: `gcu_loc_climate_distance` on `ScatterUnits`, then the Foxx service taking a `ui_layout_state`. |
| 2026-10-31 | **Restricted units.** Only the portal talks to the database, which simplifies the model: the service takes a **restriction level** set by the portal per request — `hidden` (default for the public: restricted units absent everywhere), `values` (identifiers and climate values returned, no coordinates or geometry: the scatterplot default, since managers must see which units risk becoming unfit and a pair of 1 km climate values is shared by thousands of cells), `geometry` (coordinates and polygons returned, for an authenticated unit manager of that country, e.g. to review or edit the unit). The service never returns geometry below the `geometry` level, whatever else is asked. Measured 2026-10-31: every unit has a stored reference point and a polygon; of the 340 restricted units 135 points lie inside their polygon and the rest a median 0.6 km from it (max 25 km), so restricted units' climate values are representative and they belong in the scatterplot. |
