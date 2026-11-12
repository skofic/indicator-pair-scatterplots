// Dict — the panes' access to the data dictionary (the `metadata` database's /ui Foxx service, read-only, anonymous).
// Every control, option, legend entry and axis of the panes is a dictionary term: its `_info._title` is the label or
// option text, `_info._definition` the hover text, `_info._description` the in-depth text, all keyed by language.
// The pages name terms by gid (`data-term` for texts, `data-key` for state keys) and this helper fetches them in one
// call, so a second language is a second `_info` key on the same terms and `?lang=<ISO 639-3>` switches the whole pane.
// `?dict=<base url>` points at another dictionary service (the portal's). Unreachable service: labels fall back to the
// gid's last segment, so the panes still work.
window.Dict = (() => {
  const q = new URLSearchParams(location.search)
  const BASE = q.get('dict') || (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8529' : location.origin) + '/_db/metadata/ui'   // published: the same origin (deploy/Caddyfile)
  const LANG = 'ISO_639_3_' + (q.get('lang') || 'eng')
  const terms = new Map()
  const post = (path, body) => fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())
  const text = (t, f) => t?._info?.[f]?.[LANG] ?? t?._info?.[f]?.ISO_639_3_eng ?? ''
  const last = (g) => String(g).split('_').pop()

  /** fetch the terms not yet cached (one call), then the unit terms they name */
  async function load(gids) {
    const missing = [...new Set(gids)].filter((g) => g && !terms.has(g))
    if (!missing.length) return terms
    try {
      for (const t of await post('/term/bulk', { gids: missing })) terms.set(t._code._gid, t)
      for (const g of missing) if (!terms.has(g)) terms.set(g, null)
      const units = missing.map((g) => unitGid(g)).filter((u) => u && !terms.has(u))
      if (units.length) for (const t of await post('/term/bulk', { gids: [...new Set(units)] })) terms.set(t._code._gid, t)
    } catch (e) { for (const g of missing) terms.set(g, null); console.warn('dictionary unreachable:', e.message) }
    return terms
  }
  const unitGid = (g) => { const s = terms.get(g)?._data?._scalar; const d = s && Object.values(s)[0]; return d?._unit ?? null }
  /** Markdown → plain text, for hover texts: links and images keep their words, emphasis, code and headings lose their marks */
  const plain = (md) => String(md ?? '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`#>]+/g, '').replace(/\s*\n+\s*/g, ' ').trim()
  const title = (g) => text(terms.get(g), '_title') || last(g)
  // `_title` and `_definition` are text, `_description` is Markdown: the hover shows the definition, else the description as plain text
  const def = (g) => text(terms.get(g), '_definition') || plain(text(terms.get(g), '_description'))
  const desc = (g) => text(terms.get(g), '_description')
  /** the stored / wire value of an element: its first alias (the period string, the class digit, the scenario key) */
  const aid = (g) => terms.get(g)?._code?._aid?.[0] ?? last(g)
  /** the unit symbol of a descriptor (°C, mm), empty when it has none */
  const unit = (g) => { const u = unitGid(g); return u ? (terms.get(u)?._code?._symbol_print ?? title(u)) : '' }

  /** label an element from a term: text = title, hover = definition */
  function label(el, g) { el.textContent = title(g); const d = def(g); if (d) el.title = d }
  /** fill a select with the elements of an enumeration, in the given order; option values are the gids. The menu's
   *  hover describes the chosen element (the label beside it describes the field, see hover()) */
  function options(sel, gids, current) {
    sel.innerHTML = ''
    for (const g of gids) { const o = new Option(title(g), g, false, g === current); const d = def(g); if (d) o.title = d; sel.add(o) }
    hover(sel)
  }
  /** a select's hover = the selected option's description, else the field's definition (sel.dataset.fieldDef); kept in step on change */
  function hover(sel) {
    const set = () => { sel.title = sel.selectedOptions[0]?.title || sel.dataset.fieldDef || '' }
    if (!sel.dataset.hoverBound) { sel.dataset.hoverBound = '1'; sel.addEventListener('change', set) }
    set()
  }
  /** every [data-term] element of the page gets its text and hover from its term */
  async function labels(root = document) {
    const els = [...root.querySelectorAll('[data-term]')]
    await load(els.map((e) => e.dataset.term))
    for (const e of els) label(e, e.dataset.term)
  }
  /** the dictionary's defaults for the pane state (ui_layout_state, every constant filled), {} when unreachable */
  async function defaults() {
    try { const r = await post('/validate/document', { descriptor: 'ui_layout_state', document: {}, compute: true }); return r.document ?? {} } catch { return {} }
  }
  /** validate a (partial) state against ui_layout_state; returns { ok, errors, warnings } */
  const validate = (doc) => post('/validate/document', { descriptor: 'ui_layout_state', document: doc }).catch((e) => ({ ok: null, errors: [{ message: e.message }], warnings: [] }))

  return { BASE, LANG, load, title, def, desc, plain, aid, unit, last, label, options, hover, labels, defaults, validate, terms }
})()
