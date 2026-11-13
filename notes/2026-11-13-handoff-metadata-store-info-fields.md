# Handoff to `metadata-store`: the `_info` fields of the panes' terms, and which terms are form fields (2026-11-13)

From the `indicator-pair-scatterplots` session, carried by Milko. Two requests:

- **Part A**: mark the terms that are **form fields** (a new `_term_role` element, Milko's decision of
  2026-11-13) and say so in their `_description`.
- **Part B**: fill `_uses`, `_methods`, `_issues`, `_references` and `_notes` on the panes' terms, and
  `_examples` on `ui_layout_state`, from the content census reviewed by Milko the same day.

The texts of Part B are in [`2026-11-13-info-content-census.md`](2026-11-13-info-content-census.md), same
folder (absolute path
`/Users/milko/Local/Development/Git/Projects/Metadata/indicator-pair-scatterplots/notes/2026-11-13-info-content-census.md`).
They are proposals in English: the final wording, the links between terms and the Markdown conventions are
yours and Milko's. Nothing here was written into the dictionary by this session.

---

## Part A. Form fields

### A.1 What Milko decided

Until now the dictionary described data: descriptors and their values. The panes' terms are the first that
describe **controls of a user interface form**. Milko will add a `_term_role` element for a term that
stands for a form field (the name is his and yours; your `CLAUDE.md` already records a deferred
`_term_role_layout`, which may or may not be the same thing). The role is **set by hand**. It matters
because the `_info` fields read differently on a form field than on a data descriptor: `_uses` is "what the
user does with the control", `_issues` is "what to keep in mind when reading the result".

Two things are asked for each form field:

1. the new role in `_domn._term_role`;
2. a statement in `_description` that the term is a form field, with the kind of control (table below). The
   place and the exact sentence are yours; a closing sentence such as "Form field: check box." would do.

### A.2 The form fields in the `ui_layout` family (34 terms)

All of them have a `_data` section and are properties of `ui_layout_state`. "Kind" is the control the panes
use today.

| Term | Kind of control |
|---|---|
| `ui_layout_mode` | selector (one of its three options) |
| `ui_layout_map_placement` | selector |
| `ui_layout_scatterplot_X` | selector (a descriptor of the chosen source) |
| `ui_layout_scatterplot_Y` | selector (a descriptor of the chosen source) |
| `ui_layout_scatterplot_view` | selector |
| `ui_layout_scatterplot_view_classes_variant` | selector (present on both panes) |
| `ui_layout_scatterplot_view_classes_position` | selector |
| `ui_layout_scatterplot_view_classes_bin` | selector |
| `ui_layout_scatterplot_view_classes_bin_min` | selector of a number |
| `ui_layout_scatterplot_base_mode` | selector |
| `ui_layout_scatterplot_base_opacity` | slider, 0 to 100 |
| `ui_layout_scatterplot_base_position` | selector |
| `ui_layout_scatterplot_species_mode` | selector |
| `ui_layout_scatterplot_species_opacity` | slider, 0 to 100 |
| `ui_layout_scatterplot_species_envelope` | check box |
| `ui_layout_scatterplot_units_opacity` | slider, 0 to 100 |
| `ui_layout_scatterplot_layer_radius` | slider, 2 to 10 |
| `ui_layout_scatterplot_layer_arrows` | check box |
| `ui_layout_scatterplot_cursor` | check box |
| `ui_layout_units_mode` | selector |
| `ui_layout_map_layer_base` | selector |
| `ui_layout_map_draw-mode` | selector |
| `ui_layout_map_layer_rpp`, `_mhs`, `_t4-current`, `_t4-future`, `_chorology`, `_units` (6) | check box |
| `ui_layout_map_layer_rpp_opacity`, `_mhs_opacity`, `_t4-current_opacity`, `_t4-future_opacity`, `_chorology_opacity`, `_units_opacity` (6) | slider, 0 to 100 |

### A.3 State properties that are not form fields (Milko to confirm)

They have a `_data` section and belong to `ui_layout_state`, but the user sets them by a gesture on the
pane, not through a control. Our proposal: no form-field role; their `_description` may say "set by a
gesture on the pane".

| Term | How it is set |
|---|---|
| `ui_layout_map_selection` | drawing a point, box or polygon on the map |
| `ui_layout_map_view` | panning and zooming the map |
| `ui_layout_scatterplot_zoom` | zooming the scatterplot |
| `ui_layout_units_selection` | option-click on units of either pane |

Also not fields: `ui_layout_state` (the form as a whole: the object the fields belong to) and
`ui_layout_scatterplot_view_classes_legend` (a data value per cell, shown as the legend).

### A.4 Data descriptors that the panes show as form fields (Milko to decide)

These eight are properties of `ui_layout_state` too, each shown as a selector, but they are terms of the
data, not of the layout.

| Term | Our reading |
|---|---|
| `gcu_loc_coordinates-restriction_level` | exists only as a setting of the panes: a form field |
| `gcu_loc_climate_flag` | a threshold chosen by the user: a form field |
| `species`, `gcu_id_country`, `gcu_id_number`, `std_dataset_ids`, `env_climate_scenario`, `env_climate_period` | data descriptors first; that the panes offer them as selectors is already said by their place in `ui_layout_state._fields`. A role on the term would say "this is a form field" of a property that lives in millions of records |

### A.5 The other `ui_layout` terms (no form-field role)

- **Options** of the selectors: the enumeration elements (`…_mode_auto`, `…_draw-mode_box`,
  `…_base_position_future`, `…_legend_0` and so on). They already carry the enum-item role.
- **Labels and fixed texts**: everything under `ui_layout_label`, `ui_layout_map_label`,
  `ui_layout_scatterplot_label` (33 terms): legend entries, hints, button texts. If Milko wants a role for
  these as well, they are exactly the children of those three namespaces.
- **Groups**: `ui_layout`, `ui_layout_map`, `ui_layout_scatterplot`, `ui_layout_units`, and the layer groups
  `ui_layout_map_layer`, `ui_layout_scatterplot_layer`, `ui_layout_scatterplot_base`, `_species`, `_units`,
  `ui_layout_scatterplot_view_classes`. They title a group of controls; no value.

---

## Part B. The `_info` fields

Milko reviewed the census on 2026-11-13: the rows stand as written, with the changes listed in B.2. Take
each row of the census's sections 2, 3, 4, 6 and 7 **that names a term** (rows naming a dataset record,
I12 to I14, M7, M8, R7 to R9, are loaded by this repository, not by you).

### B.1 Rows for you, by section of the census

| Section | Field | Rows |
|---|---|---|
| §2 | `_issues` | I1 to I11 |
| §3 | `_uses` | U1 to U14 (U8 on both `ui_layout_scatterplot_X` and `_Y`; U14 on both EU-Trees4F map layers) |
| §4 | `_methods` | M1 to M6 |
| §5 | `_examples` on `ui_layout_state` | E1 to E6, each a title and a partial state; all six validated through the service on 2026-11-13. Milko accepted the species and places; the scientists may propose others later |
| §6 | `_references` | R1 to R6, and R10 below |
| §7 | `_notes` | the three rows; each moves a dated remark out of `_description` or `_issues` |

### B.2 Changes since the census was drafted

**The species envelope is a statistical measure and must say which** (Milko's question, 2026-11-13). It is
the 95 % highest-density region of the species' cells; no normal distribution is assumed. For
`ui_layout_scatterplot_species_envelope`:

- `_methods` (replaces M1): "The envelope is the **95 % highest-density region** of the species' cells in
  the plane of the two indicators (Hyndman 1996): the smallest area of the plot that holds 95 % of the
  cells. The cells are counted on a grid of 2 × 2 pixels of the unzoomed plot, the counts are smoothed
  (three passes of a moving average eleven grid steps wide, close to a Gaussian kernel), and the contour is
  drawn at the density above which 95 % of the smoothed counts lie. No distribution is assumed. For a cloud
  that followed a bivariate normal distribution the line would coincide with the 95 % ellipse; a species'
  climate is usually skewed and often has several lobes, which the contour follows and an ellipse would
  not. Computed in the browser at the reference period, for the chosen pair of indicators; it does not
  change with the zoom."
- `_issues` (I5, with one sentence added): "The envelope describes the climate of the **recorded**
  occurrences (see the species layer), every surveyed cell counting once: regions surveyed more densely
  weigh more. 95 % is a convention, not a tolerance threshold, and the smoothing carries the line slightly
  beyond the outermost cells. A unit outside it is outside the climate where the species was found in the
  inventories; that is a signal to look closer, not a prediction that the population will fail."
- `_references` (new row R10): `_citation`: Hyndman, R.J. (1996). Computing and graphing highest density
  regions. *The American Statistician* 50(2):120–126. doi:
  [10.1080/00031305.1996.10474359](https://doi.org/10.1080/00031305.1996.10474359).
- `_description`: "the densest 95 % of the species cloud (a blurred density cut at the level holding 95 % of
  the mass)" may become "the 95 % highest-density region of the species cloud"; the detail is now in
  `_methods`.

**M2, checked against the code.** For `ui_layout_scatterplot_base_hex` and `ui_layout_scatterplot_species_hex`:
"Cells are counted in hexagons of the chosen radius, in pixels of the screen, so zooming in refines them.
The shade follows the logarithm of the count, from one cell to the densest hexagon in view: the same shade
is a different count after a zoom."

**R6, the base maps.** The attribution each layer shows on the map today, as `_references._citation`, with
the provider's page as `_url`:

| Term | `_citation` | `_url` |
|---|---|---|
| `ui_layout_map_layer_base_boundary` | Made with Natural Earth (public domain; no attribution required) | https://www.naturalearthdata.com/about/terms-of-use/ |
| `ui_layout_map_layer_base_osm`, `_gray` | © OpenStreetMap contributors (Open Database License) | https://www.openstreetmap.org/copyright |
| `ui_layout_map_layer_base_topo` | © OpenStreetMap contributors, SRTM; map style © OpenTopoMap (CC-BY-SA) | https://opentopomap.org/about |
| `ui_layout_map_layer_base_hillshade` | Esri, USGS, NOAA (World Hillshade) | https://www.arcgis.com/home/item.html?id=1b243539f4514b6ba35e7d995890db1d |

The Esri line is what the pane displays; the list of contributors on Esri's own page is longer and was not
checked today. The item address is from memory: please open it before storing it, and drop the `_url` if it
does not lead to the World Hillshade layer.

**A stale description, missed in this morning's handoff.** `ui_layout_scatterplot_base_position` still says
"the units, the map-selected cells and the solid envelope are what the future period moves". Since the
decision of 2026-11-13 the envelope does not move. Proposed: "… and never moves with the period, and neither
does its envelope: the units and the map-selected cells are what the future period moves." The "(decided
2026-11-09)" goes to `_notes` with the amendment of 2026-11-13 (census §7).

### B.3 What this session does after you

Reload the dictionary on the laptop and copy it to the showcase server (`ONLY=metadata`), then build step 3:
the panes show `_uses` and `_methods` in the "i" popover, a warning mark where a term has `_issues`, the
examples as links, and "more" links to the term pages of `dictionary.skofic.io`. Nothing in the panes
depends on the new role.

### B.4 Please report back

The commit, the name of the new role and the terms that received it, the decision on A.3 and A.4, and any
row you reworded enough to change its meaning.
