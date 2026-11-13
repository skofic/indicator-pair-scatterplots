# Handoff to `metadata-store` — the species envelope no longer follows the climate (2026-11-13)

**Decision (Milko, 2026-11-13).** The species envelope is the border of the climate the species lives in
today (the realised niche). It does not travel with the climate: a forest does not adapt because its
climate moves. In a future period the scatterplot therefore draws **one** envelope, the reference period's,
solid; the units and the map selection move towards and beyond it. This amends the decision of 2026-11-09,
under which a second, solid envelope was drawn at the selected period and the present one became dashed.

The page (`examples/scatter-d3-canvas.html`) is changed and published. Three texts in the dictionary still
describe the old drawing. Proposed wording below; the final wording is yours and Milko's.

| Term | Field | Now | Proposed |
|---|---|---|---|
| `ui_layout_scatterplot_species_envelope` | `_description` | "… In a future period two contours are drawn: the present one dashed, the selected period's solid, so the shift of the species' climate space is read at a glance. Default true." | "A smooth closed contour around the densest 95 % of the species cloud (a blurred density cut at the level holding 95 % of the mass). It is always the contour of the reference period: the border of the climate the species lives in today does not move with the climate, so in a future period the units are read against it. Default true." |
| `ui_layout_scatterplot_label_envelope-present` | `_definition` | "The 95 % contour of the species at the reference period (dashed)." | "The 95 % contour of the species at the reference period." |
| `ui_layout_scatterplot_label_envelope-future` | whole term | "selected-period envelope … (solid)" | No longer used by the page. Retire it, or keep it unused: your choice. The page does not load it once it is gone (see below) |

Also to check on your side: the manual page `using/map-and-scatterplot`, if it describes two envelopes.

**After you change them:** tell this session whether `ui_layout_scatterplot_label_envelope-future` was
retired, so the page drops it from the list of terms it loads (`LBL.envFuture`). Both servers hold the
dictionary: the laptop and the showcase host (`panes.skofic.io`, reloaded with `deploy/import-on-server.sh`
or by loading the changed terms there).
