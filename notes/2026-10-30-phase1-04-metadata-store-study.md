# Phase 1, item 4 — `metadata-store`, the data dictionary

Date: 2026-10-30. Status: **complete; decisions confirmed by Milko the same day** (see the decisions log in `CLAUDE.md`: a species table of our own keyed by scientific name for now, UPOV codes to be adopted ecosystem-wide soon; Milko updates the dictionary himself). **Phase 1 closed.**

Question from the brief: study the repository holding the metadata and standards used in all project
databases. Sources read: `metadata-store` (`CLAUDE.md`, `README.md`, `docs/reference/DictionaryReference.md`
outline, `data/EUFGIS/{env,std,gcu}/terms.properties.json`, `data/unit/*`), plus how the sibling
repositories consume it. No database access.

---

## 1. What the dictionary is, in the terms that matter to us

A self-describing data dictionary in ArangoDB (database `metadata`, collections `terms`, `edges`,
`links`, `blobs`; ≈ 16 000 terms). Source of truth = the JSON files under `data/`, loaded by a
workflow; per-term Markdown cards and a reference manual are generated from them, never hand-edited.
Served by the Foxx API `/ui` (`metadata-store-service`) and the browser UI `/web`
(`metadata-store-interface`); validated by the external package `metadata-store-validator`, which the
ingestion repository calls through `lib/dictionary.js` and which `/validate/document` exposes.

**Rule that binds every database in the ecosystem: every property name in a data document is a term
GID.** A term record has four sections:

| Section | Content | Example (`env_climate_bio12`) |
|---|---|---|
| `_code` | identifiers: `_nid` namespace, `_lid` local id, `_gid` = nid_lid, `_aid` aliases, `_pid` provider ids | `env_climate` / `bio12` / `env_climate_bio12` / `["bio12"]` / `["bio12"]` |
| `_info` | `_title`, `_definition`, `_description` (markdown), `_examples`, `_references` (`_citation`, `_url`), `_issues`, all keyed by `ISO_639_3_eng` | "Annual precipitation amount" |
| `_data` | the type as key: `_scalar._number_float` with `_decimals` (display hint only) and `_unit` (a `unit_*` term), `_range_valid` (enforced), `_range_normal` (warning) | `{_scalar:{_number_float:{_decimals:2,_unit:"unit_Length_mm"}}}` |
| `_domn` | classification: `_class` (quantity / category), `_domain`, `_subject`, `_term_role` (descriptor, …) | `_class_quantity`, `chr_envi`, `chr_subject_stand`, `_term_role_descriptor` |

Units are terms too (`unit_<QuantityKind>_<symbol>`, e.g. `unit_Temperature_deg-C`, `unit_Length_mm`,
`unit_Irradiance_kWh-per-m2`, `unit_Dimensionless_1`), with a conversion edge graph. Enumerations are
graphs of edges under a root (e.g. `env_climate_kg*`, the dataset scope / extent vocabularies).

## 2. The parts our project will use

**Climate descriptors.** All WorldClim 2.1 and CHELSA 2.1 variables loaded in GeoService have terms
(`env_climate_bio01…19`, `env_climate_{tas,tasmin,tasmax,pr,srad,vapr,wind}`, the CHELSA extras
`ai`, `cmi_*`, `gdd*`, `gsl`, `pet_penman_*`, `rsds_*`, `vpd_*`, …), with rich descriptions added in
July 2026. **None of our derived axes has a term yet** (summer / winter means, continentality, coldest-
month mean temperature, spring-summer radiation sum, the Atlas seasonality); see the heads-up in
[`notes/2026-10-30-handoff-metadata-store-climate-terms.md`](2026-10-30-handoff-metadata-store-climate-terms.md) §D.
Errors found in existing climate terms are in §A–B of that document, written for the `metadata-store`
Claude as Milko asked.

**Dataset records.** `std_dataset` is the schema of a dataset catalogue record (its `_description` is
the manual): top-level `std_dataset_code` (immutable), `std_date_submission`, `std_date_start/end`,
`count`, `_info` (title, description, references, issues), `std_dataset_domn` (`std_dataset_extent` ∈
{region, gcu, shape}, `std_dataset_scope` ∈ {grid, shape}, optional `_tag`), `std_dataset_prop`
(`_collection_list`, `std_terms` = the indicators the data carries, `std_terms_key` = the descriptors
that identify a record, `std_terms_summary`), `_custom`, `_private`. Every data document carries the
dataset `_key` in `std_dataset_ids`. **Open at the source:** three registries exist with two shapes
(`metadata.dataset` 29 records, `GeoService.Dataset` 24, `EUFGIS.dataset` 10 old flat shape); the
normalisation of `GeoService.Dataset` (`_domn` → `std_dataset_domn`, `_prop` → `std_dataset_prop`) is
the metadata-store owner's **next** task; the `/dataset` service is deferred. Our records must be
written in the target shape from the start.

**Structural terms we will reuse as-is:** `geometry_hash`, `geometry_point`, `geometry_bounds`,
`std_dataset_ids`, `std_terms`, `std_date`, `std_date_span`, `std_date_span_month`, `std_month`,
`gcu_id_number`, `species`.

**Species.** The dictionary holds no species vocabulary: `gcu_pop_species` ("Target species") is a
`_handle` into a **`taxa` collection of the EUFGIS database** (e.g. `taxa/fd7c02…`), while GeoService
`Units.species_list` carries plain Latin names ("Quercus robur"). EU-Forest names were resolved with
TNRS. So species matching between EU-Forest, EU-Trees4F, the Atlas and the units is by **Latin
binomial**, and the `taxa` collection is the authority to reconcile against (subspecies, synonyms).

## 3. Conventions we inherit

- Store values at full precision; `_decimals` is display only. `_range_valid` is enforced by the
  validator; `_range_normal` warns.
- Validate every document we write against the dictionary (`metadata-store-validator`, as the
  ingestion repo does) before loading; validate geometry with `geojson-s2`.
- New terms are proposed with title, definition, description, references, unit and ranges, in the
  JSON under `data/EUFGIS/env/`, by the `metadata-store` owner; cards and manual regenerate.
- ArangoDB stays on 3.12.4 (owner's decision; no upgrade proposals).

## 4. What this closes in Phase 1

With items 1–4 done, the three questions of the brief are answered (see
[`notes/2026-10-30-phase1-02-eu-trees4f-study.md`](2026-10-30-phase1-02-eu-trees4f-study.md) §7):
WorldClim 1.4 is replaceable for the scatterplots by a grid change; a system fed with environmental
data generates the scatterplots, while the maps are served from published rasters; EU-Trees4F data
is used for the maps and for the first scatterplot run. Phase 2, the Data Plan, can start.

## 5. Decisions (confirmed 2026-10-30)

1. Our collections follow the dictionary: property names are term GIDs, documents validated with
   `metadata-store-validator` before load, dataset records in the `std_dataset` target shape with
   `std_dataset_ids` on every data document.
2. Derived indicator terms are **requested, not improvised**: the Data Plan fixes the pair set, then
   the terms in the handoff §D are proposed to `metadata-store` with references and units. Until
   then, prototypes may compute them but nothing is loaded under an undefined GID.
3. **A species table of our own** (Milko's refinement): for now its unique identifier is the scientific
   name; **UPOV codes will be adopted soon across all repositories**, so the table must be able to take
   a UPOV code as the key later without re-keying the data. The Data Plan includes a species coverage
   table (EU-Forest 242 × Atlas × EU-Trees4F 67 × unit target species).
4. The handoff document is delivered to the `metadata-store` session by Milko, who commits any
   dictionary change there.
