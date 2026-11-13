# The `_info` fields beyond title, definition and description — content census for the panes (2026-11-13)

**Status: reviewed by Milko on 2026-11-13.** The rows stand, with the changes of §10. The term rows went to
`metadata-store` as [`2026-11-13-handoff-metadata-store-info-fields.md`](2026-11-13-handoff-metadata-store-info-fields.md),
which also lists the terms that are form fields (to be stated in their descriptions; a new `_term_role`
element was considered and dropped the same day). The
dataset-record rows (I12 to I14, M7, M8, R7, R8) were loaded on the laptop the same day
(`sources/datasets/records.js --write --update`); the showcase server gets them with the next copy of
`GeoService`. Texts are proposals in English; the final wording is Milko's and the `metadata-store` session's.

Step 2 of the order agreed on 2026-11-13: (1) dictionary site, done; **(2) fill the fields**; (3) the panes
show them; (4) the narrative manual pages.

## 1. Which field carries what

| Field | Rule for the panes | Shown where (step 3) |
|---|---|---|
| `_title` | The label, the option text, the legend entry | as today |
| `_definition` | One sentence: the hover text | as today |
| `_description` | What the thing **is** and how it behaves. No history, no advice | the "i" popover, as today |
| `_uses` | What a user **does with it**: the question it answers for a unit manager | the "i" popover, under the description |
| `_methods` | How a value or a drawing is **produced**, where that affects how far it can be trusted | the "i" popover, under the uses; the term page |
| `_issues` | What the user must **keep in mind**: a limit, a substitution, a known defect | a warning mark beside the control; the term page |
| `_examples` | Worked examples. On `ui_layout_state`: pane states, each a link that opens the panes | the start page and the tutorial |
| `_references` | `_citation`: what to cite when the thing is used; `_url`: where it comes from | "Sources and how to cite"; the term page |
| `_notes` | Decision history and curation remarks. Never shown to users | nowhere |
| `_story` | Not used for now (the tutorial goes to the `manual` collection) | — |

Present state (laptop dictionary, 2026-11-13): of the 122 `ui_layout` terms all have a title and a
definition, 73 a description, none any other field. One climate term has `_issues`. Of our ten dataset
records six have a citation, none has `_issues`.

## 2. `_issues` — 11 proposals

On terms:

| # | Term | Proposed text |
|---|---|---|
| I1 | `env_climate_srad_spring-summer` | Keep the existing text, without its last clause "(decision of 2026-10-30 …)", which moves to `_notes` (§7) |
| I2 | `ui_layout_map_selection` | "On this server the values of a place come from the **nearest surveyed forest cell within 5 km**, not from the place itself, and the label states the distance. A place farther than 5 km from any surveyed cell has no values. Where the full 1 km climate grids are installed, WorldClim and CHELSA values come from the grid cell containing the place." |
| I3 | `ui_layout_scatterplot_base` | "The base layer is the forest that was **surveyed**, not Europe's whole climate space: 250 569 cells of 1 km from national forest inventories, denser in some countries than in others. An empty region of the plot may be a climate without forest plots, not a climate without forest." |
| I4 | `ui_layout_scatterplot_species` | "EU-Forest records **presence only**, around 2005. A cell without the species is not evidence of absence, and the cloud shows where the species was recorded, planted stands included, not the full range of climates it tolerates." |
| I5 | `ui_layout_scatterplot_species_envelope` | "The envelope describes the climate of the **recorded** occurrences (see the species layer). A unit outside it is outside the climate where the species was found in the inventories; that is a signal to look closer, not a prediction that the population will fail." |
| I6 | `ui_layout_scatterplot_layer_arrows` | "A future position is the **climate projected for the same place**, not a forecast for the population: the place does not move, and whether the trees persist depends on more than these two indicators." |
| I7 | `env_climate_period_worldclim21` | "Future periods come from **one climate model** (MPI-ESM1-2-HR) under **one scenario** (SSP3-7.0). Future mean temperature is approximated as the mean of the daily maximum and minimum, and no future solar radiation exists, so the radiation axis is available for the reference period only." |
| I8 | `env_climate_period_chelsa` | "Future periods come from **one climate model** (MPI-ESM1-2-HR) under **one scenario** (SSP3-7.0). CHELSA's precipitation is higher than WorldClim's over the surveyed cells (medians 15–20 % higher for every species tested), so positions on a precipitation axis are not comparable between the two sources. No monthly radiation: the radiation axis is not available." |
| I9 | `env_climate_period_worldclim14` | "10 km cells: in mountains one value stands for a wide range of elevations. The reference period is 1961–1990, earlier than the other sources'. Futures are the mean of eleven regional models, which hides their spread." |
| I10 | `ui_layout_scatterplot_view_classes` | "The classes come from the published EU-Trees4F **binary maps** and are never recomputed here. They exist for the 67 species EU-Trees4F modelled and for the EU-Trees4F source only. 'Newly suitable' with the potential variant ignores whether the species can get there." |
| I11 | `gcu_loc_climate` | "A unit's climate is read at **one point**. For a large unit or one on a slope the point may not represent the whole unit, and where the point lies far from the polygon (`gcu_loc_climate_distance`) the values stand for another place." |

On our own dataset records (`GeoService.Dataset`, loaded by this repository):

| # | Record | Proposed text |
|---|---|---|
| I12 | Occurrence cells (`289557153329`) | Move the "Caveats:" sentence of the description here: the WorldClim future temperature approximation, the absence of future radiation, and "1 715 cells lie outside the land mask of the 1 km grids and have no WorldClim or CHELSA values" |
| I13 | EU-Trees4F maps (`289550053601`) | Move "Known defect of the published files: …" (the dispersal rasters without a coordinate reference system) from the description here |
| I14 | Units (`289557153334`) | "26 target species of units (for example *Fagus orientalis*, 28 units) match no occurrence or map source: those units appear without a species layer." |

**Question A (Milko).** I8's precipitation remark and I7's approximation are facts about how *we* use
WorldClim and CHELSA. I put them on the period sections, which are ours. The dataset records of WorldClim
2.1 and CHELSA 2.1 themselves belong to `metadata-external-databases` and already use `_issues` for the
data-quality report. Should the precipitation difference also be stated there? That is that repository's call.

## 3. `_uses` — 14 proposals

| # | Term | Proposed text |
|---|---|---|
| U1 | `ui_layout_scatterplot` | "To see where a species' conservation units sit in the climate the species occupies today, and where the climate of the same places is projected to be: units near or beyond the edge of the species' cloud are the ones to look at first." |
| U2 | `ui_layout_map` | "To find the units and the species' range on the ground, and to ask the scatterplot about a place or an area by drawing it." |
| U3 | `ui_layout_scatterplot_species_envelope` | "The reference line for reading the units: inside it, the unit's climate is one where the species is commonly recorded; near the line, the unit is at the margin; outside it in a future period, the unit's place is projected to leave the climate the species occupies today." |
| U4 | `ui_layout_scatterplot_layer_arrows` | "To read direction and distance of the projected change for each unit: long arrows pointing out of the envelope mark the units most exposed; arrows staying inside mark units likely to remain within the species' present climate." |
| U5 | `ui_layout_scatterplot_base_position` | "Switch to the selected period to ask whether the species' present climate will still exist somewhere in surveyed Europe: where the future base no longer overlaps the species cloud, that climate disappears; where it does, those are candidate areas for seed transfer or new units." |
| U6 | `ui_layout_scatterplot_view` | "Use the layers view to judge units against the species' climate; use the classes view to see what the EU-Trees4F models conclude for each surveyed cell, and to compare with the paper's Figure 1." |
| U7 | `ui_layout_scatterplot_view_classes_variant` | "Potential answers 'where could the species live'; natural dispersal answers 'where can it arrive unaided'. The difference between the two is the area where assisted migration would be needed." |
| U8 | `ui_layout_scatterplot_X` (and `_Y`) | "Choose the pair that matches the question: annual temperature and precipitation for the overall position; summer temperature and precipitation for drought stress; continentality and winter precipitation for cold and oceanic limits; coldest-month temperature and radiation, seasonality and driest-month precipitation with the 1 km sources." |
| U9 | `ui_layout_scatterplot_cursor` | "To read the exact values of a point of interest, for a report or to compare with a threshold." |
| U10 | `ui_layout_map_draw-mode` | "Draw a point to place a site, for example a candidate location for a new unit or a seed source, in the species' climate; draw a box or polygon to see the climate of all surveyed cells of a region." |
| U11 | `ui_layout_units_selection` | "To follow a few units across settings (other periods, other axes, the other pane) and to send a colleague a view with the same units marked." |
| U12 | `ui_layout_units_mode` | "Show only the selection to compare a few units without the others; hide the selection to see what remains." |
| U13 | `gcu_loc_climate_flag` | "To spot units whose climate values may describe another place: check their reference point with the unit's data manager before drawing conclusions from their position." |
| U14 | `ui_layout_map_layer_t4-future` with `ui_layout_map_layer_t4-current` | "Compare the two layers to see where the models lose or gain suitable area; with the units on top, units outside the future layer are the ones the models place in unsuitable climate." |

## 4. `_methods` — 8 proposals

The seven derived indicators already state their computation in `_description`; that stays (it defines the
quantity). `_methods` is proposed where a drawing or a value depends on a procedure:

| # | Term | Proposed text |
|---|---|---|
| M1 | `ui_layout_scatterplot_species_envelope` | "The species' cells are counted on a fine grid of the plot, the counts are blurred, and the contour is drawn at the density level that encloses 95 % of the cells. Computed in the browser at the reference period, for the chosen pair of indicators." |
| M2 | `ui_layout_scatterplot_base_hex`, `ui_layout_scatterplot_species_hex` | "Cells are counted in hexagons of the chosen radius (in pixels, so zooming refines them); the shade follows the count on a scale stretched to the densest hexagon in view." (wording to be checked against the code before the handoff) |
| M3 | `ui_layout_scatterplot_view_classes_legend` | "Each surveyed cell is read on two published EU-Trees4F binary maps of the species, the current one and the selected future one; the pair of answers gives the class." |
| M4 | `ui_layout_scatterplot_view_classes_bin` | Move the procedure from the description: bins of the two axes over the stable and decolonised cells, an arrow from the mean present to the mean future climate of each bin holding enough cells |
| M5 | `ui_layout_map_selection` | "A point is answered with the surveyed cell that contains it, or the nearest one within 5 km; an area with every surveyed cell whose centre lies inside it." |
| M6 | `gcu_loc_climate_distance` | Keep the first sentence of the description here (measured on the EPSG:3035 plane to the nearest polygon edge, 0 inside); the counts dated 2026-11-01 move to `_notes` |
| M7 | Occurrence cells record (`289557153329`) | "Each EU-Forest cell centre is reprojected to WGS84 and read in the grid cell that contains it, at each source's own resolution (1 km for WorldClim 2.1 and CHELSA 2.1, 5 arc-minutes for the EU-Trees4F predictors); no interpolation, no thinning." |
| M8 | Units record (`289557153334`) | "Each unit is read at its climate reference point in the same way as the occurrence cells. Rebuilt from the EUFGIS units by a refresh command; the date of the last refresh is the record's submission date." |

## 5. `_examples` on `ui_layout_state` — 6 proposals

Each example is a partial state. All six were validated on 2026-11-13 through
`POST /panes/state/validate` (answer `ok: true`, no errors or warnings); a deliberately wrong scenario was
refused. In the panes each becomes a link (step 3); in the tutorial each is one step.

| # | What it shows | State |
|---|---|---|
| E1 | A species today | `{"species": "Fagus sylvatica"}` |
| E2 | The same species at the end of the century | E1 + `"std_dataset_ids": ["289546028956"], "env_climate_scenario": "env_climate_scenario_rcp85", "env_climate_period": "env_climate_period_worldclim14_2051-2080"` |
| E3 | What the models conclude, cell by cell | E2 + `"ui_layout_scatterplot_view": "ui_layout_scatterplot_view_classes"` |
| E4 | One country's units | `{"species": "Abies alba", "gcu_id_country": "ISO_3166_1_ITA"}` |
| E5 | A place in the species' climate | `{"species": "Picea abies", "ui_layout_map_selection": {"type": "Point", "coordinates": [11.35, 46.5]}}` |
| E6 | Will this climate still exist? | `{"species": "Quercus ilex", "std_dataset_ids": ["bf102320-3726-48d1-b3fc-421f131c6666"], "env_climate_scenario": "env_climate_scenario_ssp370", "env_climate_period": "env_climate_period_worldclim21_2081-2100", "ui_layout_scatterplot_base_position": "ui_layout_scatterplot_base_position_future"}` |

**Question B (Milko).** Are these the species and places you want in the tutorial? E4 uses Italy because
Austria's units are all restricted and absent from the showcase server.

## 6. `_references` — 9 proposals

| # | Object | Proposed |
|---|---|---|
| R1 | `ui_layout_scatterplot_view_classes` | `_citation`: Mauri et al. 2022 (EU-Trees4F), "Figure 1" |
| R2 | `ui_layout_scatterplot` | `_citation`: de Rigo et al. 2016 (the Atlas autoecology diagrams, the model of the three layers); Mauri et al. 2017 (EU-Forest) |
| R3 | `ui_layout_map_layer_rpp`, `ui_layout_map_layer_mhs` | `_citation`: de Rigo et al. 2016; `_url`: Atlas data and metadata. The per-species layer DOI stays in `ScatterMaps` and is shown by the panes |
| R4 | `ui_layout_map_layer_chorology` | `_citation`: Caudullo, Welk & San-Miguel-Ayanz 2017 |
| R5 | `ui_layout_map_layer_t4-current`, `ui_layout_map_layer_t4-future` | `_citation`: Mauri et al. 2022 |
| R6 | `ui_layout_map_layer_base_boundary`, `_gray`, `_osm`, `_hillshade`, `_topo` | `_url`: the attribution each provider requires (Natural Earth; OpenStreetMap contributors; Esri; OpenTopoMap). Exact wording to be taken from the providers' terms before the handoff |
| R7 | Occurrence cells record (`289557153329`) | `_citation`: the sources it is derived from (Mauri 2017; Mauri 2022; Fick & Hijmans 2017; Karger et al. 2017), copied from those records |
| R8 | Units record (`289557153334`) | `_citation`: the same climate sources; `_provider`: EUFGIS |
| R9 | Species table and map manifest records | `_citation`: none needed (catalogues); keep the repository link |

## 7. `_notes` — decision history out of the descriptions

| Term | Text to move |
|---|---|
| `ui_layout_scatterplot_base_position` | "(decided 2026-11-09)" and the amendment of 2026-11-13 (the envelope no longer moves). **The description itself is stale**: it still says "the solid envelope" is moved by the future period. It was missed in this morning's handoff and needs the same correction |
| `env_climate_srad_spring-summer` | "(decision of 2026-10-30 to substitute the quantity rather than recompute the Atlas one)" |
| `gcu_loc_climate_distance` | "(on 2026-11-01, 46 of 3 669 units exceeded 5 km, 25 exceeded 20 km, the farthest 254 km)": a dated count, wrong after the next refresh |

## 8. What is not proposed

- No `_story`: the tutorial with screenshots goes to the `manual` collection (step 4).
- No new terms. If the review finds a caveat with no term to carry it, that is a term request, handled separately.
- No translation: English only, as everything else so far.

## 9. After the review

1. Accepted term rows → handoff note to `metadata-store`.
2. Accepted dataset-record rows → `sources/datasets/` here, reload on the laptop, then `deploy/` to the server.
3. Step 3: the panes read the new fields (warning mark, uses and methods in the popover, sources panel,
   examples as links, "more" links to `dictionary.skofic.io`).

## 10. After Milko's review (2026-11-13)

- **The envelope is a statistical measure** (Milko's question): the 95 % highest-density region of the
  species' cells (Hyndman 1996), no normal distribution assumed. M1 and I5 were rewritten to say so and a
  reference (R10) was added; the texts are in the handoff note, §B.2. While checking, the envelope was found
  to be computed on the *zoomed* plot, so that after a zoom it enclosed 95 % of the cells in view, with a
  narrower smoothing. Corrected the same day: it is computed once on the unzoomed plot and carried through
  the zoom (`examples/scatter-d3-canvas.html`), so the statement holds at any zoom.
- **M2** was checked against the code: the shade follows the logarithm of the count, up to the densest
  hexagon in view. **R6** carries the attributions the map displays; Esri's own list was not checked.
- **Question A** closed (Milko): WorldClim and CHELSA are two ways of estimating the climate, neither an error
  nor the truth. No warning: the precipitation remark leaves I8 and becomes a neutral sentence in the
  description of both period terms (handoff §B.2); nothing on the dataset records.
- **Question B**: the six examples are accepted; the scientists may propose more relevant ones later.
- **Form fields**: 34 `ui_layout` terms are controls of the form; four state properties are set by gestures;
  eight data descriptors are shown as selectors, of which two (restriction level, flag distance) take the
  role. All confirmed by Milko; 36 terms are stated as form fields, without a new role. Lists in the handoff note, Part A.
