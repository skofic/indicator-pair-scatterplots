# Publication on the work server — Serve Plan step 1 (2026-11-11)

**Status: data and service deployed and verified at the public level; the web host for the pages and the
map files is pending (administrator); the server dropped four times under the service's heavier reads
(see §5) and must be looked at before the partners are invited.**

The goal of this step (decided 2026-11-11, see the display plan's decisions): put the two panes and the
host page on **work.eufgis.org** so that the partners can see them and give feedback, with the
coordinate-restricted units kept out everywhere (the service's `maxLevel` is public; the host page hides
the level control). The portal integration (Serve Plan questions 2–3) is not part of this step.

Everything below ran from the laptop over HTTPS against `https://work.eufgis.org` (ArangoDB **3.11.14**
behind nginx, JWT from `/_open/auth` with the `metadata-store` remote credentials). Nothing on the server
was touched by ssh.

## 1. What is on the work server now

| Item | State |
|---|---|
| `Dataset` | The project's records copied from the laptop (34 records on the server after the copy). |
| Foxx service `indicator-pair-scatterplots-service` | Installed at **`/_db/GeoService/panes`**, version 0.1.0, commit `8da4371` + the test change of this note. Configuration: `maxLevel` = `gcu_loc_coordinates-restriction_public`, `lang` = `ISO_639_3_eng`, `metadataUi` = `http://localhost:8529/_db/metadata/ui` (reachable: `/health` → dictionary 200), `prefill` false, `teardownDropsData` false. |
| `ScatterSpecies` | 271 (= dump) — `idx_species` |
| `ScatterUnits` | 3 669 (= dump) — `idx_species_list` |
| `ScatterMaps` | 2 515 (= dump) — `idx_species_dataset` |
| `PanesSuitability` | 804 (= dump) — `idx_classes_key` |
| `ScatterOccurrences` | 250 569 (= dump) — `idx_species_list`, `idx_geometry_point` |
| `PanesCache` | Created by setup; holds the default WorldClim base layer (see §4) |

`ScatterCells` was not transferred: the service does not read it (the point lookup derives the 1 km
cell key and reads the full `WorldClim` / `Chelsa` grids, which exist on the server).

## 2. How the data got there

Milko dumped the collections on the laptop (data only, no cache) to
`/Users/milko/Local/Backup/ArangoDB/export/Scatterplots/GeoService.<collection>._key.jsonl.gz`. The FTP
transfer to the server timed out that evening, so the files were sent **straight from the laptop to the
server's HTTP import API** instead: `POST /_db/GeoService/_api/import?collection=…&type=documents&onDuplicate=replace`,
the gzipped JSONL read locally and sent in **8 MB chunks** (a first attempt with 3 000-document chunks
broke the connection on `PanesSuitability`, whose documents hold one digit per cell: ~160 KB each),
every chunk retried up to eight times, progress kept in a state file so the run resumes where it
stopped. Order: species, units, maps, suitability, occurrences. The occurrences (156 requests) took
2 h 29 min at about 1 MB/s; the whole import reported **0 errors**, and every collection's count on the
server equals the dump's. The indexes were created by the service's `setup.js` at install, before the
data arrived, as agreed. The helper scripts live in the session's scratchpad, not in the repository:
the method is this paragraph.

Two code changes were needed on the service side: ArangoDB 3.11's V8 rejects `??` and `?.` at install
(error 3103), so the 26 sites became an `nz(value, default)` helper (commit `8da4371`, 17 tests pass on
the laptop's 3.12).

## 3. Verification at the public level

Every route answers on the server with the imported data:

- `/catalogue`: three datasets, their climates, axes, 271 species, countries, levels.
- `/base` (WorldClim 1970–2000, bio01 × bio12): 250 569 entries, 247 881 with values; the `ETag` is
  honoured (`If-None-Match` → 304).
- `/species/cells` (Fagus sylvatica): 35 853 cells. `/species/classes` for an EU-Trees4F future returns
  one digit per cell. `/maps`, `/state/validate`, `/selection` (polygon and point with the 1 km grid
  lookup), `/health` all fine.
- **Restricted units never appear.** `/units/index` lists 3 329 units (3 669 − 340 restricted), none
  flagged; `/species/units` for beech returns 441 units, all with a point and none restricted, and
  asking for the `manage` level returns the same 441 — the configured maximum clamps every request.
  `/units/geo` gives 441 features, nothing withheld.
- Foxx tests on the server: 15 of 17 passed; the two failures were the tests that ask for the `value`
  and `manage` levels, which a public-only instance cannot grant. The suite now skips those two when
  the configured maximum is public and runs a clamp test instead (18 tests; the service was upgraded
  in place). A clean run of the new suite on the server could not be completed: both attempts hit a
  server drop (§5). On the laptop the two level tests still run.

## 4. Performance on the server

| Measure | Work server | Laptop |
|---|---|---|
| Base layer, first computation (full scan of the 1.1 GB `ScatterOccurrences`, sorted by key) | 35–45 s | 0.8 s |
| Base layer, cached, 3.3 MB | 4–18 s (transfer-bound tonight: ~200 KB/s to the laptop) | 16 ms |
| Base layer, `304` | ~1 s | — |
| `/species/units`, `/units/index` | 1–5 s (transfer) | < 150 ms |

- Every service upgrade **empties `PanesCache`** (`setup.js` truncates it), so the base layers are
  recomputed on first request after each upgrade. The default WorldClim base is cached now.
- `prefill` would compute all 16 climates × 5 pairs (80 bases) inside the install request: at 40 s
  each that is about an hour and cannot run through HTTP. A warm-up from outside (one `/base` request
  per combination, sequential) is the practical alternative, **after** §5 is understood.
- nginx sends the JSON uncompressed (no `Content-Encoding`). Enabling gzip for `application/json` on
  the proxy would cut the 3.3 MB base answers by about two thirds — a request for the administrator.

## 5. The server dropped four times — to be checked by Milko / the administrator

nginx answered **502 Bad Gateway** (its upstream ArangoDB unreachable) for several seconds on four
occasions, all during the service's heavier reads and never during the 2.5 hours of 8 MB writes of the
import:

| Time (UTC, 2026-11-11) | What was running |
|---|---|
| ~00:33:30 – 00:34:10 | the first base-layer computation (38 s, then 502; every request failed for ~7 s) |
| ~00:38:30 | a Foxx test run, concurrently with a 2.8 MB fetch of the cached base |
| ~00:43:40 | the base-layer computation right after a service upgrade (13 s, then 502) |
| ~00:47:00 | a Foxx test run with the base cache warm (6 s, then 502) |

Each time the server was back within a minute and no data was lost (counts unchanged, the cache
document written when the computation had finished). The user used for the checks is not an
administrator, so the server log and statistics were not readable from the laptop. The service's base
query is a plain AQL scan returning two numbers per document, so the suspect is the process itself
(memory, a restart by systemd, a V8 heap limit under 3.11); worth checking on the server:

```
journalctl -u arangodb3 --since "2026-11-11 00:30" --until "2026-11-11 00:50"
dmesg -T | grep -i -E "killed process|out of memory"
free -m
grep -i -E "v8|cache-size|memory" /etc/arangodb3/arangod.conf
```

Until this is understood, no further base computations or test runs are triggered from the laptop.

## 6. What remains for this step

1. **A static web host** on work.eufgis.org for `examples/` (the three pages, `panes.css`, `panes.js`,
   `dictionary.js`, `service.js`) and the **2.3 GB of map files** (COGs read by byte range: the host
   must honour `Range` requests; gzip for JSON). An nginx directory needs the administrator — Milko
   contacts him on 2026-11-12.
2. Point the pages at the server: `?api=https://work.eufgis.org/_db/GeoService/panes` and
   `?dict=https://work.eufgis.org/_db/metadata/ui` (or bake the two origins into the published copy).
   Checked 2026-11-11: both answer **without a login** (`/panes/health`, `/panes/catalogue` and
   `/ui/enum/…` return 200 anonymously) and the server echoes the origin in
   `Access-Control-Allow-Origin`, so the pages can live on any host.
3. Warm the base cache (80 combinations, ~1 h) once §5 is settled; repeat after every upgrade.
4. Then invite the partners; the instructions page for the search box follows (Serve Plan).

## 7. Update of 2026-11-13

The server was back after an outage of the network (not of the server). Brought up to date the same day:

- **Service** upgraded at `/panes` to commit `dc40017` (five commits since `8da4371`: units without a
  species, elevation, EU-Trees4F point from the nearest surveyed cell within 5 km, the slim-instance
  fallback, `/units/geo` with projections). No `??` / `?.` in the code, as 3.11 requires.
- **Checked with light requests only** (§5 is still not understood, so no base computation and no test
  run): `/health` 200; `/species/units` without a species returns 3 329 units, none restricted, with
  elevation; `/units/geo` asked at the manage level returns 3 329 features, none restricted (clamped);
  a point selection answers in 0.24 s with the nearest cell and the elevation.
- **The upgrade emptied `PanesCache`**: the first request of each base layer will take 35 to 45 s there
  again, and that computation is what dropped the server on 2026-11-11.
- **Dataset records**: the `_info` of our three changed records (`SCATTER_OCCURRENCES`, `SCATTER_UNITS`,
  `EU-TREES4F_MAPS_2022`: issues, methods, citations) copied from the laptop.
- **Dictionary**: already current when checked (16 340 terms, 36 controls, the retired envelope label
  gone); not touched from here.
- No data collection changed since the load of 2026-11-11.

Still open, unchanged: the static host for the pages and maps, the cause of the four drops, the cache
warm-up.

**Warm-up attempt, 2026-11-13 20:11 UTC** (asked by Milko, run one request at a time, stopping at the first
failure): the first base computation (EU-Trees4F 1961–1990, annual temperature × precipitation) was
answered **502 after 48 s**; the server answered `/health` again within seconds and `PanesCache` held one
document afterwards, so the computation probably finished behind the proxy. Stopped there, nothing else
requested. Same behaviour as on 2026-11-11: the cause must be read in the server's log (§5) before the
other 79 combinations are tried.
