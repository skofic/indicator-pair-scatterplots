# The pane terms, as created in `metadata-store` (2026-11-09)

From the `metadata-store` session, answering [`2026-11-09-handoff-metadata-store-ui-terms.md`](2026-11-09-handoff-metadata-store-ui-terms.md). Every term of the handoff exists; the twelve §D corrections were applied as proposed (Milko, 2026-11-09), `ui_layout_state` was created with the defaults as constants, and a manual page describes the panes. This note is the lookup table for renaming the state keys of the three example pages and reading their texts from the terms.

## What to read where

- **Texts.** `POST /_db/metadata/ui/term/bulk` with the gids below returns each term with `_info._title` (label, option text, legend entry), `_info._definition` (hover text) and `_info._description` (the text behind an info symbol, Markdown), keyed by language (`ISO_639_3_eng` today).
- **Options.** `GET /_db/metadata/ui/enum/<root>` lists a root's elements with their terms; `GET /_db/metadata/ui/enum/env_climate_period` returns the three source **sections** (`children` 4 / 5 / 4), `?branch=env_climate_period_chelsa` one source's periods, and `GET /_db/metadata/ui/enum/env_climate_period_chelsa` the same four, because every period edge carries both the root and its section in `_path`.
- **A state.** `POST /_db/metadata/ui/validate/document` with `{ "document": <state>, "descriptor": "ui_layout_state", "compute": true }` validates a full or partial state and returns `document` with every absent default filled (34 constants) — the object the panes start from.
- **Aliases.** Where a stored or wire value differs from the gid it is the element's `_aid[0]`: the period strings, the scenario keys, the class digits, the bin pairs, the variant codes. Every other option is identified by its gid; the pages' current strings (`layers`, `points`, `osm-gray`, `Point`…) have no alias and are to be replaced by the gids.

## State keys (`ui_layout_state`)

Main panel first, then the pane settings. "Code today" is the symbol or value in the example pages.

| Code today | Term (gid) | Kind | Values / alias | Default (constant) |
|---|---|---|---|---|
| `species` (selected) | `species` | string | | — |
| `species` (options) | `species_list` | set of strings | | — |
| `country` | `gcu_id_country` | enum | members of `eufgis_countries` (47; the root itself is not a key) | — |
| `unit` (selected) | `gcu_id_number` | string `^[A-Z]{3}[0-9]{4,5}$` | | — |
| `unit` (options) | `gcu_id_number_list` | array of unit numbers | | — |
| `product` | `std_dataset_ids` | set of dataset `_key` | | — |
| `scenario` (`''`, `ssp370`, `rcp45`, `rcp85`) | `env_climate_scenario` | enum | `env_climate_scenario_historical` (aid `historical`, no data key), `_ssp370`, `_rcp45`, `_rcp85` (aids = the data keys) | `env_climate_scenario_historical` |
| `period` (`src\|period\|scenario`) | `env_climate_period` | enum, sectioned | `env_climate_period_<section>_<period>`; aid = the bare period string (`1961-1990`); sections `env_climate_period_worldclim14` / `_worldclim21` / `_chelsa` | — |
| pair → x | `ui_layout_scatterplot_X` | descriptor key | one of `env_climate_bio01`, `_tas_summer`, `_continentality`, `_srad_spring-summer`, `_pr_seasonality-ratio` (the option set and the X → Y pairing stay in the service configuration) | — |
| pair → y | `ui_layout_scatterplot_Y` | descriptor key | `env_climate_bio12`, `_pr_summer`, `_pr_winter`, `_tas_coldest`, `_bio14` | — |
| `layout` | `ui_layout_mode` | enum | `_auto`, `_side`, `_stack` | `ui_layout_mode_auto` |
| `detach` | `ui_layout_map_placement` | enum | `_page`, `_tab`, `_window` | `ui_layout_map_placement_page` |
| `restricted` (checkbox) | `gcu_loc_coordinates-restriction_level` | enum, root `gcu_loc_coordinates-restriction` | `gcu_loc_coordinates-restriction_public` / `_value` / `_manage` | `_public` |
| `flagKm` | `gcu_loc_climate_flag` | integer km, 0–1000 | offered 1, 2, 5, 10, 20 | 5 |
| `view` (`layers`, `classes`) | `ui_layout_scatterplot_view` | enum | `_layer`, `_classes` | `ui_layout_scatterplot_view_layer` |
| `baseMode` (`points`, `hex`, `none`) | `ui_layout_scatterplot_base_mode` | enum | `ui_layout_scatterplot_base_point` / `_hex` / `_none` | `_point` |
| base `.op` | `ui_layout_scatterplot_base_opacity` | integer %, 0–100 | | 100 |
| base position (added later the same day) | `ui_layout_scatterplot_base_position` | enum | `ui_layout_scatterplot_base_position_present` / `_future` — the base layer at the present climate or at the selected period's; shown only for a future period in the layers view | `_present` |
| `speciesMode` | `ui_layout_scatterplot_species_mode` | enum | `ui_layout_scatterplot_species_point` / `_hex` / `_none` | `_point` |
| species `.op` | `ui_layout_scatterplot_species_opacity` | integer %, 0–100 | | 100 |
| `envelope` | `ui_layout_scatterplot_species_envelope` | boolean | | true |
| `selMode` (`all`, `only`, `hide`) | `ui_layout_units_mode` (was `ui_layout_scatterplot_units_mode` until 2026-11-10; shared by both panes) | enum | `ui_layout_units_all` / `_only` / `_hide` | `_all` |
| units `.op` | `ui_layout_scatterplot_units_opacity` | integer %, 0–100 | | 100 |
| `selection` | `ui_layout_units_selection` (was `ui_layout_scatterplot_units_selection` until 2026-11-10) | array of unit numbers | | — |
| `hexR` | `ui_layout_scatterplot_layer_radius` | integer px, 2–10 | | 4 |
| `arrows` | `ui_layout_scatterplot_layer_arrows` | boolean | | true |
| cursor (added 2026-11-12) | `ui_layout_scatterplot_cursor` | boolean | | false |
| `tx` (zoom) | `ui_layout_scatterplot_zoom` | array of exactly four floats `[x0, x1, y0, y1]` | enforced by `_elements` 4–4 | — (absent = full range) |
| `variant` (`pot`, `disp`) | `ui_layout_scatterplot_view_classes_variant` | enum | `…_variant_potential` (aid `pot`), `…_variant_dispersal` (aid `disp`) | `_potential` |
| `classPos` | `ui_layout_scatterplot_view_classes_position` | enum | `…_position_present`, `…_position_future` | `_present` |
| `binSize` (`0.5,50` …) | `ui_layout_scatterplot_view_classes_bin` | enum | `…_bin_0-5x50` (aid `0.5,50`), `…_bin_1x100` (`1,100`), `…_bin_2x200` (`2,200`) | `_2x200` |
| `binMin` | `ui_layout_scatterplot_view_classes_bin_min` | integer ≥ 1 | offered 10, 30, 100, 300 | 100 |
| class digit | `ui_layout_scatterplot_view_classes_legend` | enum | `…_legend_0` … `_3`, aid = the digit the service returns | — |
| `basemap` (`none`, `boundaries`, `hillshade`, `osm-gray`, `osm`, `topo`) | `ui_layout_map_layer_base` | enum | `ui_layout_map_layer_base_none` / `_boundary` / `_hillshade` / `_gray` / `_osm` / `_topo` | `_gray` |
| `rpp`, `mhs`, `t4cur`, `t4fut`, `choro`, `units` | `ui_layout_map_layer_rpp`, `_mhs`, `_t4-current`, `_t4-future`, `_chorology`, `_units` | boolean each | | true, false, false, false, true, true |
| their sliders | `ui_layout_map_layer_<layer>_opacity` | integer %, 0–100 each | | 85, 85, 100, 100, 100, 100 |
| `draw` (`none`, `Point`, `Box`, `Polygon`) | `ui_layout_map_draw-mode` | enum | `ui_layout_map_draw-mode_none` / `_point` / `_box` / `_polygon` | `_none` |
| `map-selection` geometry | `ui_layout_map_selection` | GeoJSON Point or Polygon (WGS84) | | — |
| map window | `ui_layout_map_view` | GeoJSON Polygon (bounds) | | — |

Unit facts (data, not state): `gcu_loc_climate` (GeoJSON Point), `gcu_loc_climate_distance` (float km, 1 decimal, ≥ 0; replaces `_custom.reference_point_distance_km` in `ScatterUnits`).

Root descriptors: `rcp45`, `rcp85` (open objects beside `ssp370`), the nesting keys of the EU-Trees4F futures.

## Labels (`_info` only: `_title` = the text, `_definition` = the hover)

| Namespace | gids |
|---|---|
| `ui_layout_label` | `_species`, `_country`, `_unit`, `_restricted`, `_flagged`, `_clear`, `_reset`, `_no-data`, `_source` (the climate-source selector's label; added later the same day), `_search` (the shared bar's search box, 2026-11-10) |
| `ui_layout_scatterplot_label` | `_base`, `_species`, `_units-present`, `_units-future`, `_map-selection`, `_envelope-present` (`_envelope-future` retired 2026-11-13: one envelope, the reference period's), `_arrows`, `_bin-arrows`, `_hints` (the 2026-11-10 gestures), `_projection` — `_selection` removed 2026-11-10, the group's caption is the title of `ui_layout_units_selection` |
| `ui_layout_map_label` | `_presence`, `_suitability`, `_t4-current`, `_t4-future`, `_chorology`, `_units`, `_click`, `_hints` (2026-11-10), `_never-on-map`, `_attribution` |

Namespaces (no `_data`): `ui_layout`, `ui_layout_map`, `ui_layout_map_layer`, `ui_layout_scatterplot`, `_base`, `_species`, `_units`, `_layer`, `ui_layout_units` (2026-11-10: the units-shown mode and the selection, shared by both panes), and the three label namespaces.

## Three things decided here, beyond the handoff

1. **The country key is `gcu_id_country`, not `eufgis_countries`.** An enumeration root carries no `_data` and cannot be a property; the existing descriptor `gcu_id_country` is the `_enum` over `eufgis_countries` and is the state key. The validator caught the handoff's wording on the first sweep.
2. **`_aid` carries only data and wire values.** Periods, scenario keys, class digits, bin pairs and variant codes have aliases; the pages' other option strings do not, since the pages adopt the gids (§E of the handoff).
3. **The exact-four zoom is declared**, with `_elements` `_min-items` 4 / `_max-items` 4 — the dictionary does have an array-length constraint; a three-element window fails `MIN_ITEMS`.

## Verified

Laptop: `loader --clear` 33,181 documents (+147 terms, +61 edges, +1 manual page); sweep 33,125 / 0 errors; `assign-roles` added only the enum roles to `gcu_loc_coordinates-restriction`; 148 term cards. Live: the period tree 3 sections × 4/5/4, count 13; `env_climate_period_chelsa_2071-2100` accepted and a typo rejected; a partial state validates and comes back with the 33 defaults filled; a three-number zoom → `MIN_ITEMS`; a LineString selection → `INVALID_GEOJSON_TYPE`. Manual page `using.map-and-scatterplot` (Planned section until the panes reach this application).

Work server (`work.eufgis.org`, ArangoDB 3.11.14) reloaded the same day: 16,333 terms / 16,011 edges / 66 manual pages, both generated indexes current, every route above answering. Commits: `metadata-store` `2c675e0` (terms, manual, records) and the follow-up with the loader's timeout fix; `metadata-store-service` `ca75983` (re-pinned Search figures, suite 156/156, not deployed — no behaviour changed). Details in `metadata-store/CLAUDE.md` (session 2026-11-09, later). Step E of the handoff — renaming the pages' keys, storing `gcu_loc_climate_distance`, the Foxx service taking a `ui_layout_state` — is this repository's.
