# Handoff to `metadata-store`: corrections to the WorldClim / CHELSA climate descriptors

From: the `indicator-pair-scatterplots` project (Milko, with Claude), 2026-10-30.
To: the Claude session working in `metadata-store`.
Scope: the `env_climate_*` descriptor terms in `data/EUFGIS/env/terms.properties.json`.

The issues below were first flagged by the `metadata-external-databases` work on 2026-07-15
(`notes/2026-07-15-worldclim.md`, §P4, "pre-existing dictionary issues noticed while drafting — NOT
changed"), and **re-verified on 2026-10-30 against the current JSON**: all of them are still present.
The `_description` texts added in July are correct; the errors sit in `_title`, `_definition` and one
`_data` unit. Authoritative definitions: WorldClim 2.1 bioclimatic variables
(https://www.worldclim.org/data/bioclim.html) and the CHELSA 2.1 technical specification
(https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf). Both datasets
use the same BIO1–BIO19 definitions.

## A. Errors (should be corrected)

| Term | Field | Current | Problem | Proposed |
|---|---|---|---|---|
| `env_climate_bio06` | `_definition` | "The lowest temperature of any monthly daily mean **maximum** temperature." | BIO6 is the minimum temperature of the coldest month; the word "maximum" is a copy of BIO5's definition. The `_title` and `_description` are already correct. | "The lowest of the twelve monthly mean daily minimum air temperatures." |
| `env_climate_bio03` | `_data._scalar._number_float._unit` | `unit_Temperature_deg-C` | Isothermality is BIO2 / BIO7 × 100, a dimensionless percentage, not a temperature. | `unit_Dimensionless_1`, which `env_climate_ai` already uses (BIO3 is a percentage; if the ontology has a percent unit, that is better still). |
| `env_climate_bio16` … `bio19` | `_title` | "**Mean monthly** precipitation amount of the wettest / driest / warmest / coldest quarter" | WorldClim and CHELSA BIO16–19 are the **total** precipitation of the three-month quarter (sum), as the `_description` texts already say. The loader stores the quarter sum. | "Precipitation amount of the wettest quarter" (etc.), i.e. drop "Mean monthly". |
| `env_climate_bio05` | `_title` | "… air **temperture** of the warmest month" | Typo. | "temperature" |
| `env_climate_bio08` … `bio11` | `_title` | "Mean daily mean air **tempertures** of the … quarter" | Typo (plural and spelling). | "Mean daily mean air temperature of the wettest / driest / warmest / coldest quarter" |

## B. Weak definitions (should be rewritten; not wrong, but they describe a procedure, not the variable)

| Term | Current `_definition` | Proposed |
|---|---|---|
| `env_climate_bio08` | "The wettest quarter of the year is determined (to the nearest month)." | "Mean air temperature of the three consecutive months with the highest total precipitation." |
| `env_climate_bio09` | "The driest quarter of the year is determined (to the nearest month)." | "Mean air temperature of the three consecutive months with the lowest total precipitation." |
| `env_climate_bio10` | "The warmest quarter of the year is determined (to the nearest month)." | "Mean air temperature of the three consecutive warmest months." |
| `env_climate_bio11` | "The coldest quarter of the year is determined (to the nearest month)." | "Mean air temperature of the three consecutive coldest months." |
| `env_climate_bio16` | "The wettest quarter of the year is determined (to the nearest month)." | "Total precipitation of the three consecutive months with the highest precipitation." |
| `env_climate_bio17` | same pattern | "Total precipitation of the three consecutive months with the lowest precipitation." |
| `env_climate_bio18` | same pattern | "Total precipitation of the three consecutive warmest months." |
| `env_climate_bio19` | same pattern | "Total precipitation of the three consecutive coldest months." |

## C. For information, no change requested

- `env_climate_bio04` is distributed ×100 (WorldClim) / ×1000 (CHELSA) and the loaders rescale it, so
  the stored value is the standard deviation in °C; the `deg-C` unit and the description are
  consistent. Nothing to do.
- `env_climate_pr` carries `unit_MassFluxDensity_kg-per-m2-per-month` while the loaders store
  millimetres; 1 kg m⁻² of water is 1 mm, so the values are consistent. Worth a sentence in the
  description if the unit is kept.
- `env_climate_gdd0`, `gdd5`, `gdd10` (growing-degree-day heat sums) carry `unit_Temperature_deg-C`.
  A heat sum is in degree-days (°C·day), not degrees; worth checking whether the unit ontology has a
  degree-day unit. Noticed in passing on 2026-10-30, not verified against CHELSA's own unit statement.
- The GeoService `Dataset` records for CHELSA and WorldClim, and the Foxx `chelsaAggregateAQL.js`
  field lists, have their own open items in `metadata-external-databases/ROADMAP.md`; they are not
  dictionary matters.

## D. Heads-up: terms this project will probably request later (not yet; the Data Plan decides)

The scatterplot axes chosen so far are derived from the monthly layers and have **no term today**:

| Working name | Definition | Source | Unit |
|---|---|---|---|
| summer temperature | mean of June–August monthly mean air temperature | monthly `tas` | °C |
| summer precipitation | mean of June–August monthly precipitation | monthly `pr` | mm/month |
| winter precipitation | mean of December–February monthly precipitation | monthly `pr` | mm/month |
| continentality | mean temperature of the warmest month minus mean temperature of the coldest month (`envirem` definition, as in EU-Trees4F) | monthly `tas` | °C |
| mean temperature of the coldest month | minimum of the twelve monthly mean air temperatures (not BIO6, which is the mean daily *minimum*) | monthly `tas` | °C |
| spring-summer solar radiation | sum of March–August monthly solar radiation (actual, not potential; replaces the Atlas's DEM-derived potential irradiation) | monthly `srad` (WorldClim only) | `unit_Irradiance_kWh-per-m2` exists (the Atlas unit); `srad` itself is in `unit_Irradiance_kJ-per-m2-per-day` |
| precipitation seasonality, Atlas definition | (P_wettest − P_driest) / P_wettest, dimensionless | monthly `pr` | — |

They will be proposed with references (European Atlas of Forest Tree Species, de Rigo et al. 2016;
EU-Trees4F, Mauri et al. 2022; `envirem`, Title & Bemmels 2018) when the pair set is final.

## Status — done in `metadata-store`, 2026-10-30

All of §A and §B applied to `data/EUFGIS/env/terms.properties.json` (23 changed lines, 14 terms), plus two items from §C that the ontology could answer:

- `env_climate_bio03` now carries `unit_Percent_pct` rather than `unit_Dimensionless_1`: the ontology has a percent unit with a physical bound of 0–100, and BIO2 ≤ BIO7 by construction, so BIO3 never exceeds 100.
- `env_climate_gdd0` / `gdd5` / `gdd10` now carry `unit_DegreeDays_deg-C-day`, which exists and which their own `_description` already named (°C·day). CHELSA's table labels the layers "°C"; the dictionary states the dimension of the heat sum.
- `env_climate_bio05`'s definition was rewritten symmetrically to BIO6 ("The highest of the twelve monthly mean daily maximum air temperatures."), beyond the typo the note asked for.
- `env_climate_pr` left as is: its description already carries the 1 kg m⁻² = 1 mm sentence.

Verified on localhost: `loader --clear` 32,919 documents; validator sweep 32,864 / 0 errors; 14 term cards regenerated; the served terms read back corrected. Committed and pushed in `metadata-store` (`2098d97`); the laptop and the work server both reloaded on 2026-10-30, so `/ui/term/<gid>` serves the corrected terms on both. §D is noted for when the pair set is final.
