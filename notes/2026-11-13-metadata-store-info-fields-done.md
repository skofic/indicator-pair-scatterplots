# Reply from `metadata-store`: the form fields and the `_info` content are loaded (2026-11-13)

Answers the handoff `2026-11-13-handoff-metadata-store-info-fields.md`, §B.4. Commits: `metadata-store` `0961991` (terms, manual, records), `metadata-store-validator` v1.8.1 `65b6487`, `metadata-store-service` `b5fced7` (figures only, not deployed), `metadata-store-interface` `dc65def` (a badge). The laptop is reloaded (33,191 documents, 16,340 terms); the showcase copy follows with `ONLY=metadata node deploy/slim.mjs export` and the import, at Milko's word. The work server is set aside since 2026-11-13.

## Part A — form fields: a role after all, and the sentence

Milko reversed the "no new role" decision in the `metadata-store` session the same day. The dictionary now has **`_term_role_control`**, a hand-set marker role: the term is a control of a user-interface form, so its `_info` reads as the description of a control — `_uses` what the user does with it, `_methods` how the drawing or value it governs is produced, `_issues` what to keep in mind when reading the result. It marks the term's nature, not its placement (which properties a form presents stays the business of `ui_layout_state._fields`), so it sits on exactly the **36 terms** of Part A and on none of the others: not the four gesture-set properties, not `ui_layout_state`, not the six data descriptors shown as selectors. It is preserved by `assign-roles` and by the validator's term-role rule (hence v1.8.1), shows as a green *Control* badge on the term page, and is a search facet (`_term_role_control` = 36).

**The sentence chosen**, closing each `_description`:

| Kind in the handoff | Sentence |
|---|---|
| selector | A form field, set with a selector. |
| selector of a number | A form field, set with a selector of a number. |
| slider, 0 to 100 | A form field, set with a slider from 0 to 100. |
| slider, 2 to 10 | A form field, set with a slider from 2 to 10. |
| check box | A form field, set with a check box. |

The four gesture-set properties close with "Not a form field: set by drawing a point, box or polygon on the map." / "… set by panning and zooming the map." / "… set by zooming the scatterplot." / "… set by option-click on units of either pane."

## Part B — the rows

All rows named in B.1 are loaded with the §B.2 amendments (M1, I5, R10, I8, the two period descriptions, M2, R6, the stale `_base_position` description). Rows reworded enough to note:

- **I5** adds a pointer to the species layer: "(see the species layer, `ui_layout_scatterplot_species`)" as a term link.
- **R1** is the Mauri 2022 citation (the string already on the EU-Trees4F records) followed by "The classes as the paper's Figure 1 draws them."; **R2** carries de Rigo 2016 followed by "The autoecology diagrams of the Atlas are the model of the three layers." and Mauri 2017; **R3** de Rigo 2016 with the Atlas `_url`; **R4** Caudullo 2017; **R5** Mauri 2022 — citation strings taken verbatim from `sources/datasets/records.js` and the GeoService records.
- **R6**: the Esri item was opened through the ArcGIS REST endpoint and is *World Hillshade*; its citation reads "World Hillshade: Esri, USGS, NOAA." followed by Esri's own source list ("Sources: Esri, Vantor, Airbus DS, USGS, NGA, NASA, CGIAR, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen, Rijkswaterstaat, GSA, Geoland, FEMA, Intermap, and the GIS user community"), the `_url` kept. The other four as proposed, the `_url`s as Markdown links.
- **M4**: `ui_layout_scatterplot_view_classes_bin`'s description now opens "The step, in temperature × precipitation, of the bins the class arrows are averaged over." and keeps the rest; the procedure is its `_methods`.
- **M6**: `gcu_loc_climate_distance`'s description now opens "The distance between a unit's climate reference point (`gcu_loc_climate`) and the unit's polygon."; the EPSG:3035 measurement is its `_methods`; the dated counts are its `_notes`, marked as superseded by each refresh.
- **§7 notes**: `_base_position` — "Decided 2026-11-09: the species layer stays at the present climate. Amended 2026-11-13: the species envelope is the reference period's and does not move with the period either."; `env_climate_srad_spring-summer` — "Decision of 2026-10-30: substitute the quantity, actual surface radiation from the climate grids, rather than recompute the Atlas's potential irradiation."
- **E1–E6** are `_examples` on `ui_layout_state`: each a Markdown text with a bold title line and a fenced `json` block holding the partial state, so the panes can parse the fence into a link.
- The dataset-record rows (I12–I14, M7, M8, R7–R9) were not touched here.

## Verified

`assign-roles` kept the 36 roles (0 other corrections); sweep 33,135 / 0 errors (every new `_references`, `_examples`, `_notes` validates); validator role parity 16,340 terms / 0 differences; `POST /ui/validate/document` with `compute: true` keeps the role; `GET /ui/term/ui_layout_state` serves the six examples; `GET /ui/term/ui_layout_map_layer_base_hillshade` the Esri citation; the manual page `using/map-and-scatterplot` describes the five texts and the role. Service suite 156/156.
