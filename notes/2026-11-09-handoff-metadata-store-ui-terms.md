# Handoff to `metadata-store`: the terms of the map and scatterplot panes

From: `indicator-pair-scatterplots` (Milko, with Claude), 2026-11-09. Supersedes the census
[`2026-11-02-ui-terms-census.md`](2026-11-02-ui-terms-census.md), whose decisions Milko took on
2026-11-02 (annotated table) and 2026-11-09 (four structural points). Identifiers below are Milko's,
with the corrections of §D marked **(D)** so that he can confirm or override them before the terms
are created.

Earlier handoffs applied by the metadata-store session, for the format and the conventions:
[`2026-10-30-handoff-metadata-store-climate-terms.md`](2026-10-30-handoff-metadata-store-climate-terms.md),
[`2026-10-30-term-requests-derived-indicators.md`](2026-10-30-term-requests-derived-indicators.md).

---

## A. Purpose and conventions

**What these terms are.** Two web panes, a species distribution **map** (OpenLayers) and an indicator
pair **scatterplot** (D3), plus the **joint page** that hosts both, serve the EUFGIS portal. Everything
a user can set in them is one **state object**: which climate source, scenario and period; which
species, country, unit; which layers, how drawn, how transparent; the selection; the view window. The
same object is a deep link, a preset view embedded in a TYPO3 page, a view sent to a colleague, the
message exchanged between the panes, and the request body of the Foxx service. Making every key a
dictionary term and every option an enumeration element gives: validation of the state with
`metadata-store-validator` like any data document; **every label, option text, tooltip and legend
from the term's `_info`, in the viewer's language**; and the interface documented in the manual.

**The axes need no new terms**: they are the climate descriptors (`env_climate_bio01`, …), whose
`_title`, `_definition` and `_unit` give the axis legend, the unit symbol and the hover text.

**The three `_info` levels, and how the panes use them** (Milko, 2026-11-09):

| Field | Used as | Length |
|---|---|---|
| `_title` | the control's label, the option's text, the legend entry | two to five words |
| `_definition` | the hover text of the control or option | one sentence |
| `_description` | the in-depth text behind an info symbol: what it means, why it exists, how it is computed | one to three paragraphs, Markdown |

Every term below carries the three in English (`ISO_639_3_eng`). Other languages follow by adding keys.

**Roles and edges**, as elsewhere in the dictionary:

- a namespace: `_domn._term_role: ["_term_role_namespace"]`, no `_data`;
- a control: `_term_role_descriptor` with a `_data` section;
- an enumeration root: a descriptor whose `_data` is `{"_scalar": {"_enum": {"_enums": ["<root gid>"]}}}`
  plus the roles `_term_role_enum-root` (and `_term_role_enum-source` as the other roots carry);
- an element: `_term_role_enum-item`, no `_data`, one edge `{_from: element, _to: root, _predicate:
  "_predicate_enum-of", _path: [root]}`; an element that also groups others (the period sections) adds
  `_term_role_namespace` and sits in the graph with `_predicate_section-of`;
- `_aid` holds the **value the pages and the data use** (the bare period string `1961-1990`, the class
  digit `0`, the scenario key `rcp45`), so that a stored value and a displayed element are the same thing.

**Source files** (`metadata-store/data/`): the `ui_*` terms in `data/ui/` (its `terms.labels.json`
holds the existing label terms; the new descriptors and enumerations go in `terms.properties.json`,
`terms.enumerations.json`, `edges.enumerations.json`, `terms.namespaces.json` of that folder, as the
EUFGIS folders are organised); `env_climate_*` in `data/EUFGIS/env/`; `gcu_loc_*` in `data/EUFGIS/gcu/`;
the root descriptors `rcp45`, `rcp85` beside `ssp370` and `MPI-ESM1-2-HR`.

**`_domn` classification** (`_class`, `_domain`, `_subject`) is left to the metadata-store session, which
knows the current scheme; the roles are stated per term.

---

## B. The mapping table: pane symbol → dictionary term

"Where" = the page element today (`scatter` = `examples/scatter-d3-canvas.html`, `map` =
`examples/map-openlayers.html`, `host` = `examples/linked.html`). "New" = to be created.

### B1. Shared state (host page)

| Symbol | Term (gid) | Type | Enumeration root | New |
|---|---|---|---|---|
| `species` (options) | `species_list` | set of strings | | existing |
| `species` (selected) | `species` | string | | existing |
| `country` | `eufgis_countries` | enum | `eufgis_countries` | existing (47 members) |
| `unit` (options) | `gcu_id_number_list` | array of unit numbers | | existing |
| `unit` (selected) | `gcu_id_number` | string `^[A-Z]{3}[0-9]{4,5}$` | | existing |
| `restricted` → restriction level | `gcu_loc_coordinates-restriction_level` | enum | `gcu_loc_coordinates-restriction` | **new** (+3 elements) |
| `flagKm` | `gcu_loc_climate_flag` | integer, km | | **new** |
| `layout` | `ui_layout_mode` | enum | `ui_layout_mode` | **new** (+3) |
| `detach` (map placement) | `ui_layout_map_placement` | enum | `ui_layout_map_placement` | **new** (+3) |

### B2. Climate selection (scatterplot; the map takes the same keys when it gets a period selector)

| Symbol | Term | Type | Root | New |
|---|---|---|---|---|
| `product` (source) | `std_dataset_ids` | set of dataset `_key` (one element) | | existing |
| `scenario` | `env_climate_scenario` | enum | `env_climate_scenario` | **new** (+4) |
| — (data nesting keys) | `rcp45`, `rcp85` | open object, like `ssp370` | | **new** |
| `period` | `env_climate_period` | enum, sectioned | `env_climate_period` | **new** (+3 sections, +13) |
| pair → X axis | `ui_layout_scatterplot_X` | descriptor key (see D8) | | **new** |
| pair → Y axis | `ui_layout_scatterplot_Y` | descriptor key (see D8) | | **new** |

### B3. Scatterplot layers and view

| Symbol | Term | Type | Root | New |
|---|---|---|---|---|
| `view` | `ui_layout_scatterplot_view` | enum | `ui_layout_scatterplot_view` | **new** (+2) |
| `baseMode` | `ui_layout_scatterplot_base_mode` | enum | `ui_layout_scatterplot_base_mode` | **new** (+3) |
| base opacity | `ui_layout_scatterplot_base_opacity` | integer 0–100 | | **new** |
| `speciesMode` | `ui_layout_scatterplot_species_mode` | enum | `ui_layout_scatterplot_species_mode` | **new** (+3) |
| species opacity | `ui_layout_scatterplot_species_opacity` **(D1)** | integer 0–100 | | **new** |
| `envelope` | `ui_layout_scatterplot_species_envelope` | boolean | | **new** |
| units opacity | `ui_layout_scatterplot_units_opacity` **(D1)** | integer 0–100 | | **new** |
| `selMode` | `ui_layout_scatterplot_units_mode` | enum | `ui_layout_scatterplot_units_mode` | **new** (+3) |
| `selection` | `ui_layout_scatterplot_units_selection` | array of unit numbers | | **new** |
| `hexR` | `ui_layout_scatterplot_layer_radius` | integer, px | | **new** |
| `arrows` | `ui_layout_scatterplot_layer_arrows` | boolean | | **new** |
| `tx` (zoom) | `ui_layout_scatterplot_zoom` | array of four numbers | | **new** |

### B4. Suitability classes view (EU-Trees4F only)

| Symbol | Term | Type | Root | New |
|---|---|---|---|---|
| `variant` | `ui_layout_scatterplot_view_classes_variant` | enum | same | **new** (+2) |
| `classPos` | `ui_layout_scatterplot_view_classes_position` | enum | same | **new** (+2) |
| `binSize` | `ui_layout_scatterplot_view_classes_bin` | enum | same | **new** (+3) |
| `binMin` | `ui_layout_scatterplot_view_classes_bin_min` | integer | | **new** |
| class (legend, service value) | `ui_layout_scatterplot_view_classes_legend` | enum | same | **new** (+4) |

### B5. Map

| Symbol | Term | Type | Root | New |
|---|---|---|---|---|
| `basemap` | `ui_layout_map_layer_base` | enum | same | **new** (+6) |
| `rpp`, `mhs`, `t4cur`, `t4fut`, `choro`, `units` | `ui_layout_map_layer_rpp`, `_mhs`, `_t4-current`, `_t4-future`, `_chorology`, `_units` | boolean each | | **new** (6) |
| their sliders | `ui_layout_map_layer_<layer>_opacity` **(D2)** | integer 0–100 each | | **new** (6) |
| `draw` | `ui_layout_map_draw-mode` **(D5)** | enum | same | **new** (+4) |
| `map-selection` (geometry) | `ui_layout_map_selection` | GeoJSON geometry (Point or Polygon) | | **new** |
| the map window | `ui_layout_map_view` | GeoJSON Polygon (bounds), shape of `geometry_bounds` | | **new** |

### B6. Unit facts (data, not interface)

| Fact | Term | Type | New |
|---|---|---|---|
| climate reference point of a unit | `gcu_loc_climate` | GeoJSON Point | **new** |
| distance of that point from the unit polygon | `gcu_loc_climate_distance` | float, km | **new** |

### B7. The state schema and the labels

| Symbol | Term | Type | New |
|---|---|---|---|
| the whole state / a message / a preset | `ui_layout_state` (§C6, proposed) | object with `_fields` | **new**, Milko decides |
| legend entries, hints, titles, messages | `ui_layout_scatterplot_label_*`, `ui_layout_map_label_*`, `ui_layout_label_*` (§C7) | label terms (no `_data`) | **new** (≈ 30) |

---

## C. Term specifications

Every block gives `_code` (nid · lid · gid · aid when it differs from lid), the three `_info` texts,
`_data`, roles and edges. Enumeration elements are tabled per root: title · definition · description.

### C1. Namespaces (no `_data`, role `_term_role_namespace`)

| gid | nid · lid | Title | Definition | Description |
|---|---|---|---|---|
| `ui_layout` | `ui` · `layout` | Pane layout | The settings of the EUFGIS map and scatterplot panes. | Groups every term that describes the state of the species distribution map, the indicator pair scatterplot and the page that hosts them: layers, modes, selections, view windows. A document made of these terms is a complete, shareable view. |
| `ui_layout_map` | `ui_layout` · `map` | Map pane | The settings of the species distribution map pane. | Terms of the map pane: base map, thematic layers and their opacities, the drawing tool, the drawn selection, the map window, the pane's placement. |
| `ui_layout_map_layer` | `ui_layout_map` · `layer` | Map layers | The layers of the map pane. | One boolean per thematic layer (shown or hidden) and one opacity per layer, plus the base map choice. |
| `ui_layout_scatterplot` | `ui_layout` · `scatterplot` | Scatterplot pane | The settings of the indicator pair scatterplot pane. | Terms of the scatterplot pane: the two axes, the view, the three layers (base, species, units) with their modes and opacities, the selection, the view window, the suitability-classes view. |
| `ui_layout_scatterplot_base` | `ui_layout_scatterplot` · `base` | Base layer | The scatterplot's base layer: all surveyed cells. | The bottom layer of the scatterplot: every EU-Forest 1 km survey cell with a value for the pair, drawn in grey. It is the climate space within which the species and the units are read. |
| `ui_layout_scatterplot_species` | `ui_layout_scatterplot` · `species` | Species layer | The scatterplot's species layer: the cells holding the species. | The middle layer: the survey cells where the selected species occurs, drawn in colour, with an optional envelope. |
| `ui_layout_scatterplot_units` | `ui_layout_scatterplot` · `units` | Units layer | The scatterplot's units layer: the conservation units. | The top layer: the gene conservation units of the selected species at the climate of their reference point, with the selection and its display mode. |
| `ui_layout_scatterplot_layer` **(D7)** | `ui_layout_scatterplot` · `layer` | Layer drawing | Settings shared by the scatterplot layers. | Drawing settings that apply to more than one layer: the hexagon radius of the density modes, the present → future arrows. |
| `env_climate_period_worldclim14` | section, see C3 | | | |
| `env_climate_period_worldclim21` | section, see C3 | | | |
| `env_climate_period_chelsa` | section, see C3 | | | |

### C2. Shared state

**`ui_layout_mode`** — `ui_layout` · `mode`. Title: *Pane layout*. Definition: *How the map and the
scatterplot panes are arranged on the page.* Description: *The joint page shows the two panes either
side by side or one above the other. The automatic mode follows the window's shape: side by side when
the window is wider than 5:4, stacked when it is taller, which gives near-square panes on a full-screen
browser as on a half-screen one. A divider between the panes lets the user resize them.* `_data`:
`{"_scalar": {"_enum": {"_enums": ["ui_layout_mode"]}}}`; roles descriptor, enum-root. Default `auto`.

| element (nid `ui_layout_mode`) | Title | Definition | Description |
|---|---|---|---|
| `ui_layout_mode_auto` | Follows the window | Side by side in a wide window, stacked in a tall one. | The layout is chosen from the window's aspect ratio (threshold 5:4) and changes when the window is resized. |
| `ui_layout_mode_side` | Side by side | Map on the left, scatterplot on the right. | Two columns, whatever the window's shape. |
| `ui_layout_mode_stack` | Stacked | Map above, scatterplot below. | Two rows, whatever the window's shape. |

**`ui_layout_map_placement`** — `ui_layout_map` · `placement`. Title: *Map placement*. Definition:
*Where the map pane is shown: in the page, in a new tab or in a new window.* Description: *The map can
leave the joint page and open in a browser tab or window of its own, for instance on a second screen;
it keeps exchanging its selections and settings with the page that opened it. Closing the tab or
window brings the map back into the page.* `_data`: scalar enum `ui_layout_map_placement`. Default `page`.

| element | Title | Definition | Description |
|---|---|---|---|
| `ui_layout_map_placement_page` | In this page | The map stays in the joint page. | The default: both panes in one page. |
| `ui_layout_map_placement_tab` | In a new tab | The map opens in a new browser tab. | The scatterplot takes the whole page; the tab is driven by the page that opened it. |
| `ui_layout_map_placement_window` | In a new window | The map opens in a new browser window. | As the tab, in a separate window that can be moved to another screen. |

**`gcu_loc_coordinates-restriction_level`** — `gcu_loc_coordinates-restriction` · `level`. Title:
*Coordinates restriction level*. Definition: *How much of a coordinate-restricted unit a request may
see.* Description: *EUFGIS holds units whose coordinates must not be exposed (`gcu_loc_coordinates-restriction`
true). The portal sets this level on every request to the map and scatterplot service according to
the user's rights. A restricted unit's climate values reveal no location (a pair of 1 km climate values
is shared by thousands of cells), so they may be shown where the level allows it; its coordinates and
polygon are returned only at the management level. The service never returns geometry below that
level, whatever else is asked.* `_data`: scalar enum, root **`gcu_loc_coordinates-restriction`** (the
existing boolean descriptor gains the roles `_term_role_enum-root`, `_term_role_enum-source`; its
`_data` stays boolean). Default `public`.

| element (nid `gcu_loc_coordinates-restriction`) | Title | Definition | Description |
|---|---|---|---|
| `gcu_loc_coordinates-restriction_public` | Public | Restricted units are absent from the map and from the scatterplot. | The default for anonymous users: a restricted unit appears nowhere. |
| `gcu_loc_coordinates-restriction_value` | Values | Restricted units appear in the scatterplot with their climate values, never on the map. | Identifiers and climate values are returned, no coordinates, no polygon. The level for registered users and for the scatterplot's purpose: a manager must see which units risk becoming climatically unfit. |
| `gcu_loc_coordinates-restriction_manage` | Management | Restricted units are fully visible, coordinates and polygon included. | For an authenticated manager of the unit's country, for instance to review or edit the unit. |

**`gcu_loc_climate`** — `gcu_loc` · `climate`. Title: *Climate reference point*. Definition: *The point
at which the unit's climate values are read.* Description: *A GeoJSON Point (WGS84) inside or near the
unit, chosen as representative of the unit's climate; the climate grids (WorldClim 2.1, CHELSA 2.1 at
1 km; the EU-Trees4F predictors at 10 km) are sampled at this point for the scatterplot. For
coordinate-restricted units the point is never returned below the management level. Exists today as a
property of `GeoService.Units`.* `_data`: `{"_object_GeoJSON": {"_type_GeoJSON": ["_type_GeoJSON_Point"]}}`
(as `geometry_point`). Role descriptor.

**`gcu_loc_climate_distance`** — `gcu_loc_climate` · `distance`. Title: *Reference point distance*.
Definition: *Distance from the climate reference point to the unit's polygon, 0 when inside.*
Description: *Measured on the ETRS89-LAEA plane (EPSG:3035) between the reference point and the nearest
edge of the unit polygon; 0 when the point lies inside. A large distance means the climate values stand
for a place other than the unit: a data-quality signal for the EUFGIS maintainers (on 2026-11-01, 46 of
3 669 units exceeded 5 km, 25 exceeded 20 km, the farthest 254 km). A distance reveals no location, so
it is served for restricted units too.* `_data`: `{"_scalar": {"_number_float": {"_decimals": 1,
"_unit": "unit_Length_km", "_range_valid": {"_min-inclusive": 0}}}}`. Role descriptor.

**`gcu_loc_climate_flag`** — `gcu_loc_climate` · `flag`. Title: *Flag distance*. Definition: *Units whose
reference point lies farther than this from their polygon are flagged.* Description: *The threshold of
the data-quality flag shown in the map and scatterplot panes: a unit with `gcu_loc_climate_distance`
above it gets a warning mark in the unit lists, a dashed ring in the scatterplot and a dashed outline on
the map. Offered values 1, 2, 5, 10, 20 km; default 5 km.* `_data`: `{"_scalar": {"_number_integer":
{"_unit": "unit_Length_km", "_range_valid": {"_min-inclusive": 0, "_max-inclusive": 1000}}}}`. Role descriptor.

### C3. Climate vocabularies

**`rcp45`**, **`rcp85`** — root descriptors modelled on `ssp370` (no nid; lid = gid = aid; `_data`
`{"_object": {}}`; role descriptor): the nesting keys of the EU-Trees4F future blocks
(`properties.eutrees4f.<period>.<rcp>`) in `ScatterOccurrences`, `ScatterCells`, `ScatterUnits`.

| gid | Title | Definition | Description |
|---|---|---|---|
| `rcp45` | Representative Concentration Pathway RCP 4.5 | An IPCC AR5 greenhouse-gas concentration trajectory with a radiative forcing of 4.5 W m⁻² in 2100. | [Representative Concentration Pathways](https://en.wikipedia.org/wiki/Representative_Concentration_Pathway) are the four greenhouse-gas concentration trajectories adopted by the IPCC Fifth Assessment Report (2014). RCP 4.5 is an intermediate stabilisation pathway: emissions peak around 2040 and decline, with about 2.4 °C of warming by 2100 relative to pre-industrial. In EU-Trees4F it drives one of the two futures of the EURO-CORDEX ensemble. |
| `rcp85` | Representative Concentration Pathway RCP 8.5 | An IPCC AR5 greenhouse-gas concentration trajectory with a radiative forcing of 8.5 W m⁻² in 2100. | The highest of the four IPCC AR5 pathways: emissions keep rising through the century, with about 4.3 °C of warming by 2100 relative to pre-industrial. Often read as the "no mitigation" case. The second future of EU-Trees4F. |

**`env_climate_scenario`** — `env_climate` · `scenario`. Title: *Climate scenario*. Definition: *The
emission scenario of the climate data, or the observed reference climate.* Description: *The choice of
the climate shown: the observed reference period of the source, or one of its modelled futures. The
scenarios available depend on the source: WorldClim 2.1 and CHELSA 2.1 futures in GeoService follow
SSP3-7.0 (model MPI-ESM1-2-HR), the EU-Trees4F futures follow RCP 4.5 and RCP 8.5 (EURO-CORDEX
ensemble). The element's alias is the key under which the data is stored.* `_data`: scalar enum
`env_climate_scenario`; roles descriptor, enum-root, enum-source.

| element (nid `env_climate_scenario`) | aid | Title | Definition | Description |
|---|---|---|---|---|
| `env_climate_scenario_historical` | `historical` | Reference climate | The observed climate of the source's reference period. | No scenario: the baseline against which the futures are read (WorldClim 2.1 1970–2000, CHELSA 2.1 1981–2010, EU-Trees4F 1961–1990). In the data the reference block has no scenario key. |
| `env_climate_scenario_ssp370` | `ssp370` | SSP3-7.0 | Shared Socioeconomic Pathway 3 with 7.0 W m⁻² forcing, "regional rivalry". | The CMIP6 scenario of the WorldClim 2.1 and CHELSA 2.1 futures in GeoService (model MPI-ESM1-2-HR). Full description in the descriptor `ssp370`. |
| `env_climate_scenario_rcp45` | `rcp45` | RCP 4.5 | Intermediate IPCC AR5 pathway, 4.5 W m⁻² in 2100. | One of the two EU-Trees4F futures. Full description in the descriptor `rcp45`. |
| `env_climate_scenario_rcp85` | `rcp85` | RCP 8.5 | Highest IPCC AR5 pathway, 8.5 W m⁻² in 2100. | The other EU-Trees4F future. Full description in the descriptor `rcp85`. |

**`env_climate_period`** — `env_climate` · `period`. Title: *Climate period*. Definition: *The 30-year
period of the climate data.* Description: *Every climate source publishes its data as 30-year
climatologies: one observed reference period and several future periods. This enumeration holds all of
them, grouped in sections by source, so that a selector can offer one source's periods by traversing
its section, while one root covers them all. The element's alias is the bare period string used as the
nesting key in the data (`properties.<source>.<period>`), which stays as it is.* `_data`: scalar enum
`env_climate_period`; roles descriptor, enum-root, enum-source.

Sections (role enum-item + namespace; edge `_predicate_section-of` to the root; each element's edge
`_predicate_enum-of` with `_path: [root, section]`):

| section | nid · lid | Title | Definition | Description |
|---|---|---|---|---|
| `env_climate_period_worldclim14` | `env_climate_period` · `worldclim14` | EU-Trees4F periods (WorldClim 1.4) | The periods of the EU-Trees4F climate predictors. | WorldClim 1.4 at 5 arc-minutes (≈ 10 km) for the reference, and the EURO-CORDEX ensemble mean (11 regional models, change-factor downscaled onto WorldClim 1.4) for the futures under RCP 4.5 and RCP 8.5. The futures feed the EU-Trees4F distribution maps with a 30-year lag: the map centred on a year is driven by the climate of the previous 30 years. |
| `env_climate_period_worldclim21` | `env_climate_period` · `worldclim21` | WorldClim 2.1 periods | The periods of WorldClim 2.1 in GeoService. | WorldClim 2.1 at 30 arc-seconds (≈ 1 km): the 1970–2000 reference and four CMIP6 futures downscaled from MPI-ESM1-2-HR under SSP3-7.0. |
| `env_climate_period_chelsa` | `env_climate_period` · `chelsa` | CHELSA 2.1 periods | The periods of CHELSA 2.1 in GeoService. | CHELSA 2.1 at 30 arc-seconds: the 1981–2010 reference and three CMIP6 futures from MPI-ESM1-2-HR under SSP3-7.0. |

Elements (aid = lid; title = the period string, which needs no translation):

| element | Title | Definition | Description |
|---|---|---|---|
| `env_climate_period_worldclim14_1961-1990` | 1961-1990 | From 1961 to 1990, the EU-Trees4F reference period. | The WorldClim 1.4 baseline under which the trees surveyed around 2005 established; the climate of the EU-Trees4F current maps (`cur2005`). |
| `env_climate_period_worldclim14_1991-2020` | 1991-2020 | From 1991 to 2020, EU-Trees4F future. | EURO-CORDEX ensemble mean; drives the EU-Trees4F maps centred on 2035 (`fut2035`). |
| `env_climate_period_worldclim14_2021-2050` | 2021-2050 | From 2021 to 2050, EU-Trees4F future. | Drives the maps centred on 2065 (`fut2065`). |
| `env_climate_period_worldclim14_2051-2080` | 2051-2080 | From 2051 to 2080, EU-Trees4F future. | Drives the maps centred on 2095 (`fut2095`). |
| `env_climate_period_worldclim21_1970-2000` | 1970-2000 | From 1970 to 2000, the WorldClim 2.1 reference period. | Observed climate, the baseline of the WorldClim 2.1 futures. |
| `env_climate_period_worldclim21_2021-2040` | 2021-2040 | From 2021 to 2040, WorldClim 2.1 future. | MPI-ESM1-2-HR, SSP3-7.0. Future temperature indicators derive from monthly maximum and minimum temperatures; no future radiation. |
| `env_climate_period_worldclim21_2041-2060` | 2041-2060 | From 2041 to 2060, WorldClim 2.1 future. | As above. |
| `env_climate_period_worldclim21_2061-2080` | 2061-2080 | From 2061 to 2080, WorldClim 2.1 future. | As above. |
| `env_climate_period_worldclim21_2081-2100` | 2081-2100 | From 2081 to 2100, WorldClim 2.1 future. | As above. |
| `env_climate_period_chelsa_1981-2010` | 1981-2010 | From 1981 to 2010, the CHELSA 2.1 reference period. | Observed climate, the baseline of the CHELSA 2.1 futures; its precipitation runs 15–20 % above WorldClim 2.1 over Europe. |
| `env_climate_period_chelsa_2011-2040` | 2011-2040 | From 2011 to 2040, CHELSA 2.1 future. | MPI-ESM1-2-HR, SSP3-7.0. |
| `env_climate_period_chelsa_2041-2070` | 2041-2070 | From 2041 to 2070, CHELSA 2.1 future. | As above. |
| `env_climate_period_chelsa_2071-2100` | 2071-2100 | From 2071 to 2100, CHELSA 2.1 future. | As above. |

### C4. Scatterplot

**`ui_layout_scatterplot_X`** and **`_Y`** — `ui_layout_scatterplot` · `X` / `Y`. Titles: *X axis
indicator*, *Y axis indicator*. Definitions: *The climate indicator on the horizontal (vertical) axis.*
Description (X): *One of the climate descriptors offered for the horizontal axis: mean annual air
temperature (`env_climate_bio01`), summer mean air temperature (`env_climate_tas_summer`),
continentality (`env_climate_continentality`), spring-summer solar radiation
(`env_climate_srad_spring-summer`), precipitation seasonality ratio (`env_climate_pr_seasonality-ratio`).
Choosing an X indicator suggests its paired Y indicator once, so that the five scientific pairs are one
click away and a custom pair stays possible. The axis legend, unit and hover text come from the chosen
descriptor's term.* Description (Y): the vertical counterparts, annual precipitation (`env_climate_bio12`),
summer monthly precipitation (`env_climate_pr_summer`), winter monthly precipitation
(`env_climate_pr_winter`), mean air temperature of the coldest month (`env_climate_tas_coldest`),
precipitation of the driest month (`env_climate_bio14`). `_data` **(D8)**: `{"_scalar":
{"_term_key_descriptor": {}}}` (the selected axis); the option sets and the pairings are the service's
configuration. Role descriptor.

**`ui_layout_scatterplot_view`** — · `view`. Title: *View*. Definition: *What the scatterplot shows: the
three layers, or the EU-Trees4F suitability classes.* Description: *The layers view is the default:
base, species and units at the selected climate. The classes view reproduces Figure 1 of the EU-Trees4F
paper: every cell coloured by its modelled suitability now and in the selected future (stable,
decolonised, newly suitable), with arrows for the climate shift; it exists for the EU-Trees4F source and
a future period only, because the classes come from the EU-Trees4F binary maps.* Scalar enum. Default `layer`.

| element (nid `ui_layout_scatterplot_view`) | Title | Definition | Description |
|---|---|---|---|
| `ui_layout_scatterplot_view_layer` | Layers | Base, species and units layers at the selected climate. | The standard scatterplot. |
| `ui_layout_scatterplot_view_classes` | Suitability classes | Cells coloured by EU-Trees4F suitability class, present vs selected future. | Also a namespace for the view's own settings (variant, position, bins, legend). Roles enum-item and namespace. |

**`ui_layout_scatterplot_base_mode`** — `ui_layout_scatterplot_base` · `mode`. Title: *Base layer
drawing*. Definition: *How the base layer's cells are drawn.* Description: *Points draw every surveyed
cell; hexagon density bins the cells into hexagons shaded by count, which reads better at 250 000 points;
hidden removes the layer.* Scalar enum. Default `point`. Elements with nid `ui_layout_scatterplot_base`:

| element | Title | Definition | Description |
|---|---|---|---|
| `ui_layout_scatterplot_base_point` | Points | One small grey point per cell. | Full detail. |
| `ui_layout_scatterplot_base_hex` | Hexagon density | Cells binned into hexagons shaded by count. | Radius from `ui_layout_scatterplot_layer_radius`; logarithmic grey scale. |
| `ui_layout_scatterplot_base_none` | Hidden | The base layer is not drawn. | |

**`ui_layout_scatterplot_species_mode`** — `ui_layout_scatterplot_species` · `mode`. Title: *Species
layer drawing*. Definition and description as the base layer's, for the species cells (blue). Elements
`ui_layout_scatterplot_species_point` (*Points*), `_species_hex` (*Hexagon density*), `_species_none`
(*Hidden*), nid `ui_layout_scatterplot_species`. Default `point`.

**`ui_layout_scatterplot_base_opacity`**, **`_species_opacity`** **(D1)**, **`_units_opacity`** **(D1)** —
lid `opacity` under the layer's namespace. Titles: *Base layer opacity*, *Species layer opacity*, *Units
layer opacity*. Definition: *Opacity of the layer, 0 (invisible) to 100 (opaque).* Description: *Lets the
user fade a layer to read the ones beneath it.* `_data`: `{"_scalar": {"_number_integer": {"_unit":
"unit_Percent_pct", "_range_valid": {"_min-inclusive": 0, "_max-inclusive": 100}}}}`. Default 100.

**`ui_layout_scatterplot_species_envelope`** — · `envelope`. Title: *Species envelope*. Definition:
*Draw the contour holding 95 % of the species' cells.* Description: *A smooth closed contour around the
densest 95 % of the species cloud (a blurred density cut at the level holding 95 % of the mass). In a
future period two contours are drawn: the present one dashed, the selected period's solid, so the shift
of the species' climate space is read at a glance.* Boolean. Default true.

**`ui_layout_scatterplot_units_mode`** — `ui_layout_scatterplot_units` · `mode`. Title: *Units shown*.
Definition: *Which units are drawn: all, only the selection, or all but the selection.* Description:
*The user builds a selection of units by option-clicking them; this mode shows all units, the selection
alone, or hides the selection.* Scalar enum. Default `all`. Elements, nid `ui_layout_scatterplot_units`:

| element | Title | Definition | Description |
|---|---|---|---|
| `ui_layout_scatterplot_units_all` | All units | Every unit of the species is drawn; selected ones are ringed. | |
| `ui_layout_scatterplot_units_only` | Only the selection | Only the selected units are drawn. | |
| `ui_layout_scatterplot_units_hide` | Hide the selection | Every unit except the selected ones. | |

**`ui_layout_scatterplot_units_selection`** — · `selection`. Title: *Selected units*. Definition: *The
unit numbers the user has selected in the scatterplot.* Description: *Built by option-clicking units;
cleared by the clear button. Carried in a shared view so that a colleague opens the plot with the same
units ringed.* `_data`: as `gcu_id_number_list`: `{"_array": {"_scalar": {"_string": {"_regexp":
"^[A-Z]{3}[0-9]{4,5}$"}}}}`.

**`ui_layout_scatterplot_layer_radius`** — `ui_layout_scatterplot_layer` · `radius`. Title: *Hexagon
radius*. Definition: *Radius of the density hexagons, in pixels.* Description: *Used by the base and
species layers in hexagon density mode; 2 to 10 pixels, default 4.* `_data`: integer, `_range_valid` 2–10.

**`ui_layout_scatterplot_layer_arrows`** — · `arrows`. Title: *Shift arrows*. Definition: *Draw arrows
from the present to the selected period.* Description: *In a future period, each unit and each cell
selected on the map gets an arrow from its present position to its position in the selected climate; in
the suitability-classes view the arrows give the mean shift per climate bin and for the whole species
envelope.* Boolean. Default true.

**`ui_layout_scatterplot_zoom`** — `ui_layout_scatterplot` · `zoom`. Title: *Plot window*. Definition:
*The visible range of the two axes.* Description: *Four numbers in the axes' units: the minimum and
maximum of the X axis, then of the Y axis (`[x0, x1, y0, y1]`). Absent means the full fixed range of the
product. Set by box zoom, wheel zoom and panning; carried in a shared view.* `_data`:
`{"_array": {"_scalar": {"_number_float": {}}}}` (exactly four values; stated in the description, since
the dictionary has no array-length constraint to the writer's knowledge — the metadata-store session
may know one).

**Suitability classes view** (nid `ui_layout_scatterplot_view_classes`, the element that is also a namespace):

**`…_view_classes_variant`** — · `variant`. Title: *Suitability variant*. Definition: *Potential suitability
from climate alone, or suitability reachable by natural dispersal.* Description: *EU-Trees4F publishes
two future binary maps per species: potential, where the climate would allow the species, and natural
dispersal, the MigClim simulation of what the species can reach by seed dispersal in time. The paper's
Figure 1 uses the potential maps.* Scalar enum. Default `potential`. Elements, nid `…_view_classes_variant`:

| element | aid | Title | Definition | Description |
|---|---|---|---|---|
| `…_view_classes_variant_potential` | `pot` | Potential (climate only) | Cells climatically suitable, reachable or not. | EU-Trees4F `bin_pot` maps. |
| `…_view_classes_variant_dispersal` **(D4)** | `disp` | With natural dispersal (MigClim) | Suitable cells the species can reach by dispersal. | EU-Trees4F `bin_disp` maps: 30-year steps, negative-exponential kernel from species dispersal distances. |

**`…_view_classes_position`** — · `position`. Title: *Cells at*. Definition: *Draw each cell at its present
climate or at the selected period's.* Description: *The present position shows where today's cells
are in climate space, coloured by what the model says of their future, with arrows for the shift (the
paper's choice); the future position shows the same cells where they will sit.* Scalar enum. Default `present`.

| element | Title | Definition | Description |
|---|---|---|---|
| `…_view_classes_position_present` | Present climate | Cells at their reference-period values. | |
| `…_view_classes_position_future` | Selected period | Cells at the selected future period's values. | |

**`…_view_classes_bin`** — · `bin`. Title: *Arrow bins*. Definition: *Size of the climate bins that get a
mean-shift arrow.* Description: *The species' current envelope (stable and decolonised cells) is divided
into bins of temperature × precipitation; each bin holding at least `…_bin_min` cells gets an arrow from
its mean present climate to its mean future climate. Coarser bins give fewer, clearer arrows. The paper
drew fifteen random bins.* Scalar enum. Default `2x200`. Elements, nid `…_view_classes_bin` **(D6)**:

| element | aid | Title | Definition |
|---|---|---|---|
| `…_view_classes_bin_0-5x50` | `0.5,50` | 0.5 °C × 50 mm | Fine bins. |
| `…_view_classes_bin_1x100` | `1,100` | 1 °C × 100 mm | Medium bins. |
| `…_view_classes_bin_2x200` | `2,200` | 2 °C × 200 mm | Coarse bins, the default. |

**`…_view_classes_bin_min`** — `…_view_classes_bin` · `min`. Title: *Cells per arrow*. Definition: *The
least number of cells a bin needs to get an arrow.* Description: *Suppresses arrows from sparse bins
whose mean would be noise. Offered 10, 30, 100, 300; default 100.* Integer, `_range_valid` ≥ 1.

**`…_view_classes_legend`** — · `legend`. Title: *Suitability class*. Definition: *A cell's modelled
suitability now and in the selected future.* Description: *Computed per cell from the EU-Trees4F binary
maps: the current potential map against the selected period's map (potential or dispersal variant).
The alias is the digit the service returns per cell.* Scalar enum; the classes are also the legend of
the view. Elements, nid `…_view_classes_legend`:

| element | aid | Title | Definition | Description |
|---|---|---|---|---|
| `…_view_classes_legend_0` | `0` | Unsuitable | Not suitable now nor in the selected period. | Drawn as part of the grey base only. |
| `…_view_classes_legend_1` | `1` | Stable | Suitable now and in the selected period. | Yellow in the paper and in the pane. |
| `…_view_classes_legend_2` | `2` | Decolonised | Suitable now, no longer in the selected period. | Red: where the species' climate disappears. |
| `…_view_classes_legend_3` | `3` | Newly suitable | Not suitable now, suitable in the selected period. | Blue: where the climate becomes suitable (reached or not, by variant). |

### C5. Map

**`ui_layout_map_layer_base`** — `ui_layout_map_layer` · `base`. Title: *Base map*. Definition: *The
background map under the thematic layers.* Description: *Tile services or vector boundaries drawn
beneath the Atlas and EU-Trees4F rasters; the grey OpenStreetMap keeps the relief and vegetation texture
without colours that collide with the thematic greens and blues. Each service's attribution and usage
terms are shown by the pane.* Scalar enum. Default `gray`. Elements, nid `ui_layout_map_layer_base`:

| element | Title | Definition | Description |
|---|---|---|---|
| `…_base_none` | None | No background. | |
| `…_base_boundary` | Country boundaries | Natural Earth 1:50 m country boundaries only. | Public domain vectors drawn by the pane. |
| `…_base_hillshade` | Hillshade | Esri World Hillshade only. | Relief without labels. |
| `…_base_gray` **(D3)** | OpenStreetMap, grey | OpenStreetMap tiles desaturated. | The default. |
| `…_base_osm` | OpenStreetMap, colour | OpenStreetMap tiles. | |
| `…_base_topo` | OpenTopoMap | Topographic map with relief and contours. | |

**Layer booleans** — nid `ui_layout_map_layer`, boolean each, `_data` `{"_scalar": {"_boolean": {}}}`;
each is also the namespace of its opacity:

| gid | lid | Title | Definition | Description | Default |
|---|---|---|---|---|---|
| `ui_layout_map_layer_rpp` | `rpp` | Atlas presence | Show the Atlas relative probability of presence (1 km). | The European Atlas of Forest Tree Species' C-SMFA relative probability of presence, 1 km, served as a cloud-optimised GeoTIFF read directly by the browser; green ramp. | on |
| `ui_layout_map_layer_mhs` | `mhs` | Atlas suitability | Show the Atlas maximum habitat suitability (1 km). | The Atlas RDS-MHS maximum habitat suitability, 1 km; blue ramp. | off |
| `ui_layout_map_layer_t4-current` | `t4-current` | EU-Trees4F current | Show the EU-Trees4F current realised distribution (10 km). | The SDM-ensemble binary map for the current period, masked to the native range (`cur2005 bin nat`); yellow. | off |
| `ui_layout_map_layer_t4-future` | `t4-future` | EU-Trees4F future | Show the EU-Trees4F future suitability (10 km). | The SDM-ensemble binary map for the selected period, scenario and variant (`env_climate_period`, `env_climate_scenario`, `…_view_classes_variant`); magenta. | off |
| `ui_layout_map_layer_chorology` | `chorology` | Chorology | Show the species' native range outline. | The Atlas chorology polygons (Caudullo, Welk & San-Miguel-Ayanz 2017), purple dashed. | on |
| `ui_layout_map_layer_units` | `units` | Units | Show the conservation units. | Polygons where they exist, else points; restricted units never; flagged units with a dashed red outline. | on |

**Layer opacities** **(D2)** — `ui_layout_map_layer_rpp_opacity`, `_mhs_opacity`, `_t4-current_opacity`,
`_t4-future_opacity`, `_chorology_opacity`, `_units_opacity`: lid `opacity` under the layer's gid. Title:
*<Layer> opacity*. Definition: *Opacity of the layer, 0 to 100.* Description: *Lets the user fade a layer
to read the ones beneath.* `_data` as the scatterplot opacities (`unit_Percent_pct`, 0–100). Defaults
85 for the two Atlas rasters, 100 for the others.

**`ui_layout_map_draw-mode`** **(D5)** — `ui_layout_map` · `draw-mode`. Title: *Draw*. Definition: *What a
drag on the map draws: nothing, a point, a box or a polygon.* Description: *The drawn shape is sent to
the scatterplot, which shows the surveyed cells inside it at the selected climate, with arrows from the
present. When drawing is off, a plain click sends a point. Changing the mode clears the current
drawing on both panes.* Scalar enum. Default `none`. Elements, nid `ui_layout_map_draw-mode`:

| element | Title | Definition |
|---|---|---|
| `…_draw-mode_none` | Off | No drawing tool; a click sends a point. |
| `…_draw-mode_point` | Point | A click places a point. |
| `…_draw-mode_box` | Box | A drag draws a rectangle. |
| `…_draw-mode_polygon` | Polygon | Clicks trace a polygon, double-click closes it. |

**`ui_layout_map_selection`** — `ui_layout_map` · `selection`. Title: *Map selection*. Definition: *The
point or area drawn on the map.* Description: *A GeoJSON Point or Polygon in WGS84, sent to the
scatterplot and to the service, which answer with the cells inside (the containing cell for a point).
Clearing it on either pane clears both.* `_data`: `{"_object_GeoJSON": {"_type_GeoJSON":
["_type_GeoJSON_Point", "_type_GeoJSON_Polygon"]}}`.

**`ui_layout_map_view`** — `ui_layout_map` · `view`. Title: *Map window*. Definition: *The area the map
shows.* Description: *The bounds of the visible map as a GeoJSON Polygon in WGS84 (the shape of
`geometry_bounds`), so that a shared view opens on the same region.* `_data`: as `geometry_bounds`
(`{"_object_GeoJSON": {}}` with the Polygon type constraint).

### C6. The state schema (proposed; Milko decides, his §2.6)

**`ui_layout_state`** — `ui_layout` · `state`. Title: *Pane state*. Definition: *A complete or partial
description of what the map and scatterplot panes show.* Description: *The object whose properties are
the terms of `ui_layout`, `gcu_loc_climate_flag`, `gcu_loc_coordinates-restriction_level`,
`std_dataset_ids`, `env_climate_scenario`, `env_climate_period`, `species`, `eufgis_countries`,
`gcu_id_number`. A full instance is a shareable preset view (a deep link, an embedded pane's
configuration); a partial instance is a message between panes, applied key by key. Validated with the
dictionary before the service acts on it.* `_data`: `{"_object": {"_open": {"_fields": [{"_field":
"<each key>"}, …]}}}`, no required property. Alternative if Milko prefers not to create it: the panes
keep the message types in code and validate each key with `POST /validate/value`.

### C7. Legend and label terms (Milko's §2.7)

Label terms as the existing `ui_*` labels: `_info` only (`_title` the text, `_definition` the hover text
where useful), no `_data`, no role. Grouped under three namespaces to create: `ui_layout_label`
(shared), `ui_layout_scatterplot_label`, `ui_layout_map_label`.

| gid | Title (the text) | Definition (hover) |
|---|---|---|
| `ui_layout_label_species` | Species | The species whose cells, units and maps are shown. |
| `ui_layout_label_country` | Country | The first three letters of the unit number (ISO 3166-1 alpha-3). |
| `ui_layout_label_unit` | Unit | One conservation unit to highlight and zoom to. |
| `ui_layout_label_restricted` | restricted | Appended to a unit whose coordinates are restricted. |
| `ui_layout_label_flagged` | reference point far from the polygon | A unit whose climate reference point lies beyond the flag distance. |
| `ui_layout_label_clear` | clear | Remove the current selection on both panes. |
| `ui_layout_label_reset` | reset view | Return to the full window. |
| `ui_layout_label_no-data` | no scatterplot data for this species | Shown when the chosen species has no scatterplot data. |
| `ui_layout_scatterplot_label_base` | all EU-Forest cells | Every surveyed 1 km cell. |
| `ui_layout_scatterplot_label_species` | species | The cells holding the species. |
| `ui_layout_scatterplot_label_units-present` | units, present | The units at their reference-period climate. |
| `ui_layout_scatterplot_label_units-future` | units, selected period | The units at the selected period's climate. |
| `ui_layout_scatterplot_label_map-selection` | map selection | The cells inside the shape drawn on the map. |
| `ui_layout_scatterplot_label_envelope-present` | present envelope | The 95 % contour of the species at the reference period (dashed). |
| `ui_layout_scatterplot_label_envelope-future` | selected-period envelope | The 95 % contour at the selected period (solid). |
| `ui_layout_scatterplot_label_arrows` | arrows: present → selected period | The shift of each unit or cell. |
| `ui_layout_scatterplot_label_bin-arrows` | arrows = mean climate shift per bin, thick = whole species envelope | Legend of the classes view. |
| `ui_layout_scatterplot_label_hints` | drag = zoom to box · wheel = zoom · shift-drag = pan · double-click = reset · option-click a unit = add to / remove from the selection | The pane's interaction hints. |
| `ui_layout_scatterplot_label_selection` | Selection | The units selected by option-click. |
| `ui_layout_scatterplot_label_projection` | projection of present cells into the selected period's climate | Qualifies every future view (decision of 2026-10-31). |
| `ui_layout_map_label_presence` | presence | Legend of the Atlas presence raster. |
| `ui_layout_map_label_suitability` | suitability | Legend of the Atlas suitability raster. |
| `ui_layout_map_label_t4-current` | EU-Trees4F 2005 | Legend of the current EU-Trees4F map. |
| `ui_layout_map_label_t4-future` | EU-Trees4F future | Legend of the future EU-Trees4F map (period in the pane). |
| `ui_layout_map_label_chorology` | chorology | Legend of the native range outline. |
| `ui_layout_map_label_units` | units | Legend of the conservation units. |
| `ui_layout_map_label_click` | Click the map to read the values at that location | The read-out row's idle text. |
| `ui_layout_map_label_never-on-map` | restricted coordinates, not shown on the map | Shown for a restricted unit chosen in the list. |
| `ui_layout_map_label_attribution` | © OpenStreetMap contributors | Base map attribution (one per base map; the others are "Esri", "Natural Earth", "OpenTopoMap (CC-BY-SA)"). |

The status lines (counts, timings) are composed by the panes from these labels and numbers; they need no
terms of their own.

---

## D. Corrections proposed to Milko's table (confirm or override)

| # | In the table | Proposed | Why |
|---|---|---|---|
| D1 | opacities `ui_layout_scatterplot_base_species`, `ui_layout_scatterplot_base_units` | `ui_layout_scatterplot_species_opacity`, `ui_layout_scatterplot_units_opacity` | They are the species and units layers' opacities; the tabled gids sit under the base layer (copy slip). |
| D2 | map opacities `…_slider` | `…_opacity` | One word for one thing across both panes; "slider" names the control, not the value. |
| D3 | lid `osm-gray`, gid `ui_layout_map_layer_base_gray` | lid `gray` | lid and gid must agree. |
| D4 | `…_variant_dispersion`, "natural dispersion" | `…_variant_dispersal`, "natural dispersal" | MigClim models seed **dispersal**; dispersion is another concept (spread of a distribution). |
| D5 | `ui_layout_draw-mode` under `ui_layout` | `ui_layout_map_draw-mode` | Drawing is a map action; keeps `ui_layout` to the shared settings. |
| D6 | bin lids `0.5x50`, `1x100`, `2x200` | `0-5x50`, `1x100`, `2x200`; aids `0.5,50`, `1,100`, `2,200` | No local identifier in the dictionary contains a dot; the alias carries the value the pane uses. |
| D7 | `ui_layout_scatterplot_layer_radius`, `_layer_arrows` | add the namespace `ui_layout_scatterplot_layer` | Used by two terms, not declared. |
| D8 | `ui_layout_scatterplot_X` / `_Y` as *sets* of `_term_key_descriptor` | *scalar* `_term_key_descriptor` (the selected axis) | In the state one axis is chosen; the option sets and the X → Y pairings live in the service configuration. If Milko prefers the sets to be dictionary data, two further terms `_X_options` / `_Y_options` (sets) would hold them. |
| D9 | `species` → `species_list` | options `species_list`, selected value `species` | Both exist; a selector has a list and a value. |
| D10 | — | `env_climate_scenario_historical` (settled 2026-11-09) | The reference period has no scenario in the data; the state needs a value for "present". |
| D11 | — | climate model: no term now | `MPI-ESM1-2-HR` is implied by the source; an `env_climate_model` enumeration is for when a second model arrives. |
| D12 | `2.8` section | `gcu_loc_climate` (point), `gcu_loc_climate_distance` (measured), `gcu_loc_climate_flag` (threshold) | Three distinct things, each its own descriptor (settled 2026-11-09). |

Typos in the table noted in passing: "12961" for 1961; `ui_layout_scatterplot_view_layer` is singular
("Layers" in the title).

---

## E. After the terms exist (this repository)

1. Rename the state keys and the messages of the three example pages to the gids; read labels, option
   texts and hover texts from the terms (`POST /term/bulk` on `metadata/ui`), the axis legends from the
   climate descriptors.
2. `ScatterUnits`: `_custom.reference_point_distance_km` → `gcu_loc_climate_distance` (validated);
   `gcu_loc_climate` stored for unrestricted units (`sources/units/distance.js`, `load.js`).
3. The Foxx service (step 2 of the order of 2026-11-02) takes a `ui_layout_state` (or its keys) as
   request, validates it with `POST /validate/document`, and answers in the same vocabulary (the class
   digits are `…_view_classes_legend` aliases, the periods `env_climate_period` aliases).
4. Record the metadata-store commit and the reload in `CLAUDE.md`, as for the two earlier handoffs.

---

## Addendum (2026-11-09, after the terms were created): two more terms — **created by Milko the same day, verified**

Found while putting the panes on the vocabulary; same conventions as above, `data/ui/`.

**`ui_layout_scatterplot_base_position`** — `ui_layout_scatterplot_base` · `position`. Title: *Base layer at*.
Definition: *Draw the base layer at the present climate or at the selected period's.* Description: *The
species layer is the species' realised niche, the climate of the places where it grows today, and never
moves with the period (decided 2026-11-09): the units, the map-selected cells and the solid envelope are
what the future period moves. The base layer, every surveyed cell, stays at the present climate by
default, as the reference climate space. Moved to the selected period it shows Europe's future climate
space against the species' present niche: the overlap is where the species' climate will still exist,
and a niche left outside the future base is a climate that disappears from Europe. Shown only for a
future period in the layers view.* `_data`: scalar enum, root `ui_layout_scatterplot_base_position`.
Default `present`; add it to `ui_layout_state` (field and constant). Elements, nid
`ui_layout_scatterplot_base_position`:

| element | Title | Definition |
|---|---|---|
| `ui_layout_scatterplot_base_position_present` | Present climate | All surveyed cells at their reference-period values. |
| `ui_layout_scatterplot_base_position_future` | Selected period | All surveyed cells at the selected period's values: Europe's future climate space. |

**`ui_layout_label_source`** — label term under `ui_layout_label`. Title: *Source*. Definition: *The
climate source whose values are shown: a dataset of the GeoService catalogue.* (The selector's values
are dataset keys, `std_dataset_ids`, whose own title, "Dataset IDs", is not a label.)
