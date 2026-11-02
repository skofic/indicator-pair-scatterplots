# Census of the user-interface terms for the dictionary

Date: 2026-11-02. Status: **draft for discussion** (step 1 of the order agreed on 2026-11-02:
census → decide namespaces and local identifiers with Milko → handoff note for the `metadata-store`
Claude → terms loaded → Foxx service). Nothing here is final; every identifier is a proposal.

## 0. Why terms for the interface

The panes (map, scatterplot, the joint page) hold one **state object**: what is displayed, from which
source, for which species, how. The same object is needed for deep links, for embedding a preset view
in a TYPO3 page, for sending a configured view to a colleague, and as the request body of the Foxx
service. If every key of that object is a dictionary term and every option an enumeration element,
then

- the object validates with the same validator as the data (`metadata-store-validator`);
- every label, option text, tooltip and axis legend comes from a term's `_info` in the viewer's
  language (the dictionary is multilingual, Milko 2026-11-01);
- the terms document the interface in the reference manual for free.

The axes need **no new terms**: they are climate descriptors (`env_climate_bio01`, …) whose `_title`,
`_definition` and `_unit` give the legend, the unit symbol and the tooltip.

## 1. What the dictionary already holds, and what it does not

Checked on the laptop's `metadata` database (2026-11-02).

| Needed by the panes | In the dictionary | Note |
|---|---|---|
| namespace `ui` | **exists**: "User interface — namespace for user interface label terms used by the metadata store interface", 14 label terms (`ui_nav-home`, `ui_action-close`, `ui_state-loading`, …), source `data/ui/terms.labels.json` | Label terms only: `_info._title` is the label, **no `_data`, no term role**. Our terms are different in kind: **descriptors** with a type and enumerations. Decision 1 below. |
| climate axes | all `env_climate_*` descriptors, with units | reused as-is; the pair is two GIDs |
| climate model `MPI-ESM1-2-HR`, scenario `ssp370` | **exist**, as **root-level `_object` descriptors** (no namespace; they are the nesting keys of GeoService's future blocks) | Milko's note: both already in the dictionary. For a *selector* we need them as **enumeration elements** too; decision 2. |
| `rcp45`, `rcp85` (EU-Trees4F scenarios) | **absent** | needed as nesting keys of the EU-Trees4F future blocks in `ScatterOccurrences` / `ScatterUnits` (today they are loaded as plain keys, outside the dictionary rule) and as selector options |
| periods `1961-1990`, `1970-2000`, `1981-2010`, `1991-2020`, `2011-2040`, `2021-2040`, `2021-2050`, `2041-2060`, `2041-2070`, `2051-2080`, `2061-2080`, `2071-2100`, `2081-2100` | **absent** as values; `std_date_span_range` exists as a *kind* of span | nesting keys of every climate block; today plain strings. Decision 3. |
| climate sources WorldClim 2.1, CHELSA 2.1, EU-Trees4F | **as `Dataset` records** in GeoService (`WORLDCLIM_V2.1`, `CHELSA_V2.1`, `EU-TREES4F_PREDICTORS_2022`), not as terms | the product selector is a choice among datasets; decision 4 |
| species | `species` (string), `species_list` (set of strings); no vocabulary (the EUFGIS `taxa` collection is the authority; UPOV codes to come) | reused |
| unit number, restriction | `gcu_id_number` (regexp `^[A-Z]{3}[0-9]{4,5}$`), `gcu_loc_coordinates-restriction` (boolean) | reused |
| country | `ISO_3166_1` enumeration, `eufgis_countries` namespace | reused for the country filter (the first three characters of the unit number) |
| distance unit | `unit_Length_km` | reused by the new unit descriptor |
| display hints | `_style_chip`, `_style_badge`, `_layout_horizontal`, `_usage_indicator`, … | the dictionary's own presentation hints, reusable in `_data` |

## 2. The census

Every control of the three example pages, grouped by what it describes. Columns: the proposed local
identifier (namespace decided in §3), the type in dictionary terms, the options (each an enumeration
element to create, unless marked *existing*), and where the control lives today. Default in **bold**.

### 2.1 Shared state (host page: `examples/linked.html`)

| Local id | Type | Options / constraint | Today |
|---|---|---|---|
| `species` | *existing* `species` | Latin binomial | shared bar |
| `country` | *existing* enum `ISO_3166_1` (alpha-3) | the countries of the units | shared bar |
| `unit` | *existing* `gcu_id_number` | one unit | shared bar |
| `restriction-level` | enum | `hidden` (public default), **`values`** (identifiers and climate values, no geometry: the scatterplot default), `geometry` (authenticated manager) — the three levels decided 2026-10-31 | shared bar ("restricted units in the scatterplot" is `values` vs `hidden`) |
| `flag-distance` | number, `unit_Length_km`, `_range_valid` 0–100 | threshold above which a unit's reference point is flagged; offered **5**, 1, 2, 10, 20 | shared bar |
| `layout` | enum | **`auto`** (follows the window), `side` (side by side), `stack` (stacked) | shared bar |
| `map-placement` | enum | **`page`**, `tab`, `window` | shared bar |

### 2.2 The climate selection (scatterplot; the map will take the same three keys when it gets a period selector)

| Local id | Type | Options | Today |
|---|---|---|---|
| `source` | enum | **`worldclim`** (WorldClim 2.1, 1 km), `chelsa` (CHELSA 2.1, 1 km), `eutrees4f` (EU-Trees4F: WorldClim 1.4 + EURO-CORDEX, 10 km) — see decision 4 | `product` |
| `scenario` | enum | `present` (the reference period), `ssp370` (*existing* descriptor), `rcp45`, `rcp85`; the model `MPI-ESM1-2-HR` (*existing*) is implied by the source for now | `scenario` |
| `period` | enum (or string pattern) | the 13 period labels above; see decision 3 | `period` |
| `pair` | enum | `P1` annual T × annual P, `P2` summer T × summer P, `P3` continentality × winter P, `P4` spring-summer radiation × coldest-month T, `P5` seasonality ratio × driest-month P — each element carries its two axis GIDs (decision 5) | fixed to P1 in the examples |

### 2.3 Scatterplot layers and view

| Local id | Type | Options | Today |
|---|---|---|---|
| `view` | enum | **`layers`**, `classes` (EU-Trees4F Figure 1 suitability classes) | `view` |
| `base-mode` | enum | **`points`**, `hex` (hexagon density), `none` (hidden) | `baseMode` |
| `species-mode` | enum | **`points`**, `hex`, `none` | `speciesMode` |
| `hex-radius` | integer, px, 2–10, **4** | — | `hexR` |
| `opacity-base`, `opacity-species`, `opacity-units` | integer 0–100 (%), **100** | — | the three `op` sliders |
| `envelope` | boolean, **true** | the 95 % envelope, present dashed and selected period solid | `envelope` |
| `arrows` | boolean, **true** | present → selected period | `arrows` |
| `selection-mode` | enum | **`all`** (show all units), `only` (only the selection), `hide` (hide the selection) | `selMode` |
| `selection` | set of `gcu_id_number` | the option-clicked units | `state.selection` |
| `zoom` | object {k, x, y} or the data window {x0, x1, y0, y1} | the current view window; the data window is the portable form | `tx` |

### 2.4 The suitability classes view (EU-Trees4F only)

| Local id | Type | Options | Today |
|---|---|---|---|
| `variant` | enum | **`pot`** (potential, climate only), `disp` (with natural dispersal, MigClim) | `variant` |
| `class-position` | enum | **`present`** (cells at their present climate), `future` (at the selected period) | `classPos` |
| `bin-size` | enum (a pair of steps) | `0.5,50`, `1,100`, **`2,200`** (°C × mm); better as two numbers in the axes' units, decision 6 | `binSize` |
| `bin-minimum` | integer, **100** | cells a bin needs for an arrow; offered 10, 30, 100, 300 | `binMin` |
| `class` (a value, not a control) | enum | `unsuitable` (0), `stable` (1), `decolonised` (2), `newly-suitable` (3) — the classes themselves, for legends and for the service's answer per cell | legend |

### 2.5 Map layers

| Local id | Type | Options | Today |
|---|---|---|---|
| `basemap` | enum | `none`, `boundaries` (country boundaries only, Natural Earth), `hillshade` (Esri hillshade only), **`osm-gray`** (OpenStreetMap, grey), `osm` (OpenStreetMap, colour), `topo` (OpenTopoMap) | `basemap` |
| `layer-rpp`, `layer-mhs`, `layer-t4-current`, `layer-t4-future`, `layer-chorology`, `layer-units` | boolean each, plus `opacity-*` 0–100 | Atlas relative probability of presence (**on**), Atlas maximum habitat suitability, EU-Trees4F current realised, EU-Trees4F future (period, scenario, variant from §2.2 and §2.4), chorology (**on**), units (**on**) | the six checkboxes and sliders |
| `draw-mode` | enum | **`none`** (a click sends a point), `point`, `box`, `polygon` | `draw` |
| `selection-geometry` | *existing* GeoJSON geometry (Point or Polygon, WGS84) | what the map sent; the Foxx service's query body | the `map-selection` message |
| `map-view` | object {centre, zoom} or a bounds box (*existing* `geometry_bounds`) | the map window | the OpenLayers view |

### 2.6 Messages between the panes (the host protocol)

Today three message types: `filter` (the shared state of §2.1), `map-selection` (a geometry or null),
`clear-selection`. With the terms above a message is a partial state object, so the message *type*
can disappear: a pane applies whatever keys it receives. One term for the whole state (`_object` with
`_fields` listing every key, like `std_dataset`) is enough, and a preset view is a document of that
schema.

### 2.7 Labels that are not state

The pages also show fixed texts: legends ("all EU-Forest cells", "species", "units, present", "units,
selected period", "map selection", "reference point far from the polygon", "stable", …), hints ("drag
= zoom to box · wheel = zoom …"), the pane titles, the disabled-pane message, status lines. These are
**label terms** in the sense of the existing `ui` namespace: `_info._title` as the text, no `_data`.
The enumeration elements above cover most legend entries already (a class, a layer, a mode has a
title); the rest, some twenty strings, would be label terms under the same namespace as the controls.
Listed in the handoff note once the namespace is decided.

### 2.8 A unit descriptor, not interface

| Proposed id | Type | Note |
|---|---|---|
| `gcu_loc_reference-point-distance` (or under `gcu_loc`) | number, `unit_Length_km`, `_decimals` 1, `_range_valid` ≥ 0 | distance from the climate reference point to the unit polygon on the EPSG:3035 plane, 0 when inside; today stored as `_custom.reference_point_distance_km` on `ScatterUnits` (3 669 units; 46 > 5 km, 25 > 20 km). A data-quality fact about the unit, usable by any repository. |

## 3. Decisions to take with Milko

1. **Where the control terms live.** The existing `ui` namespace is defined as *label terms of the
   metadata-store interface*. Our terms are descriptors with data types. Three options:
   (a) a sub-namespace `ui_scatter` / `ui_map` / `ui_pane` under `ui`, widening `ui`'s definition to
   "terms of the user interfaces of the ecosystem"; (b) a new root namespace of our own, e.g.
   `pane` or `view`; (c) under `eufgis`, e.g. `eufgis_view`. My preference is **(a) with one
   sub-namespace per product**: `ui_scatter` (scatterplot controls), `ui_map` (map controls),
   `ui_view` (the shared state and the host protocol, which reference the other two). `data/ui/`
   already exists in `metadata-store`, so the directory question answers itself.
2. **The scenario and model values.** `MPI-ESM1-2-HR` and `ssp370` exist as root `_object`
   descriptors because they are the nesting keys of the data. A selector needs enumeration elements
   with titles. Either the same terms get the `_term_role_enum-item` role and an `_predicate_enum-of`
   edge to a new root (one term, two roles: the dictionary allows several roles, as `_term_role`
   itself shows), or a parallel enumeration `ui_scatter_scenario_*` whose elements name the data
   keys in `_aid`. **Preference: one term, two roles**, and the same for `rcp45` / `rcp85`, which
   must become root descriptors anyway because they are nesting keys in our collections today.
3. **The periods.** Thirteen labels of the form `YYYY-YYYY`, nesting keys in every climate block.
   Options: (a) enumeration elements per period under a root such as `env_climate_period`, titled
   "1970–2000 (WorldClim 2.1 reference)" etc.; (b) a string descriptor with a regexp
   `^[0-9]{4}-[0-9]{4}$` and the list served by the Foxx service from the data. (a) gives
   translations and documentation per period (what model, what baseline); (b) needs no new term
   when a source adds a period. **Preference: (a)**, since the set is small and each period deserves
   a definition (the EU-Trees4F pairing of map periods with climate periods, for instance).
4. **The source.** The three sources are `Dataset` records; a selector element per source would
   duplicate the record's title. Alternative: the selector's values are the dataset codes
   (`WORLDCLIM_V2.1`, `CHELSA_V2.1`, `EU-TREES4F_PREDICTORS_2022`) and the titles come from the
   `Dataset` records, no new terms. But the nesting keys in our documents are `worldclim`, `chelsa`,
   `eutrees4f`, which are not terms either. **Question for Milko:** should the source keys become
   terms (an enumeration `env_climate_source` with elements `worldclim`, `chelsa`, `eutrees4f`, each
   pointing at its dataset code), which would also regularise our collections?
5. **The pairs.** Each pair element needs its two axes. Either the element carries them in `_custom`
   or in its `_description` only, or the pair is not a term and the state carries two axis GIDs
   (`axis-x`, `axis-y`, each an `_enum` scoped to `env_climate`). **Preference: the two axis GIDs**,
   with the five pairs as presets in the service's configuration; this leaves the pair set open and
   needs no pair terms.
6. **Bin size.** Two numbers in the axes' units (`bin-x`, `bin-y`) rather than an enumeration of
   pairs; the offered values stay a presentation list.
7. **The unit distance descriptor's namespace.** `gcu_loc` holds the unit location properties;
   `gcu_loc_reference-point-distance` would sit beside `gcu_loc_climate` and
   `gcu_loc_coordinates-restriction`. Alternative: keep it in `_custom` until the EUFGIS data
   quality work settles.

## 4. What the terms give at runtime

The Foxx service of step 2 reads terms through the `metadata` database's `/ui` service (read-only,
anonymous, 21 routes): `POST /term/bulk` for the labels of a page in one call, `GET /enum/:root` for
a selector's options, `POST /validate/document` to validate a state object before serving it. The
pane asks once per language for the terms it names and caches them. The `searchLanguages` setting
of that service shows the dictionary's language mechanism: every `_info` text is keyed by an
`ISO_639_3_*` term, so a second language is a second key on the same term.
