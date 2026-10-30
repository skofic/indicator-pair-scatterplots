"""Step 9 of the collection plan: the three-source comparison of the scatterplot, from the work files (no database).

For a pair (default P1: bio01 x bio12) and a set of species, draws the Atlas-style diagram once per climate
source (grey = all occurrence cells, blue = the species' cells) side by side, and tabulates per species the
median / 5-95 % envelope of each axis per source, so the visible and the numeric difference between
EU-Trees4F (WorldClim 1.4, 10 km), WorldClim 2.1 (1 km) and CHELSA 2.1 (1 km) can be judged.

Usage: .venv/bin/python sources/compare/compare_sources.py [--pair bio01 bio12] [--species "Fagus sylvatica" ...] [--out work/compare]
"""
import argparse, json, sys
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt

SOURCES = ['eutrees4f', 'worldclim', 'chelsa']
LABEL = {'eutrees4f': 'EU-Trees4F (WorldClim 1.4, 1961-90, 10 km)', 'worldclim': 'WorldClim 2.1 (1970-2000, 1 km)', 'chelsa': 'CHELSA 2.1 (1981-2010, 1 km)'}
SCALE = {'eutrees4f': {'bio01': 0.1, 'tas_summer': 0.1, 'pr_summer': 1/3, 'pr_winter': 1/3}}
AXIS = {'bio01': 'Annual mean temperature (°C)', 'bio12': 'Annual precipitation (mm)', 'tas_summer': 'Summer temperature (°C)',
        'pr_summer': 'Summer precipitation (mm/month)', 'pr_winter': 'Winter precipitation (mm/month)', 'continentality': 'Continentality (°C)',
        'bio15': 'Precipitation seasonality (CV %)'}

def load(src):
    d = {}
    for l in open(f'work/climate-{src}.jsonl'):
        r = json.loads(l); d[r['key']] = r['values']
    return d

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pair', nargs=2, default=['bio01', 'bio12'])
    ap.add_argument('--species', nargs='*', default=['Fagus sylvatica', 'Quercus ilex', 'Picea abies', 'Pinus pinaster', 'Quercus robur', 'Pinus sylvestris'])
    ap.add_argument('--out', default='work/compare')
    a = ap.parse_args()
    x, y = a.pair
    occ = [json.loads(l) for l in open('work/occurrences.jsonl')]
    clim = {s: load(s) for s in SOURCES}
    def xy(src, keys):
        sc = SCALE.get(src, {})
        pts = [(clim[src][k].get(x), clim[src][k].get(y)) for k in keys if k in clim[src]]
        pts = [(px * sc.get(x, 1), py * sc.get(y, 1)) for px, py in pts if px is not None and py is not None]
        return np.array(pts) if pts else np.zeros((0, 2))
    allk = [o['key'] for o in occ]
    base = {s: xy(s, allk) for s in SOURCES}
    lines = [f'# Three-source comparison: {AXIS.get(x, x)} × {AXIS.get(y, y)}\n', f'Base layer: {len(allk)} EU-Forest cells. Per source: base n, species n, median and 5–95 % envelope of each axis.\n',
             '| species | source | n base | n species | x median (5–95 %) | y median (5–95 %) |', '|---|---|---|---|---|---|']
    for sp in a.species:
        keys = [o['key'] for o in occ if sp in o['species']]
        fig, axes = plt.subplots(1, 3, figsize=(15, 4.6), sharex=True, sharey=True)
        for ax, s in zip(axes, SOURCES):
            b = base[s]; p = xy(s, keys)
            ax.scatter(b[:, 0], b[:, 1], s=1, c='#c8c8c8', linewidths=0, rasterized=True)
            if len(p): ax.scatter(p[:, 0], p[:, 1], s=1.5, c='#1f4e9c', linewidths=0, rasterized=True)
            ax.set_title(LABEL[s], fontsize=9); ax.set_xlabel(AXIS.get(x, x)); ax.grid(alpha=.3)
            q = lambda v: f'{np.median(v):.1f} ({np.percentile(v, 5):.1f}–{np.percentile(v, 95):.1f})' if len(v) else '—'
            lines.append(f'| {sp} | {s} | {len(b)} | {len(p)} | {q(p[:, 0]) if len(p) else "—"} | {q(p[:, 1]) if len(p) else "—"} |')
        axes[0].set_ylabel(AXIS.get(y, y)); fig.suptitle(f'{sp}: {len(keys)} occurrence cells', fontsize=11)
        fig.tight_layout(); fn = f"{a.out}/{sp.replace(' ', '_')}_{x}_{y}.png"; fig.savefig(fn, dpi=110); plt.close(fig)
        print('wrote', fn, file=sys.stderr)
    open(f'{a.out}/summary_{x}_{y}.md', 'w').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))

if __name__ == '__main__':
    main()
