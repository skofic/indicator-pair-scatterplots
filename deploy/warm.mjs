// Warms the base-layer cache of a published instance: one /base request per climate × pair, one after the other.
//   node deploy/warm.mjs https://panes.example.org
const base = (process.argv[2] ?? '').replace(/\/$/, '') + '/_db/GeoService/panes'
// a site with users: SITE_USER and SITE_PASSWORD in the environment (never in a file in git)
const { SITE_USER, SITE_PASSWORD } = process.env, opt = SITE_USER ? { headers: { Authorization: 'Basic ' + Buffer.from(`${SITE_USER}:${SITE_PASSWORD}`).toString('base64') } } : {}
const cat = await (await fetch(`${base}/catalogue`, opt)).json()
const X = 'ui_layout_scatterplot_X', Y = 'ui_layout_scatterplot_Y'
let n = 0
for (const c of cat.climates) for (const p of cat.axes.pairs) {
  const u = new URL(`${base}/base`)
  u.searchParams.set('std_dataset_ids', JSON.stringify([c.std_dataset_ids])); u.searchParams.set('env_climate_period', c.env_climate_period); u.searchParams.set('env_climate_scenario', c.env_climate_scenario); u.searchParams.set(X, p[X]); u.searchParams.set(Y, p[Y])
  const t = Date.now(), r = await fetch(u, opt); await r.arrayBuffer()
  console.log(`${++n} ${r.status} ${Date.now() - t} ms  ${c.key} ${p[X]} × ${p[Y]}`)
}
