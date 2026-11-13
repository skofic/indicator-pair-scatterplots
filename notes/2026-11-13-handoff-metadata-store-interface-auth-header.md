# Handoff to `metadata-store-interface` — no `Authorization` header when no API user is configured (2026-11-13)

**Context.** Milko's showcase server (netcup, `panes.skofic.io`) now also serves the dictionary: the `metadata`
database with `/ui` (read API, `searchDebug` off) and `/web` (this interface, the bundle installed on the
laptop, copied by `indicator-pair-scatterplots/deploy/`). The address will be `dictionary.skofic.io`. The
whole server sits behind **HTTP basic authentication in the web server (Caddy)**: a few users Milko can add
and revoke (`/opt/panes/users.sh`).

**The problem.** The built bundle creates its axios instance with a fixed header:

```
$.create({ baseURL: `/_db/metadata/ui`, headers: { Authorization: `Basic ` + btoa(`user:password`) } })
```

An explicit `Authorization` header replaces the one the browser would send for the site's login, so every
API call carries `user:password` and the web server answers **401** (verified on the server: the page and
its assets load for a logged-in user, a request to `/ui` with that header is refused). Where `/ui` is public
with nothing in front (laptop, work server) the header is ignored, which is why it never showed.

**Requested change.** In `src/boot/axios.js`: set the `Authorization` header only when `VITE_API_USER` is
non-empty; with an empty user send no such header, so the browser's own credentials for the origin apply.
The production build's `.env.production` already leaves the user empty. Nothing else needs to change: the
base URL is relative and the same bundle keeps working on the laptop and the work server.

**Then.** Rebuild and upgrade `/web` on the laptop as usual. The showcase server takes its copy from the
laptop's installed `/web` (`ONLY=metadata node deploy/slim.mjs export`, then
`deploy/import-on-server.sh root@<server> /opt/panes metadata`, run from the scatterplots repository): tell
that session when the laptop is upgraded.

**Also noted, no action asked:** the installed bundle on the laptop differs from this repository's
`dist/spa` (asset names differ), i.e. `dist/` is not the build that is deployed.
