# The Foxx service of the map and scatterplot panes — design

Date: 2026-11-09. Status: **built the same day** in [`skofic/indicator-pair-scatterplots-service`](https://github.com/skofic/indicator-pair-scatterplots-service) (installed at `/panes`, 16 tests pass); Milko's standard applied: setup creates the `Scatter*` collections and named indexes idempotently; teardown spares the data unless configured. Of §10, points 1, 3 and 4 are resolved as proposed (mount `/panes`; base from the cache collection; level and country as query parameters or headers); point 2 (the suitability string's property) is open. Written as step 2 of the order agreed on 2026-11-02 (terms →
service → layout polish → Serve Plan). Decisions it rests on: the service is this project's own and the
future base of the new GeoService service (2026-10-30); the serving strategy of 2026-10-31 (a Foxx
service for everything that is a query, static hosting for the bulk; restriction levels `hidden` /
`values` / `geometry`, now the dictionary's `public` / `value` / `manage`; only the portal talks to the
database); the pane state as dictionary terms (2026-11-09); the measurements of 2026-10-31 (base pair
0.9 s / 2.7 MB, species 0.14–0.3 s, units ms, click 19 ms).

## 1. What it is

One Foxx service, **its own GitHub repository** (`skofic/indicator-pair-scatterplots-service`, Apache 2.0,
layout of `metadata-store-service`: the repository root *is* the Foxx `APP` folder — `manifest.json`,
`main.js`, `routes/`, `lib/`, `scripts/`, `test/`, `README.md`, `MILKO.md`), **mounted in `GeoService`**
at **`/panes`** (proposal; `scat` is taken by the v2 proof of concept, which stays untouched). It is
dedicated to the two panes and their host page; the GeoService services `env`, `grid`, `area` are not
touched and not depended on.

**Read-only.** Every route is a read; the only writes are the setup script's (its own cache
collections) and the cache fill. **Teardown drops only what setup created** — never a `Scatter*`
collection or `Dataset` (the metadata-store lesson of 2026-10-28 applies: a wrong mount replaces a
service and runs its teardown).

**Anonymous, behind the portal.** As the other Foxx routes under ArangoDB's
`--server.authentication-system-only`. The portal calls it and sets the restriction level per request;
a public deployment exposes it only through the portal.

## 2. Division of labour

| Who | Does |
|---|---|
| `metadata/ui` (exists) | terms, labels, enumeration elements, defaults and validation of `ui_layout_state`. The panes call it directly (cross-origin allowed), as today. |
| **this service** | everything that is a **query on GeoService**: the selector catalogue, the base layer per pair × climate, the species index list, the units with values per climate, the map selection → cells, a map click → climate values, the suitability classes, the units index and geometries for the map, the maps manifest. |
| static hosting (Serve Plan) | the **rasters** (COGs read by byte range; Foxx file serving has no range support) and the chorology GeoJSON. The service hands out their paths from `ScatterMaps`. |
| the panes | drawing, interaction, the state. |

The service answers in the **dictionary's vocabulary**: periods as `env_climate_period_*` gids with
their alias, scenarios as `env_climate_scenario_*`, classes as the `…_legend_*` aliases (digits), the
restriction level as `gcu_loc_coordinates-restriction_*`, axes as `env_climate_*` gids. It returns **no
display texts** except dataset titles and definitions (from the `Dataset` records' multilingual `_info`,
selected by the `lang` parameter), because every label lives in the dictionary.

## 3. The request vocabulary: a `ui_layout_state`

Every data route takes its parameters **as state keys** (query parameters named by gid, or a JSON
body for the selection), so the pane sends what it holds and the service reads what it needs:

| Key | Used by |
|---|---|
| `std_dataset_ids` (one dataset `_key`) | which climate source block |
| `env_climate_period`, `env_climate_scenario` (gids) | which period block; the service resolves alias → data key (`1961-1990`, `rcp45`) and the model (`MPI-ESM1-2-HR`) from its configuration |
| `ui_layout_scatterplot_X`, `ui_layout_scatterplot_Y` | the two indicator gids; must be a configured pair of axes |
| `species` | the species (scientific name; UPOV later) |
| `gcu_id_country`, `gcu_id_number` | unit filters |
| `gcu_loc_coordinates-restriction_level` | the restriction level (**the portal sets it**, §6) |
| `ui_layout_map_selection` | the geometry (body) |
| `ui_layout_scatterplot_view_classes_variant` | `pot` / `disp` for the classes |

A route rejects an unknown dataset, period, scenario, axis or species with 400 and the offending
key. **Full validation of a state is not duplicated here**: the pane (and later the portal) validates
with `metadata/ui` `POST /validate/document`; the service checks what it consumes. One route forwards
for convenience (§4, `/state/validate`), implemented with `@arangodb/request` to the metadata service
(a Foxx service cannot query another database directly).

## 4. Routes

All `GET` unless noted; JSON; `ETag` and `Cache-Control` on everything that depends on data only.
"Index list" = positions in the **global cell order** (every `ScatterOccurrences` document sorted by
`_key`), the shape settled on 2026-11-01 in the exports.

| Route | Answer | Notes |
|---|---|---|
| `/catalogue` | the selector catalogue: datasets (key, code, title, definition in `lang`), per dataset its scenarios and periods as gids with aliases, the configured axis pairs (X list, Y list, X → Y suggestion), the species with availability flags (scatterplot data, Atlas maps, EU-Trees4F maps, unit count), the countries present | replaces `climates.json`, `meta.json`, the species list of `units-index.json`; cached 1 h |
| `/cells` | `[[lon, lat], …]` in the global order | 250 569 × 2 floats, ~6 MB; cached, `ETag`; needed only by a pane that resolves selections itself (the service does it in `/selection`, so this may stay unused) |
| `/base` | `[[x, y] \| null, …]` for `X`, `Y`, dataset, period, scenario, in the global order | ~2.7 MB; **computed on first request and stored in `PanesCache`** (one document per key; ArangoDB documents may hold it), served from there afterwards; 16 climates × 5 pairs = 80 documents; the setup script can prefill |
| `/species/cells` | index list of the cells holding `species` | 35 k integers for beech; from `idx_species_list` |
| `/species/units` | the units of `species` at the requested level: `gcu_id_number`, `species_list`, `gcu_loc_coordinates-restriction`, `gcu_loc_climate_distance`, `values` per climate key `[x, y]` for `X`, `Y`; at `manage`: `gcu_loc_climate` | restricted units omitted at `public`; filters `gcu_id_country`, `gcu_id_number` |
| `/species/classes` | the suitability class per cell for the EU-Trees4F period / scenario / variant, as a digit string in the global order | from `PanesSuitability` (§5); 404 for a non-EU-Trees4F climate |
| `POST /selection` | body `{ ui_layout_map_selection: <GeoJSON> }` → `{ cells: index list, point: { values: [x, y], cell: <climate cell key> } }` | Polygon: `GEO_CONTAINS` on `idx_geometry_point`; Point: the containing surveyed cell if any, **and** the climate cell's pair values from the 1 km grid (`WorldClim` / `Chelsa` by the offline-derived key, EU-Trees4F from `ScatterCells` where cached) so a click anywhere gets values |
| `/units/index` | every unit (level-filtered): number, country, species, restricted, distance | the host page's facets; replaces `units-index.json` |
| `/units/geo` | GeoJSON FeatureCollection of unit polygons (simplified) or points, with the same properties | **never restricted units below `manage`**, and at `manage` only the requester's country (§6); replaces `units-geo-all.geojson` |
| `/maps` | per species: Atlas RPP / MHS paths, EU-Trees4F binary layer paths by `period\|scenario\|variant`, chorology paths, each with CRS, licence, citation | from `ScatterMaps`; the files themselves come from static hosting; replaces `map-index.json` |
| `POST /state/validate` | forwards to `metadata/ui/validate/document` with `descriptor: ui_layout_state`, `compute: true`; returns its answer | for the portal, so that one origin suffices; the panes may keep calling the dictionary directly |
| `/health` | collections present, cache state, metadata service reachable, counts | for monitoring and the install check |

The `/base` answer is the one large payload; its cache document plus `ETag` makes the second request
free. If the Serve Plan prefers files, the same documents are written to disk by a script and the pane
switches URL; the route stays.

## 5. Collections and indexes

**Read** (exist): `ScatterOccurrences` (`idx_species_list`, `idx_geometry_point` geo), `ScatterUnits`
(`idx_species_list`), `ScatterCells`, `ScatterSpecies`, `ScatterMaps` (`idx_species_dataset`), `Dataset`,
`WorldClim`, `Chelsa` (key lookups), `UnitPolygons` (polygons for `/units/geo`).

**Owned by the service** (created by `setup.js`, dropped by `teardown.js`):

- `PanesCache` — `_key` = `<route>|<dataset>|<period>|<scenario>|<X>|<Y>`, `payload` (the JSON
  answer), `etag`, `built`, `count`. A cache, so `_custom`-style freedom is acceptable; or `_key` only
  with a body under `_custom`.
- `PanesSuitability` — one document per species × EU-Trees4F period × scenario × variant, the class
  digit string in the global order, written by this repository's loader (`sources/export/suitability.js`
  becomes a loader; Python samples the rasters as today). **Open point for Milko:** the string needs a
  property name. Options: (a) a descriptor to request, e.g. `env_suitability_classes` ("one
  `ui_layout_scatterplot_view_classes_legend` alias per cell of the global order"); (b) keep it as an
  internal cache under `_custom`. I lean to (a): it is data derived from a published source, cited in
  the Dataset record, not interface state.

**Indexes to add** (this repository's `setup.js`): none strictly; a persistent index on
`ScatterUnits.gcu_id_number` is the primary key already; `ScatterSpecies.species` exists.

## 6. The restriction level

`gcu_loc_coordinates-restriction_level` on every unit route, with these rules, enforced in one
function used by every route:

| Level | Units returned | Geometry |
|---|---|---|
| `public` (default when absent) | unrestricted only | polygons / points of unrestricted units |
| `value` | all, restricted ones with identifiers, climate values and distance | unrestricted only |
| `manage` | all | restricted ones **only for the requester's country**, given as `gcu_id_country` by the portal |

The level and the country are **request parameters set by the portal**, never by the pane's user; in
the examples they are URL parameters because there is no portal. A deployment behind the portal can
additionally pin the maximum level in the manifest configuration (`maxLevel`), so a public instance can
never answer `manage`.

## 7. Configuration (manifest)

| Option | Default | Purpose |
|---|---|---|
| `metadataUi` | `http://localhost:8529/_db/metadata/ui` | the dictionary service, for `/state/validate` and the setup check |
| `pairs` | the five pairs as `[X gid, Y gid]` plus the X and Y option lists | the axis vocabulary; a sixth pair is a configuration change |
| `sources` | the three datasets: code → nesting key (`worldclim`, `chelsa`, `eutrees4f`), period section, model, future scenarios | the state → data mapping (today in `config/indicators.js`) |
| `maxLevel` | `manage` | the highest restriction level this instance may answer |
| `cacheTtl` | `0` (forever, until data reload) | `PanesCache` life; setup empties it |
| `lang` | `ISO_639_3_eng` | fallback language for dataset titles |

## 8. Lifecycle and tests

- `setup.js`: create `PanesCache` and `PanesSuitability` if absent; verify the read collections and
  indexes exist (warn, never create them — they belong to this repository's pipeline); check the
  dictionary service; optionally prefill `/base` for the configured pairs (a flag, since it takes
  80 × ~1 s).
- `teardown.js`: drop the two owned collections only.
- Tests inside the database (`test/`), as `metadata-store-service` does: catalogue shape; base length
  = global order length and null handling; species index monotonic and within range; units at the
  three levels (a restricted unit absent / present without geometry / present with geometry for its
  country only, never for another); selection by polygon returns cells inside; click returns values
  for a point with and without a surveyed cell; classes string length; validation forward.
- Install from GitHub through the ArangoDB web interface or `foxx install /panes https://github.com/skofic/indicator-pair-scatterplots-service/archive/main.zip`;
  development mode for editing; the README documents it as the sibling does.

## 9. What this repository does once the service exists

1. The pages get a `service.js` twin of `dictionary.js` (`?api=` base URL, default
   `http://localhost:8529/_db/GeoService/panes`) and switch from the exported files to the routes:
   catalogue, base, species cells, units, selection, classes, units index and geo, maps. The static
   export (`sources/export/*`) stays as the offline fixture and for comparison.
2. The **pair selector** (X and Y popups, suggestion once) and the **map's period selector** become
   possible, since every pair and period comes from the catalogue.
3. `sources/export/suitability.js` becomes the `PanesSuitability` loader (if option 5a: after the term).
4. Performance is re-measured on the routes against the 2026-10-31 figures.

## 10. Open points for Milko

1. Mount point `/panes` and repository name `indicator-pair-scatterplots-service`.
2. The suitability string's property (§5): a descriptor to request, or a cache under `_custom`.
3. Whether `/base` is served from the cache collection (my proposal) or written to static files by a
   script and served by the web server; the route exists either way.
4. Whether the portal passes the restriction level and the country as query parameters or as headers;
   the service can read both, the choice is the portal developers'.
