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
| `publish.sh` | rsync of the server files, `examples/` and `maps/` (small folders first, the Atlas rasters last) |
| `import-on-server.sh` | Sends the compressed export to the server and runs `slim.mjs import` there in a throw-away Node container |
| `warm.mjs` | One `/base` request per climate × pair (80) |

The pages need no address baked in: on `localhost` they use the laptop's database, anywhere else the
**same origin** (`examples/service.js`, `examples/dictionary.js`); `?api=` and `?dict=` still override.

Steps once the machine exists (Docker installed, DNS record pointing at it):

```
deploy/publish.sh user@server:/opt/panes            # server files, pages, maps (hours for the maps)
ssh user@server 'cd /opt/panes && cp .env.example .env && nano .env && docker compose up -d'
node deploy/slim.mjs export                          # about one minute
deploy/import-on-server.sh user@server /opt/panes    # upload 215 MB, import 38 s
node deploy/warm.mjs https://<address>
```

## 4. Verified, and not

- Verified on the laptop (2026-11-12): the export (1 min 5 s, counts equal to the collections'); the stripped
  polygons; the service with the change (19 tests: 18 pass, 1 pending); the warm-up script.

## 5. The installation (2026-11-12 … 13)

**Machine:** netcup VPS, 4 cores, 7.8 GB RAM, 125 GB disk, Debian 13, IP 62.83.125.116; address
`panes.skofic.io` (A record at NameSilo). Docker 26.1.5, Compose 2.26.1, a 2 GB swap file; everything in
`/opt/panes`; the database password generated on the server and kept only in `/opt/panes/.env`.

**What ran as written:** the Compose file, the Caddy configuration (certificate issued at first start), the
import's databases, analyzer, collections, indexes, views and both service installs.

**What had to change:**

| Finding | Fix |
|---|---|
| The import through an ssh tunnel sends the documents uncompressed: about 16 occurrence documents a second on the laptop's upload line (100–200 KB/s), 3.5 hours left when stopped | `import-on-server.sh`: the compressed export uploaded once, the import run on the server — **38 s**, every collection complete, 0 errors |
| ArangoDB 3.12.13 in the container refused the services' requests to their own instance ("not allowed to connect to this URL"), although both lists are empty by default: `/health` reported the dictionary unreachable, `/state/validate` and the test suite could not run. The laptop's 3.12.4 allows them. Cause in the image not found | `--javascript.endpoints-allowlist` for the instance's own address in the Compose file |
| `VIEW_SHAPE` could not be created (it links `Shapes`, which is not copied) | None needed: the panes do not use it. The export should skip views whose collections are not copied |
| The Mac's `rsync` has no `--info=progress2`; the maps (2.3 GB, Atlas first alphabetically) kept the site without maps for hours | `publish.sh` sends the small folders first |

**Checks on the public address (2026-11-13):**

- Counts equal to the export's in both databases (250 569 occurrences, 3 669 units, 3 669 polygons of which
  3 329 with geometry, 16 340 terms).
- Service tests: 19 tests, 17 pass, 2 pending (the two manage-level tests, skipped on a public-only instance).
- Restricted units: **no coordinate of any of the 340 exists on the server** (no reference point, no polygon,
  bounds or hash list); `/units/index` and `/units/geo` answer 3 329 units at every requested level.
- A map click answers for EU-Trees4F, WorldClim and CHELSA from the nearest surveyed cell (test point near
  Bolzano: 2 945 m away); elevation is `null`, as expected without the grid.
- Only the two service mounts are reachable: `/_api`, `/_admin`, other databases and `/.env` answer 404.
- Pages, dictionary and service answers are compressed (gzip or zstd).
- Cache warmed: 80 of 80 base layers (4–11 s each from the laptop, download included).
- The joint page loads in a headless browser without login: both panes, dictionary labels, units, chorology.

- Maps complete (2026-11-13, 06:20): 3 621 files, 2.45 GB, identical to the laptop's by an rsync dry run; the
  Atlas upload lost its connection three times and resumed. Atlas and EU-Trees4F rasters answer byte-range
  requests (HTTP 206).

## 6. Speed (Milko's first test, 2026-11-13)

Milko: works as on the laptop, but the map refreshes slowly. Measured the same morning:

| Measure | Value |
|---|---|
| Server load | 0.08 on 4 cores, 5 GB of 7.8 GB free: **more memory or processors would change nothing** |
| Server's line | 39 MB/s up, 120 MB/s down |
| Milko's line | about 1 MB/s down from a CDN, 0.4 MB/s from the server at that moment; 50–240 ms round trip |
| `/units/geo`, every unit | **2.1 s on the server itself**: it loaded every unit's climate blocks and every polygon's geometry to read six numbers. Rewritten with projections: 0.1 s, same answer (service commit `perf(units)`) |
| Other service answers on the server | 3–350 ms |
| HTTP/3 | advertised by Caddy but the UDP port was not published; published now |

What remains is the line between the browser and the server: each raster read is a few range requests of
0.2–0.5 s each, and megabyte answers (country outlines 1 MB, base layer 0.9 MB compressed) take 1–2 s on a
1 MB/s line. The laptop serves the same bytes from its own disk. Map files are cached by the browser for a
week, so a second visit to the same area is quick. To be confirmed from a faster connection.

## 7. Users (2026-11-13)

Milko: the site, and the future dictionary site, should not be open to everybody; a few users he can revoke
or change, nothing sophisticated. Built as HTTP basic authentication in Caddy:

- `users.sh add <name> | remove <name> | list`, run on the server in `/opt/panes`. `add` generates the
  password and prints it once; only bcrypt hashes are stored (`auth/users.txt`, written into
  `auth/users.caddy`); the web server is reloaded without interruption.
- The site block imports `/etc/caddy/auth/*.caddy`: **no user, no login** (the site stays open until the
  first `add`); with a user, pages, map files and both services answer 401 without credentials. A second
  site (the dictionary) imports the same line and shares the users; the browser asks once per site.
- Tested on the live site with a throwaway user (401 without, 200 with, open again after removal). The first
  request of a user costs about 1 s (bcrypt), later ones are cached by Caddy.
- With users, the cache warm-up needs `SITE_USER` and `SITE_PASSWORD` in the environment.
- **Refused logins are limited (same day, on Milko's request):** Caddy writes a JSON access log
  (`/opt/panes/logs/access.log`, 5 × 20 MB); `fail2ban` on the host reads it (`deploy/fail2ban/`: filter →
  `/etc/fail2ban/filter.d/caddy-auth.conf`, jail → `/etc/fail2ban/jail.d/caddy-auth.conf`): 30 answers 401
  from one address within 10 minutes ban it for one hour from every container port, TCP and UDP (Docker's
  `DOCKER-USER` chain; ssh is not affected). Verified: the filter matches the log's lines and dates; a ban of
  a reserved test address created and removed the firewall rule. Not verified end to end with a real flood
  (it would have banned Milko's own address). Release by hand: `fail2ban-client set caddy-auth unbanip <address>`.
- Not covered: a flood of requests that never reaches a login answer (the provider's network protection is
  the only defence there), and a limit per logged-in user.
- **ssh, found while installing:** 11 533 failed ssh logins in 24 hours, password login for root enabled.
  The package's `sshd` jail is active (4 addresses banned at once). **Key-only ssh since 2026-11-13 (Milko):**
  `/etc/ssh/sshd_config.d/00-key-only.conf` (no password or keyboard-interactive login, root by key only);
  verified: a new connection with the key works, a password-only attempt is refused. One key is authorised
  (Milko's laptop); if it is lost, the way in is netcup's web console.

**Open:** elevation of a clicked point on this instance (decision pending: store it with each surveyed cell).
