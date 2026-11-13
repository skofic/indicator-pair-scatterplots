# Handoff to every repository of the `Metadata` folder: the shared folder (2026-11-13)

From the `indicator-pair-scatterplots` session, carried by Milko to the sessions of `metadata-store`,
`metadata-store-interface`, `metadata-store-validator`, `metadata-external-databases`,
`indicator-pair-scatterplots-service`, `geojson-s2` and `geojson-s2-service`.

## What exists

`/Users/milko/Local/Development/Git/Projects/Metadata/shared/` (beside the repositories, `../shared/` from
each of them), created on Milko's decision of 2026-11-13:

- `README.md`: the purpose and the rules.
- `deployments.md`: which server runs what, behind what, how each part gets there, and what follows for
  each repository.

It is not a git repository yet.

## Why

A fact about a server broke an assumption in another repository: the showcase server put a login in front
of everything, and the dictionary interface sent an `Authorization` header of its own, which the login
refused. No repository's `CLAUDE.md` was the place for that fact. The shared folder is.

## What is asked of your repository

1. **Add a pointer** to your `CLAUDE.md`, where the ecosystem or the servers are described:

   > **Cross-repository facts** (which server runs what, behind what):
   > [`../shared/deployments.md`](../shared/deployments.md). Read it before assuming anything about a
   > server; do not copy its content here.

2. **Read `deployments.md` once** and check the lines about your repository. If something is wrong or
   missing, correct it there.

3. **From now on**, a fact that concerns more than one repository goes there, not into one repository's
   `CLAUDE.md`: a server's address, version or access rule, what is installed where, a convention two
   repositories must share.

## The rules

- One fact, one place: point to it, do not copy it.
- **No credentials there, ever**: no password, token or key, and no file that holds one.
- The folder says what is true now. A request from one session to another still travels as a handoff note
  carried by Milko. Changing the shared folder is not a way to ask another session for work.
- When you change a file there, say so in your report to Milko, so that he can tell the sessions concerned.

## What in it concerns each repository today

| Repository | What to check |
|---|---|
| `metadata-store` | the dictionary on the showcase server is a copy of the laptop's, replaced as a whole, removals included; the work server is reloaded by Milko |
| `metadata-store-interface` | `dictionary.skofic.io` serves the interface behind a site login; only `/web` and `/ui` are reachable; the interface is copied from the laptop's installed `/web` |
| `metadata-store-validator` | nothing server-side today; confirm |
| `metadata-external-databases` | the showcase server holds no climate grids; `GeoService` there is the panes' collections only |
| `indicator-pair-scatterplots-service` | installed at `/panes` on the laptop, the work server (ArangoDB 3.11) and the showcase server (3.12); an upgrade empties the base cache |
| `geojson-s2`, `geojson-s2-service` | not on the showcase server; confirm what runs where |

## Coming

The server's own material (the web server's configuration, the users script, the import and publication
scripts, now in `indicator-pair-scatterplots/deploy/`) will move to a repository of its own, named after
the server's domain (Milko, 2026-11-13), because the final portal server will need its own configuration.
`deployments.md` will point to it.
