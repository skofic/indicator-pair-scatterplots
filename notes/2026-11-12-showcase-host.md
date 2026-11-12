# A showcase host of our own — options, decision, recipe (2026-11-12)

**Status: recipe written and tested as far as the laptop allows; waiting for Milko to rent the machine.**

The work server's administrator has not answered (static directory, memory, the four 502 drops; see
[`2026-11-11-work-server-publication.md`](2026-11-11-work-server-publication.md)). Milko wants a cheap place of
his own to show the panes to the FORGENIUS partners now, and other work later. Plan approved 2026-11-12.

## 1. What the application needs (measured on the laptop)

| Part | Size |
|---|---|
| `GeoService`, the panes' collections only (`Dataset`, `ScatterSpecies`, `ScatterUnits`, `ScatterMaps`, `PanesSuitability`, `ScatterOccurrences`, `UnitPolygons`) | 208 MB compressed export, about 600 MB of documents |
| `metadata` (the dictionary, with its `ui` service) | 8.5 MB compressed, 16 MB of documents |
| Map files (`maps/`) and the pages (`examples/`) | 2.3 GB |
| Machine | 2 cores, 4 GB RAM (8 GB comfortable), 20 GB disk |

Not copied: the 1 km `WorldClim` / `Chelsa` grids (53 million cells), `ScatterCells` (the service does not
read it), `Units` (it holds the restricted units' points) and `PanesCache` (recomputed).

**Consequences on a slim instance**, handled by the service since commit of this date (`has()` in
`lib/queries.js`): a clicked point is answered from the **nearest surveyed cell within 5 km for every
source** (on the full instance WorldClim and CHELSA answer from the 1 km grid at the exact place); the
**elevation of a clicked point is absent** (it came from the WorldClim elevation layer; unit elevations stay).
Storing the elevation with each surveyed cell would restore it; that is a data change for Milko to decide.

**Restricted units.** The export strips `geometry`, `geometry_bounds` and `geometry_hash_list` from the
polygons of the 340 restricted units before anything leaves the laptop (checked: 3 669 polygons, 3 329 with
geometry); their topography stays. `ScatterUnits` carries no point for them, `Units` is not copied, and the
service is configured with `maxLevel` public.

## 2. The options considered

| Option | Monthly cost (third-party figures, 2026; check the provider's page) | Verdict |
|---|---|---|
| Small rented server (Hetzner Cloud or similar, 4–8 GB RAM) + a domain name | about 5–9 EUR, domain about 10 EUR a year | **Chosen recipe.** Full control, stable address, HTTPS; room for later projects |
| Abacus AI SuperComputer | about 10 USD | Plausible (a persistent Linux machine with public HTTPS addresses); memory, disk and address stability unknown, no service guarantee. The same recipe runs there if Docker is available; worth a trial only |
| Oracle Cloud free tier | 0 | Halved in 2026 (2 cores, 12 GB), rarely available, over-limit machines deleted |
| Managed ArangoDB cloud | hundreds of USD | Out of proportion |
| No database: every answer precomputed to files on a free static host | 0 | Good for a permanent portfolio; needs polygon selection and point lookup in the browser. Later, if wanted |

## 3. The recipe (`deploy/`)

| File | Role |
|---|---|
| `slim.config.json` | What is copied, per database; the polygon-stripping query; the service configuration overrides |
| `slim.mjs export` | Laptop → `deploy/out/` (ignored by git): documents as gzipped JSONL, collection types, indexes, analyzers, views, the Foxx bundles and their configuration. HTTP only |
| `slim.mjs import` | `deploy/out/` → the target: databases, analyzers, collections, documents (8 MB chunks, streamed), indexes, views, services installed and configured. Target from `TARGET_URL`, `TARGET_USER`, `TARGET_PASSWORD` (environment, never a file in git); the user must be an administrator |
| `docker-compose.yml`, `Caddyfile`, `.env.example` | ArangoDB 3.12 (loopback only, bounded memory) behind Caddy: automatic HTTPS, compression, byte ranges; **only** `/_db/GeoService/panes/*` and `/_db/metadata/ui/*` are proxied |
| `publish.sh` | rsync of `examples/`, `maps/` and the server files |
| `warm.mjs` | One `/base` request per climate × pair (80) |

The pages need no address baked in: on `localhost` they use the laptop's database, anywhere else the
**same origin** (`examples/service.js`, `examples/dictionary.js`); `?api=` and `?dict=` still override.

Steps once the machine exists (Docker installed, DNS record pointing at it):

```
deploy/publish.sh user@server:/opt/panes            # pages, maps, server files
ssh user@server 'cd /opt/panes && cp .env.example .env && nano .env && docker compose up -d'
node deploy/slim.mjs export                          # about one minute
ssh -N -L 8530:127.0.0.1:8529 user@server &          # tunnel to the database
TARGET_URL=http://localhost:8530 TARGET_PASSWORD=… node deploy/slim.mjs import
node deploy/warm.mjs https://<address>
```

## 4. Verified, and not

- Verified: the export (1 min 5 s, counts equal to the collections'); the stripped polygons; the service
  with the change on the laptop (19 tests: 18 pass, 1 pending); the warm-up script (80 answers, about
  0.75 s each on the laptop).
- **Not verified:** the import, the Compose file and the Caddy configuration. The laptop's database user may
  not create databases and Docker is not running here, so there was no rehearsal. The slim-instance path of
  the point lookup is the EU-Trees4F code path, exercised by the tests only for EU-Trees4F. First run on the
  real machine is the test; the Foxx suite and the checks of the plan follow there.
