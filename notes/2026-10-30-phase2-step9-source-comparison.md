# Phase 2, step 9 — the three-source comparison of the scatterplot

Date: 2026-10-30. Status: **done; the recommendation in section 3 was adopted by Milko the same day.**

Question (decision of 2026-10-29): is the switch from the EU-Trees4F 5′ layers to the 1 km WorldClim 2.1
and CHELSA 2.1 grids worth it, i.e. does the same pair from the three sources show a visible difference?

## 1. What was compared

Pair P1, annual mean temperature × annual precipitation, for six species, drawn as the Atlas autoecology
diagram (grey = all 250 569 EU-Forest cells, blue = the species' cells) once per source, from the work
files of steps 3–5 (`sources/compare/compare_sources.py`). Panels: [`compare/`](compare/) (one PNG per
species), table: [`compare/summary_bio01_bio12.md`](compare/summary_bio01_bio12.md).

| Source | Grid | Baseline | Base cells with a value |
|---|---|---|---|
| EU-Trees4F predictors (WorldClim 1.4) | 5′ ≈ 10 km | 1961–1990 | 250 535 |
| WorldClim 2.1 (GeoService) | 30″ ≈ 1 km | 1970–2000 | 247 881 |
| CHELSA 2.1 (GeoService) | 30″ ≈ 1 km | 1981–2010 | 248 836 |

## 2. What it shows

**The difference is visible, and it is resolution before it is baseline.**

- At 10 km the grey envelope is flattened and the species cloud is a compact band: every 1 km occurrence
  cell inherits the climate of its 10 km surroundings, so mountain and coastal variability disappears
  (annual precipitation tops out near 2 800 mm; beech at 597–1 262 mm for 90 % of its cells).
- At 1 km both grids restore the Atlas-like shape (the grey mountain-precipitation plume up to 3 500–
  5 000 mm) and the species clouds widen: beech 590–1 393 mm (WorldClim 2.1), 658–1 862 mm (CHELSA).
  **The WorldClim 2.1 panel is the one that looks like the Atlas diagrams**, which were built on
  WorldClim 1.4 at 1 km.
- Temperature medians move little between sources (+0.1 to +0.5 °C from EU-Trees4F to CHELSA, the
  baseline warming from 1961–1990 to 1981–2010). **Precipitation is where the sources disagree**:
  CHELSA's medians are 15–20 % above WorldClim 2.1's for every species tested (beech 984 vs 866 mm,
  spruce 832 vs 705 mm), the known CHELSA behaviour of correcting orographic precipitation upward.

| species | EU-Trees4F x / y median | WorldClim 2.1 | CHELSA 2.1 |
|---|---|---|---|
| *Fagus sylvatica* | 8.4 °C / 816 mm | 8.5 / 866 | 8.8 / 984 |
| *Quercus ilex* | 13.3 / 596 | 13.2 / 586 | 13.7 / 682 |
| *Picea abies* | 5.3 / 682 | 5.6 / 705 | 6.0 / 832 |
| *Pinus pinaster* | 12.7 / 747 | 12.6 / 776 | 13.2 / 876 |
| *Quercus robur* | 9.5 / 773 | 9.7 / 795 | 10.2 / 873 |
| *Pinus sylvestris* | 6.0 / 645 | 6.3 / 659 | 6.7 / 786 |

## 3. Recommendation

1. **Serve the scatterplots from the 1 km grids; keep the EU-Trees4F block as the "as modelled" view**
   (it is the climate the EU-Trees4F maps were built on, so it stays available for consistency with the
   map pane and costs nothing: it is already stored).
2. **WorldClim 2.1 as the default source**: closest to the Atlas reference diagrams, carries the monthly
   radiation that P4 needs, and its 1970–2000 baseline sits between the inventory years and today.
3. **CHELSA 2.1 as the selectable alternative**, for its 1981–2010 baseline and the extra indicators
   WorldClim lacks (aridity index already stored; the moisture, degree-day and evapotranspiration
   candidates can follow). Its systematically higher precipitation must be stated in the pane's
   documentation so that users do not read the shift as a species difference.
4. The three blocks live side by side in `ScatterOccurrences`, `ScatterUnits` and `ScatterCells`, so the
   choice is a display setting, not a reload.

Consequence for the optional research track of 2026-10-30 (re-running the suitability model at 1 km):
the clouds do move visibly, so the precondition for considering it is met; it remains unscheduled.
