# Handoff to `metadata-store`: the units' shared terms, a search-box label, the panes' hints

**Date:** 2026-11-10. **From:** the `indicator-pair-scatterplots` session. **For:** the `metadata-store` session,
on Milko's request. Same conventions as the handoff of 2026-11-09
([`2026-11-09-handoff-metadata-store-ui-terms.md`](2026-11-09-handoff-metadata-store-ui-terms.md)): `_title` is
the label, `_definition` the hover text, `_description` the in-depth Markdown; sources under `data/ui/`; the manual
page `using/map-and-scatterplot`; docs regenerated.

## A. Why

Milko's review of the panes on 2026-11-10 settled **the three roles of a unit**: the species and the country are
*filters*; `gcu_id_number` is *the chosen unit*, highlighted on both panes and never a filter; and *the selection*
is the set the user builds by option-click, drawn with a ring on both panes. Milko then asked for the Selection
group (count, units-shown mode, clear) to be **shared**, in the host's bar, with the mode acting on the map and on
the scatterplot alike. Two state terms were created on 2026-11-09 under the scatterplot — `ui_layout_scatterplot_units_mode`
and `ui_layout_scatterplot_units_selection` — and their definitions say "in the scatterplot". Their scope is now the
whole page, so they move to a namespace of their own, `ui_layout_units`, and their texts say so. Two smaller items
ride along: the search box of the shared bar needs a label (its caption reuses the "Unit" term today, which misleads
since the box finds species, countries and units), and the hints must name the new gestures.

Nothing changes in the data: the `_data` sections, the enumeration values (`_aid`) and the roles stay; the
scatterplot's own units layer (`ui_layout_scatterplot_units`, `_opacity`) stays where it is.

## B. The move: five terms, one new namespace

### B1. New namespace

| gid | nid | lid | role |
|---|---|---|---|
| `ui_layout_units` | `ui_layout` | `units` | `_term_role_namespace` |

- `_title`: Units
- `_definition`: What both panes do with the conservation units: which are drawn and which are selected.
- `_description`: Settings about the gene conservation units that the map and the scatterplot share: the
  units-shown mode ([`ui_layout_units_mode`](ui_layout_units_mode.md)) and the selected set
  ([`ui_layout_units_selection`](ui_layout_units_selection.md)). The scatterplot's own units layer — its opacity —
  stays under [`ui_layout_scatterplot_units`](ui_layout_scatterplot_units.md); the one unit to highlight is
  [`gcu_id_number`](gcu_id_number.md), a highlight on both panes and never a filter.

### B2. Renamed terms (old gid → new gid; nid `ui_layout_units`, lid and `_aid` unchanged)

| old gid | new gid | lid | `_aid` |
|---|---|---|---|
| `ui_layout_scatterplot_units_mode` | `ui_layout_units_mode` | `mode` | `mode` |
| `ui_layout_scatterplot_units_all` | `ui_layout_units_all` | `all` | `all` |
| `ui_layout_scatterplot_units_only` | `ui_layout_units_only` | `only` | `only` |
| `ui_layout_scatterplot_units_hide` | `ui_layout_units_hide` | `hide` | `hide` |
| `ui_layout_scatterplot_units_selection` | `ui_layout_units_selection` | `selection` | `selection` |

`ui_layout_units_mode` keeps `_data` `{_scalar: {_enum: {_enums: ["ui_layout_units_mode"]}}}` and the roles
descriptor / enum-root / enum-source; the three elements keep the role enum-item; `ui_layout_units_selection`
keeps `_data` `{_array: {_scalar: {_string: {_regexp: "^[A-Z]{3}[0-9]{4,5}$"}}}}` and the role descriptor.

**Edges** (`data/ui/edges.enumerations.json`): the three `_predicate_enum-of` edges now run from
`terms/ui_layout_units_all | _only | _hide` to `terms/ui_layout_units_mode`, `_path` `["terms/ui_layout_units_mode"]`;
the old edges go.

### B3. New texts

| gid | `_title` | `_definition` |
|---|---|---|
| `ui_layout_units_mode` | Units shown | Which units both panes draw: all, only the selection, or all but the selection. |
| `ui_layout_units_all` | All units | Every unit of the species is drawn on both panes; selected ones are ringed. |
| `ui_layout_units_only` | Only the selection | Only the selected units are drawn, on the map and on the scatterplot. |
| `ui_layout_units_hide` | Hide the selection | Every unit except the selected ones, on the map and on the scatterplot. |
| `ui_layout_units_selection` | Selected units | The unit numbers the user has selected, on either pane. |

`_description` of `ui_layout_units_mode`: The user builds a selection of units
([`ui_layout_units_selection`](ui_layout_units_selection.md)) by option-clicking them on the map or on the
scatterplot; this mode shows all units, the selection alone, or hides the selection — on both panes at once, from
the Selection group of the shared bar. Default [`ui_layout_units_all`](ui_layout_units_all.md).

`_description` of `ui_layout_units_selection`: Built by option-clicking units on the map or on the scatterplot,
drawn with a black ring on both, cleared by the clear button of the shared bar. Carried in a shared view so that a
colleague opens the panes with the same units ringed. Each element is a unit number
([`gcu_id_number`](gcu_id_number.md)); how the selection is drawn is [`ui_layout_units_mode`](ui_layout_units_mode.md).

### B4. Texts to touch elsewhere

- `ui_layout_scatterplot_units` (namespace), `_description`: drop the closing ", with the selection and its display
  mode" — it reads: "The top layer: the gene conservation units of the selected species at the climate of their
  reference point ([`gcu_loc_climate`](gcu_loc_climate.md))." (The selection is page-wide now.)
- `ui_layout_state`: the two keys in `_fields` / the recommended list become `ui_layout_units_mode` and
  `ui_layout_units_selection`; the constant default becomes `{_field: "ui_layout_units_mode", _compute_value:
  "ui_layout_units_all"}`; `_description` unchanged (it names `ui_layout` as a whole).
- `ui_layout_scatterplot_label_selection` ("Selection"): no longer used by the pages — the shared group's caption
  is the title of `ui_layout_units_selection` ("Selected units"), so that the label names the units (Milko).
  Remove it, or keep it; the pages do not read it.
- Manual page `using/map-and-scatterplot`, two passages:
  - in **The shared selectors**, after "one unit to highlight ([`gcu_id_number`](gcu_id_number.md))", add: ", the
    selected units and which units both panes draw ([`ui_layout_units_selection`](ui_layout_units_selection.md),
    [`ui_layout_units_mode`](ui_layout_units_mode.md): all, only the selection, or all but the selection)";
  - in **The scatterplot**, the units layer sentence becomes: "and the units ([`ui_layout_scatterplot_units_opacity`](ui_layout_scatterplot_units_opacity.md);
    which units are drawn and the selection itself are shared with the map, see above)".
- Docs: the five `docs/ui_layout_scatterplot_units_{mode,all,only,hide,selection}.md` go, the six new ones come.

## C. A label for the search box

The shared bar's search box finds a species, a country or a unit. Its caption reuses `ui_layout_label_unit`
("Unit"), which misleads. One new label term under `ui_layout_label` (`_info` only, no `_data`, no role, as the
other labels):

| gid | `_title` | `_definition` |
|---|---|---|
| `ui_layout_label_search` | Search | Find a species, a country or a unit: type a name, a country name or code, or a unit number; each suggestion says what it is. |

If "Find" reads better than "Search" as the caption, change the title only; the pages read it.

## D. The hints

The gestures settled on 2026-11-10 (a plain click on a unit chooses it on both panes; option-click toggles it
in the selection; Escape or a click on empty plot space releases the chosen unit) are not in the hints yet, and
the map has no hints term, so its legend row has no "?" mark.

- `ui_layout_scatterplot_label_hints`, `_title` becomes: drag = zoom to box · wheel = zoom · shift-drag = pan ·
  double-click = reset · click a unit = choose it on both panes · option-click a unit = add to / remove from the
  selection · click empty space or Escape = release the chosen unit
  (`_definition` unchanged: The pane's interaction hints.)
- new `ui_layout_map_label_hints` (nid `ui_layout_map_label`, lid `hints`, `_info` only): `_title`: drag = pan ·
  wheel = zoom · click = read the climate at that place · click a unit = choose it on both panes · option-click a
  unit = add to / remove from the selection · Escape = release the chosen unit · Draw = a point, a box or a polygon
  sent to the scatterplot; `_definition`: The pane's interaction hints.

The " · " is the separator the panes split on to show one gesture per line.

## E. After the terms exist (this repository)

The pages read every gid from one table each (`K` / `OPT` and the `data-term` / `data-key` attributes in
`examples/linked.html`, `scatter-d3-canvas.html`, `map-openlayers.html`): the five renamed gids are replaced there,
the search box's caption switches to `ui_layout_label_search`, the map's legend row gets its "?" mark from
`ui_layout_map_label_hints`. The pages must not switch before the terms are loaded on the laptop and the work
server, since the dictionary service answers nothing for an unknown gid. No data is affected.
