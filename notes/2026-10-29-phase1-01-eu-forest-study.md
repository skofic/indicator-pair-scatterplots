# Phase 1, item 1 — EU-Forest study

Date: 2026-10-29. Status: **complete; the decisions in section 6 were confirmed by Milko the same day** (see the decisions log in `CLAUDE.md` for the refined wording).

Question from the brief: *the distribution maps generated in that project show the location of the
species as continuous areas rather than the points in the data. How was that done, and what
additional datasets were used to interpolate and spread the point occurrences?*

Short answer: **EU-Forest itself publishes points only and draws no continuous species maps.** The
continuous maps come from the **European Atlas of Forest Tree Species** (same JRC team, same
harmonised plot data). They are not interpolations: they are two modelled 1 km rasters, a
*relative probability of presence* (C-SMFA model) and a *maximum habitat suitability* (RDS-MHS
model), plus expert-drawn chorology polygons. The Atlas also contains the **autoecology diagrams**,
which are exactly the three scatterplot pairs in `notes/scatterplot-example-simple.jpeg` (that image
is the *Fagus sylvatica* page of the Atlas). Details and consequences follow.

---

## 1. The EU-Forest dataset

**Reference.** Mauri A., Strona G., San-Miguel-Ayanz J. (2017). *EU-Forest, a high-resolution tree
occurrence dataset for Europe.* Scientific Data 4:160123. doi:10.1038/sdata.2016.123 (open access,
Europe PMC id PMC5215058). Data: figshare collection doi:10.6084/m9.figshare.c.3288407.

**Sources merged** (paper, Methods):

| Source | Share | Plots | Notes |
|---|---|---|---|
| National Forest Inventories (NFI) dataset, JRC framework contract (2008) with 19 EU states + Norway + Switzerland | 96 % of raw records | 248 776 | 78 genera, 242 species |
| Forest Focus monitoring (Level I/II plots) | 4 % together with BioSoil | 8 564 | 23 genera, 47 species |
| BioSoil biodiversity module | | 3 367 | 57 genera, 187 species |

Raw records 1 000 525; after removing non-species-level and repeat-sampling duplicates:
**249 410 plots**, **588 983 species-level occurrences (242 species)**, 589 657 genus-level
occurrences. Known NFI coverage gaps: Poland, Croatia, Slovenia, Greece, Bulgaria, Cyprus, Belarus,
Moldova, Canary Islands (partly filled by Forest Focus / BioSoil). Survey years are **not stated**
in the paper (NFI cycles up to the 2008 contract; Forest Focus 2003 onwards; BioSoil 2006-2007).

**Spatial harmonisation** (the key passage): raw data were available at higher resolution but were
*"aggregated at a lower spatial resolution of 1 square kilometre, in line with an INSPIRE-compliant
1 km×1 km grid"* for two reasons: to standardise heterogeneous NFI designs, and to comply with
owners' privacy rules that prevent exact plot locations from being published. Forest Focus and
BioSoil records were likewise snapped to the centroid of the cell they fall in. So **every EU-Forest
coordinate is a 1 km cell centroid in ETRS89-LAEA (EPSG:3035)**. The figshare description says
"EPSG:3015", which is a typo.

**Files on figshare** (collection 3288407):

| figshare id | File | Content |
|---|---|---|
| 3497885 | `EU-Forest-species.csv` (36.9 MB) | X, Y, COUNTRY, SPECIES NAME, DBH-1, DBH-2, NFI, FF, BS, EEO |
| 3497888 | `EU-Forest-genus.csv` (18.9 MB) | X, Y, COUNTRY, Genus name |
| 3497891 | `Occurrences.zip` (5.1 MB) | 242 per-species point shapefiles |
| 3497894 | `EOOs.zip` (0.3 MB) | per-species *extent of occurrence* polygon shapefiles (α-shapes, α = 6°, ModestR), for species with ≥ 3 occurrences; verified 2026-10-29: 203 shapefiles in `shapefiles_hull/`, **WGS84**, not EPSG:3035 |
| 4114035 | `Metadata.docx` | |

Columns: `DBH-1`/`DBH-2` = diameter class present (1 = < 120 mm, 2 = ≥ 120 mm, −9999 unknown);
`NFI`/`FF`/`BS` = source flags (1 or −9999); `EEO` = 1 if the record falls inside the species' EOO
polygon (the paper calls it EOO, the file calls it EEO). **There are no absence records**: the file
is presence-only per (cell, species).

**Local copies** (verified): `/Users/milko/Local/Backup/ArangoDB/data/EU-Forest_species.csv` and
`EUForestspecies.csv` (identical, 588 983 rows) and `EUForestgenus.csv` (589 657 rows). Checked with a
script on 2026-10-29:

| Statistic | Value |
|---|---|
| Records / species / countries | 588 983 / 242 / 30 |
| Unique (X, Y) cells | 250 569 |
| X range, Y range (m, EPSG:3035) | 1 551 500 – 6 444 500, 843 500 – 5 355 000 |
| Coordinates ending in `500` (true cell centroids) | 572 678 (97 %) |
| Coordinates ending in `000` | 16 305 (3 %, probably the Forest Focus / BioSoil snap) |
| Source flags set: NFI / FF / BS / EEO | 558 282 / 15 723 / 18 665 / 586 234 |
| Most frequent species | *Pinus sylvestris* 75 720, *Picea abies* 70 310, *Fagus sylvatica* 35 862, *Quercus robur* 31 079 |

Note the country spelling `Polland` in the file.

**Validation in the paper**: names resolved with TNRS / ITIS; biogeographical consistency checked with
Infomap Bioregions at 0.5°; EOO α-shapes used to flag outliers. **Figures in the paper**: Fig. 1 all
occurrences as points; Fig. 2 hexagon density per source; Fig. 3 richness and rarity at 0.5°; Fig. 4
bioregions at 0.5°. **No per-species distribution map is drawn in the paper.**

---

## 2. Where the continuous maps come from: the European Atlas of Forest Tree Species

**Reference.** San-Miguel-Ayanz J., de Rigo D., Caudullo G., Houston Durrant T., Mauri A. (eds.)
(2016). *European Atlas of Forest Tree Species.* Publications Office of the EU. Methodology chapter:
de Rigo D., Caudullo G., Houston Durrant T., San-Miguel-Ayanz J. (2016), *The European Atlas of Forest
Tree Species: modelling, data and information on forest tree species*, pp. e01aa69+
(https://w3id.org/mtv/FISE-Comm/v01/e01aa69). Chapter PDFs:
https://forest.jrc.ec.europa.eu/en/european-atlas/atlas-download-page/ (the modelling chapter is
`Modelling_data_and_information_on_forest_tree_species.pdf`, 19 MB; copies of the extracted text were
read on 2026-10-29). Technical report on the data: Beck P.S.A. et al. (2020) *Tree species
distribution data and maps for Europe*, doi:10.2760/489485.

**Input data** (same family as EU-Forest, harmonised to the INSPIRE 1 km grid, EPSG:3035): the NFI
database (~375 000 sample points with presence/**absence**, 21 countries), Forest Focus (8 600
points), BioSoil (3 300 points), **EUFGIS (~2 500 samples, 98 target species)** and the EVOLTREE
(GD)² genetic database. Plus forest-cover maps as constraints: Pan-European Forest Type Map 2006
(25 m), CORINE Land Cover 2006, ESA GlobCover 2009.

Each species chapter carries four products:

| Product | What it is | How it is made | Resolution |
|---|---|---|---|
| **Map 1 Frequency + Chorology** | dots = % of plots per 50 km cell containing the species; green/orange polygons = native / introduced range | frequency counted from the plot data; chorology hand-digitised from Meusel & Jäger, Hultén & Fries, Atlas Florae Europaeae, EUFORGEN maps (Caudullo, Welk, San-Miguel-Ayanz 2017, Data in Brief 12:662, doi:10.1016/j.dib.2017.05.007; shapefiles on Mendeley Data `hr5h2hcgg4` and per species on figshare) | 50 km / vector |
| **Map 2 Relative Probability of Presence (RPP)** — *the continuous green map* | probability that a plot of negligible area inside the 1 km pixel contains the species, for the **whole pixel, not only its forested part** | **C-SMFA, constrained spatial multi-scale frequency analysis**: a spatial frequency analysis of the presence/absence plot records at *multiple spatial scales* to cope with uneven plot density, *constrained* by the independent probability of finding a broadleaved / coniferous tree from the land-cover maps, and made robust by an ensemble of *hundreds of statistically resampled intermediate maps* (~20 000 intermediate 1 km layers for the Atlas) | 1 km |
| **Map 3 Maximum Habitat Suitability (MHS)** — the blue/orange map | how similar each pixel's bioclimate is to the bioclimate of *at least some* plots where the species occurs; "high survivability" vs "negligible survivability" | **RDS-MHS, relative distance similarity**, over a set of **12 bioclimatic and topographic covariates** | 1 km |
| **Autoecology diagrams** | three 2-D slices of the bioclimatic space: grey = *all harmonised field plots, including absences*; blue = plots where the species was observed | the same covariates as RDS-MHS, plotted pairwise | plot level |

The three autoecology pairs are exactly our brief's scatterplots:

1. annual average temperature (°C) × annual precipitation (mm);
2. potential spring-summer solar irradiation (kWh m⁻²) × average temperature of the coldest month (°C);
3. seasonal variation of monthly precipitation, defined as (P_wettest − P_driest) / P_wettest, dimensionless × precipitation of the driest month (mm).

**The bioclimatic covariates and their source.** Caudullo G. (2014), *Applying Geospatial Semantic
Array Programming for a Reproducible Set of Bioclimatic Indices in Europe*, IEEE Earthzine
(https://earthzine.org/applying-geospatial-semantic-array-programming-for-a-reproducible-set-of-bioclimatic-indices-in-europe/):
the 12 covariates are derived from **WorldClim v1.4** (30 arc-second, 1950-2000 baseline, monthly
tmean/tmin/tmax/prec) and **GMTED2010** elevation, on a WGS84 30 arc-second grid covering Europe to the
Urals; the *potential* solar irradiation is computed from the DEM with GRASS `r.sun` (7.5 arc-second,
aggregated to 30 arc-second), chosen over actual irradiation "due to its stability under different
climate change scenarios". So **the Atlas diagrams and MHS maps rest on the same obsolete WorldClim
1.4 baseline that the brief wants to replace.**

**C-SMFA / RDS primary reference**: de Rigo D., Caudullo G., Busetto L., San-Miguel-Ayanz J. (2014),
EFSA Supporting Publication 2014:EN-434, doi:10.2903/sp.efsa.2014.EN-434. Could not be fetched
automatically (Wiley returns 403); not needed for the decisions below but worth a manual download if
we ever want the algorithmic detail. The implementation (Mastrave / GeoSemAP codelets) is only partly
published.

**Downloads of the Atlas rasters** (checked 2026-10-29, HTTP 200): per species,
`https://ies-ows.jrc.ec.europa.eu/efdac/download/Atlas/<Genus>-<species>_rpp.zip` (~20 MB) and
`..._mhs.zip` (~12 MB); chorology `..._cho.zip`. Index and metadata:
https://forest.jrc.ec.europa.eu/en/european-atlas/atlas-data-and-metadata/.

**EU-Trees4F maps** are a third, different thing: Biomod2 ensemble species distribution models at
10 km, masked by chorology and land use. They are the subject of Phase 1 item 2.

---

## 3. What this means for the brief's question 1.1

- "Continuous areas" are **modelled surfaces, not interpolations of the EU-Forest points**. There are
  two of them, with different meanings: RPP is a data-driven, land-cover-constrained smoothing of plot
  presence/absence; MHS is a climate-similarity envelope. Neither can be reproduced from the public
  EU-Forest file alone, because both need the **absence** records of the plots (the EU-Forest file is
  presence-only) and, for RPP, the proprietary multi-scale implementation and the land-cover
  constraints.
- The additional datasets involved: land-cover forest-type maps (FTM 2006, CLC 2006, GlobCover 2009)
  as constraints for RPP; WorldClim 1.4 + GMTED2010 + r.sun irradiation for MHS; chorology polygons
  (Meusel & Jäger, Hultén & Fries, Atlas Florae Europaeae, EUFORGEN) for the range outline.
- The Atlas rasters are **published, downloadable, 1 km, EPSG:3035 GeoTIFFs** and already include
  EUFGIS samples among their inputs. Replicating the model is unrealistic; using the rasters is
  realistic.

## 4. What this means for the scatterplots (the real product)

This is the more valuable finding. The Atlas autoecology diagram is a published, peer-reviewed
template for exactly our product, and it defines the **base layer differently from v1**:

| Layer | Atlas definition | v1 (`species-distribution`) | Size |
|---|---|---|---|
| Base (grey) | *all surveyed field plots*, including those where the species is absent | every CHELSA grid cell in the project region | ~250 000 cells vs > 27 million points |
| Species (blue) | plots where the species was observed | EU-Forest cells for the species | same |
| Units (ours) | not in the Atlas | EUFGIS GCU polygons × grid | — |

Using the union of all EU-Forest cells (250 569 cells, any species) as the base layer reproduces the
Atlas definition almost exactly, since EU-Forest is the public release of those same plots; it has a
scientific precedent, and it is two orders of magnitude smaller than the whole-grid base. The
whole-grid base remains an option ("where in Europe's climate space does the species sit") but it is a
different statement and should be a deliberate choice.

Replacing WorldClim 1.4: each Atlas axis has a direct or computable equivalent in the grids already in
`GeoService`:

| Atlas axis | WorldClim 2.1 / CHELSA 2.1 equivalent |
|---|---|
| annual average temperature | `bio1` |
| annual precipitation | `bio12` |
| average temperature of the coldest month | compute min over the 12 monthly `tavg` layers (`bio6` is the *minimum* temperature of the coldest month, not the same) |
| precipitation of the driest month | `bio14` |
| seasonal variation of monthly precipitation, (Pmax − Pmin)/Pmax | compute from the 12 monthly `prec` layers (`bio15` is a coefficient of variation, not the same) |
| potential spring-summer solar irradiation | not a WorldClim/CHELSA product: it is DEM-derived (r.sun). Options: recompute from a DEM, or substitute actual radiation (`srad` in WorldClim 2.1, `rsds` in CHELSA) with a stated caveat |

Baselines differ: WorldClim 1.4 = 1950-2000, WorldClim 2.1 = 1970-2000, CHELSA 2.1 = 1981-2010.
CHELSA's window is closest to the inventory years.

Coordinate handling: EU-Forest centroids are EPSG:3035 and the climate grids are WGS84 30 arc-second
(~0.9 km × 0.5-0.6 km at European latitudes), so each 1 km LAEA cell maps to 1-2 climate cells. v1
already reprojected the centroids with the proj4 LAEA definition (`species-distribution/RUN-INIT.js`);
the sampling rule (nearest cell vs. mean of overlapped cells) must be stated explicitly in the Data
Plan.

## 5. Open points carried forward

- Survey years of the plots are not published; for the record only, since any 30-year climate
  baseline is defensible.
- The C-SMFA / RDS EFSA report (EN-434) was not readable by automated fetch; manual download if ever
  needed.
- EU-Trees4F (item 2) must be checked for *its* occurrence source (EU-Forest? the `species_occurrences`
  CSVs in the local reproducibility scripts are LON/LAT, so already reprojected and possibly filtered).

## 6. Decisions (confirmed 2026-10-29)

1. **Do not attempt to replicate the Atlas C-SMFA or RDS-MHS models.** Treat the published Atlas RPP
   and MHS rasters (1 km, EPSG:3035) as candidate map layers alongside the EU-Trees4F rasters, to be
   weighed in the Data Plan.
2. **Model the scatterplot on the Atlas autoecology diagram**: base = all surveyed EU-Forest cells
   (presence of any species), species = cells where the target species occurs, top = EUFGIS units.
   Keep the whole-climate-grid base as an explicitly separate option.
3. **Climate sources in order**: EU-Trees4F historical predictors first (7 layers, 5 arc-min ≈ 10 km,
   WGS84, already on disk), then WorldClim 2.1 and CHELSA 2.1 (1 km, in GeoService) if an overlay of
   the same pair from the three sources shows a visible difference. The pipeline is built once with a
   pluggable climate source. The three Atlas pairs remain the reference set of indicator pairs; the
   solar-irradiation axis still needs a decision (recompute vs. substitute).
