# Indicator pair scatterplots

Tree species **distribution maps** and **indicator pair scatterplots** for the
[EUFGIS](http://www.eufgis.org) portal, the European information system on forest gene
conservation units (GCUs), developed within the [FORGENIUS](https://www.forgenius.eu) project.

Both products are meant to be served as web panes that work stand-alone and embedded in the EUFGIS
portal. The scatterplots show, for a pair of climate indicators, where a species' occurrences sit
within the climate space of European forests, and where the gene conservation units sit in relation
to the species. The maps show the species' current and future distribution with the units on top.

## Status

**Phase 2, data plan, complete; Phase 3, display plan, next.** The data pipeline lives in `sources/`, `lib/` and `config/`; see `CLAUDE.md` §6 for the layout and the database conventions. The work follows a four-phase plan
(study, data, display, serve), one item at a time, with every decision recorded. The living plan,
its status and the decisions log are in [`CLAUDE.md`](CLAUDE.md).

## Scientific basis

- **EU-Forest** (Mauri, Strona & San-Miguel-Ayanz 2017, Scientific Data,
  [doi:10.1038/sdata.2016.123](https://doi.org/10.1038/sdata.2016.123)) — the pan-European tree
  occurrence dataset: 588 983 species occurrences on a 1 km grid, the source of our species layer.
- **European Atlas of Forest Tree Species** (San-Miguel-Ayanz et al. 2016, JRC,
  [forest.jrc.ec.europa.eu](https://forest.jrc.ec.europa.eu/en/european-atlas/)) — built from the
  same plot data; its per-species 1 km *relative probability of presence* and *maximum habitat
  suitability* maps are map layers we serve, and its *autoecology diagrams* are the model for our
  scatterplots.
- **EU-Trees4F** (Mauri et al. 2022, Scientific Data,
  [doi:10.1038/s41597-022-01128-5](https://doi.org/10.1038/s41597-022-01128-5)) — ensemble species
  distribution models for 67 species, current and 2035 / 2065 / 2095 under RCP 4.5 and 8.5, at 10 km;
  the source of our future map layers and of the first climate layers for the scatterplots.

Climate grids for the scatterplots come from [WorldClim 2.1](https://www.worldclim.org) and
[CHELSA 2.1](https://www.chelsa-climate.org), as loaded in the EUFGIS `GeoService` database by the
[`metadata-external-databases`](https://github.com/skofic/metadata-external-databases) repository.

## Repository layout

| Path | Content |
|---|---|
| `CLAUDE.md` | The living plan: context, ecosystem, phases, status, decisions log, working conventions |
| `notes/Indicator Pair Scatterplots.md` | The original brief |
| `notes/old-version-readme.md` | README of the earlier attempt ([`skofic/species-distribution`](https://github.com/skofic/species-distribution)), kept as reference |
| `notes/<date>-phase<n>-<item>-*.md` | Study notes and decision documents, one per plan item |
| `notes/*.jpeg`, `notes/*.webp` | Example scatterplots from the Atlas and from EU-Trees4F |
| `config/indicators.js` | The indicator pairs, climate sources, dictionary GIDs and raster scaling |
| `lib/` | Database connection, grid-cell geometry and keys, dictionary validation, record builders |
| `sources/` | One folder per collection-plan step: `species`, `occurrences`, `climate/eutrees4f`, `units`, `datasets`, `maps` |
| `setup.js` | Creates the project's collections and indexes in `GeoService` |
| `data/` | Small committed inputs: source species lists, synonyms |
| `work/`, `maps/` | Work files and downloaded rasters, regenerated, ignored |
| `scrapbook/` | Ignored scratch space |

## Related repositories

- [`metadata-external-databases`](https://github.com/skofic/metadata-external-databases) — ingestion
  of external environmental data into the `GeoService` ArangoDB database.
- [`metadata-store`](https://github.com/skofic/metadata-store) — the data dictionary shared by all
  EUFGIS databases.
- [`species-distribution`](https://github.com/skofic/species-distribution) — the first version of the
  scatterplot data pipeline, reference only.
- [`ecological-niche-data`](https://github.com/skofic/ecological-niche-data),
  [`ecological-niche-service`](https://github.com/skofic/ecological-niche-service),
  [`ecological-niche-scatterplots`](https://github.com/skofic/ecological-niche-scatterplots) — the
  second version, built on EU-Trees4F (data pipeline, Foxx API, Plotly prototype); prior work.

## Running the pipeline

```sh
npm ci --omit=optional                                   # Node dependencies (arangojs, the dictionary validator)
python3 -m venv .venv && .venv/bin/pip install rasterio numpy pyproj shapely
cp globals/auth/db.credentials.prototype.json globals/auth/db.credentials.json   # then fill it in
npm run occurrences:build                                # EU-Forest → work/occurrences.jsonl
npm run eutrees4f:sample                                 # 5′ predictors → work/climate-eutrees4f.jsonl
npm run species:build                                    # → work/species.jsonl
node setup.js                                            # collections and indexes
node sources/units/species.js && npm run species:build   # unit target species → species table
node sources/species/load.js
node sources/climate/geoservice/probe.js                 # verify offline cell keys against the grids
node sources/climate/geoservice/lookup.js --source worldclim   # and --source chelsa: 1 km values + derived
node sources/climate/geoservice/lookup.js --source chelsa --period 2041-2070   # one run per future period
.venv/bin/python sources/climate/eutrees4f/sample_future.py  # EU-Trees4F future periods × RCPs
node sources/occurrences/load.js --on-missing drop       # dictionary check, then load (--dry-run to check only)
node sources/climate/geoservice/load_cells.js            # the per-cell cache
node sources/units/export.js && .venv/bin/python sources/climate/eutrees4f/sample.py --in work/units.jsonl --out work/climate-units-eutrees4f.jsonl
node sources/units/load.js
sh sources/maps/download_atlas.sh; sh sources/maps/convert_eutrees4f.sh; sh sources/maps/convert_atlas.sh
node sources/maps/manifest.js                            # ScatterMaps + the map Dataset records
.venv/bin/python sources/compare/compare_sources.py      # the three-source comparison (work/compare)
```

## Licence

[Apache License 2.0](LICENSE).
