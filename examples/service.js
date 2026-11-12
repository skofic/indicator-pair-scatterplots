// Svc — the panes' access to their Foxx service (indicator-pair-scatterplots-service, mounted in GeoService at /panes).
// Every call names its parameters by the dictionary terms of ui_layout_state and gets answers in the same vocabulary;
// the large answers (base layer, species cells) are cached by the browser through the service's ETag and here in memory.
// `?api=<base url>` points at another instance (the portal's).
window.Svc = (() => {
  const q = new URLSearchParams(location.search)
  // on the laptop the local database; published, the same origin: the web server proxies /_db/GeoService/panes (deploy/Caddyfile)
  const BASE = q.get('api') || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8529' : location.origin) + '/_db/GeoService/panes'
  const mem = new Map()
  let pending = 0   // requests in flight → the page's activity monitor (panes.js Wait)
  const track = async (p) => { if (++pending === 1) window.Wait?.set('self', true); try { return await p } finally { if (--pending === 0) window.Wait?.set('self', false) } }
  const url = (path, params = {}) => { const u = new URL(BASE + path); for (const [k, v] of Object.entries(params)) if (v != null && v !== '') u.searchParams.set(k, Array.isArray(v) ? JSON.stringify(v) : v); return u.toString() }
  async function get(path, params, { cache = true } = {}) {
    const u = url(path, params)
    if (cache && mem.has(u)) return mem.get(u)
    return track((async () => {
      const r = await fetch(u); if (!r.ok) throw Object.assign(new Error(`${path}: ${r.status} ${(await r.text()).slice(0, 200)}`), { status: r.status })
      const j = await r.json(); if (cache) mem.set(u, j); return j
    })())
  }
  const post = (path, body) => track((async () => { const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw Object.assign(new Error(`${path}: ${r.status} ${(await r.text()).slice(0, 200)}`), { status: r.status }); return r.json() })())
  /** the keys of a state that name a climate and a pair */
  const climateKeys = (s) => ({ std_dataset_ids: s.std_dataset_ids, env_climate_period: s.env_climate_period, env_climate_scenario: s.env_climate_scenario })
  const axisKeys = (s) => ({ ui_layout_scatterplot_X: s.ui_layout_scatterplot_X, ui_layout_scatterplot_Y: s.ui_layout_scatterplot_Y })
  return {
    BASE,
    catalogue: () => get('/catalogue'),
    base: (s) => get('/base', { ...climateKeys(s), ...axisKeys(s) }),
    speciesCells: (species) => get('/species/cells', { species }),
    units: (species, s, level, filters = {}) => get('/species/units', { species, std_dataset_ids: s.std_dataset_ids, ...axisKeys(s), 'gcu_loc_coordinates-restriction_level': level, ...filters }, { cache: false }),
    classes: (species, s, variant) => get('/species/classes', { species, ...climateKeys(s), ui_layout_scatterplot_view_classes_variant: variant }).catch((e) => { if (e.status === 404) return null; throw e }),
    selection: (geometry, s) => post('/selection', { ui_layout_map_selection: geometry, ...(s ? { ...climateKeys(s), ...axisKeys(s) } : {}) }),
    unitsIndex: (level) => get('/units/index', { 'gcu_loc_coordinates-restriction_level': level }, { cache: false }),
    unitsGeo: (level, params = {}) => get('/units/geo', { 'gcu_loc_coordinates-restriction_level': level, ...params }, { cache: false }),
    maps: (species) => get('/maps', { species }),
    validate: (state) => post('/state/validate', state),
    health: () => get('/health', {}, { cache: false }),
  }
})()
