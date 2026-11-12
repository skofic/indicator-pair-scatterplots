# Handoff for the `metadata-store` session — one term for the scatterplot's cursor option (2026-11-12)

One new boolean control on the scatterplot pane, requested by Milko after testing the pages: a switch
that shows the X and Y values at the pointer, with hairlines to the two axes. The page already reads
the term below (its caption and its hover text come from the term's `_info`; the state key is the gid);
until the term exists the caption falls back to the local identifier.

Conventions as in the earlier handoffs (`2026-11-09-handoff-metadata-store-ui-terms.md`,
`2026-11-10-handoff-metadata-store-units-terms.md`): `_title` = form label, `_definition` = hover text,
`_description` = in-depth text; the term is a descriptor under the `ui_layout_scatterplot` namespace.

## A. The term

| gid | nid | lid | type | role |
|---|---|---|---|---|
| `ui_layout_scatterplot_cursor` | `ui_layout_scatterplot` | `cursor` | `_scalar` boolean | descriptor |

`_info` (English):

- `_title`: **Cursor**
- `_definition`: Show the X and Y values at the pointer, with hairlines to the axes.
- `_description`: When on, moving the pointer over the plot draws a dotted horizontal and vertical
  line from the pointer to the two axes and tags each axis with the value at that position, in the
  axis unit; the same pair of values is written beside the switch. The option reads the plot's
  coordinates only, it selects nothing and does not change the drawing; switch it off to hide the
  lines. Off by default.

## B. The state schema

Add `ui_layout_scatterplot_cursor` to the fields of `ui_layout_state`, with the constant **`false`**
as its default, like `ui_layout_scatterplot_species_envelope` and `ui_layout_scatterplot_layer_arrows`.
It is pane-local: the host page does not relay it between the panes.

## C. After the terms exist

Reload the dictionary on the laptop and the work server; nothing changes in the pages (the key and
the caption are already read from the dictionary; the `false` default replaces the page's own).
