/* Shared page helpers of the panes. Pop: the reading popover behind the "i" (status) and "?" (hints) marks of the legend
   row. A native title tooltip cannot be styled; this one has a text style of its own (panes.css .pop) and shows a
   " · "-separated status as a list of lines. Hovering or focusing the mark opens it, leaving closes it. */
window.Pop = (() => {
  let box = null, owner = null, timer = null
  const el = () => {
    if (box) return box
    box = Object.assign(document.body.appendChild(document.createElement('div')), { className: 'pop' })
    // the popover can be entered (its links are clickable) and a click inside it does not close it
    box.addEventListener('mouseenter', () => clearTimeout(timer)); box.addEventListener('mouseleave', () => { timer = setTimeout(hide, 200) })
    box.addEventListener('click', (e) => e.stopPropagation())
    return box
  }
  const html = (text) => String(text ?? '').split(' · ').map((s) => `<div>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('')
  function show(mark) {
    const rich = mark._card ? mark._card() : null, text = mark.dataset.text; if (!rich && !text) return
    const b = el(); b.innerHTML = rich ?? (mark.dataset.head ? `<div class="head">${mark.dataset.head}</div>` : '') + html(text); b.classList.toggle('card', !!rich); b.classList.add('open'); owner = mark; b.scrollTop = 0
    const r = mark.getBoundingClientRect(), w = b.offsetWidth
    b.style.top = `${r.bottom + 6 + scrollY}px`; b.style.left = `${Math.max(6, Math.min(r.left + scrollX, innerWidth - w - 6))}px`
  }
  let pinned = false
  function hide() { if (pinned) return; if (box) box.classList.remove('open'); owner = null }
  /** bind a mark: hovering shows mark.dataset.text (kept current with set()); a click pins the popover open (touch
   *  screens have no hover), a second click or a click elsewhere closes it */
  function bind(mark) {
    mark.tabIndex = 0; mark.removeAttribute('title')
    mark.addEventListener('mouseenter', () => { clearTimeout(timer); if (!pinned) show(mark) })
    mark.addEventListener('mouseleave', () => { timer = setTimeout(hide, 200) })
    mark.addEventListener('click', (e) => { e.stopPropagation(); if (pinned && owner === mark) { pinned = false; hide() } else { pinned = false; show(mark); pinned = true } })
    mark.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pinned = false; hide() } })
    if (!bind.doc) { bind.doc = true; document.addEventListener('click', () => { pinned = false; hide() }) }
  }
  /** set a mark's text; the mark glows briefly so that a changed status catches the eye without staying prominent */
  function set(mark, text, head) {
    mark.dataset.text = text ?? ''; if (head !== undefined) mark.dataset.head = head
    mark.classList.remove('flash'); void mark.offsetWidth; mark.classList.add('flash')
    if (owner === mark) show(mark)
    if (window.Info) Info.refresh()   // a new status means the pane was redrawn: the chosen options may have changed
  }
  /** inside a captioned group, a label that repeats the caption ("Base layer opacity" under "Base layer") loses the
   *  repeated words; the full title stays in the hover. Call after Dict.labels(). */
  function shortLabels(root = document) {
    for (const g of root.querySelectorAll('.group')) {
      const cap = g.querySelector(':scope > .cap')?.textContent.trim().toLowerCase(); if (!cap) continue
      for (const e of g.querySelectorAll('label > span[data-term]')) {
        const t = e.textContent; if (t.toLowerCase().startsWith(cap + ' ') && t.length > cap.length + 1) { if (!e.title) e.title = t; const r = t.slice(cap.length + 1); e.textContent = r[0].toUpperCase() + r.slice(1) }
      }
    }
  }
  /** a term card on an element that is not a mark (a label, a caption): card() returns the HTML, or null for nothing.
   *  Opened by resting the pointer on the element (no click: a click on a label belongs to its control) */
  function card(target, fn, delay = 450) {
    target._card = fn; let wait = null
    target.addEventListener('mouseenter', () => { clearTimeout(timer); clearTimeout(wait); wait = setTimeout(() => { if (!pinned) show(target) }, delay) })
    target.addEventListener('mouseleave', () => { clearTimeout(wait); timer = setTimeout(hide, 200) })
  }
  return { bind, set, show, hide, shortLabels, card }
})()

/* Info: what the dictionary says of a control beyond its label. Every element labelled by a term (data-term) gets a
   term card when the term has more than a definition: the description, then `_uses` (what the control is for),
   `_methods` (how the drawing or value is produced) and `_issues` (what to keep in mind), each under the dictionary's
   own title for that field; the card's head links to the term's page on the dictionary site. A term with `_issues`
   gets a warning mark beside its label; a selector gets one beside itself when the chosen option, or the section the
   option belongs to (a source's periods), has issues. No text is written here: all of it is the dictionary's. */
window.Info = (() => {
  const SECT = ['_uses', '_methods', '_issues'], q = new URLSearchParams(location.search), h = location.hostname
  const SITE = q.get('dictsite') || (['localhost', '127.0.0.1'].includes(h) ? 'http://localhost:8529' : h.startsWith('panes.') ? `https://dictionary.${h.slice(6)}` : location.origin) + '/_db/metadata/web/'
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const href = (g) => `${SITE}#/term/${encodeURIComponent(g)}`
  /** the dictionary's Markdown, as far as its texts use it: paragraphs, bold, italics, code, links (a `gid.md` link is a term page) */
  const md = (t) => esc(t).split(/\n{2,}/).map((p) => '<p>' + p
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => `<a target="_blank" rel="noopener" href="${/^https?:/.test(url) ? url : href(url.replace(/\.md$/, ''))}">${txt}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, ' ') + '</p>').join('')
  const has = (g, f) => !!(g && Dict.info(g, f))
  const rich = (g) => g && ['_description', ...SECT].some((f) => has(g, f))
  /** one term's part of a card: head (the title, linked to the term page), definition, description, the three sections */
  function part(g, only) {
    let out = `<div class="head"><a target="_blank" rel="noopener" href="${href(g)}">${esc(Dict.title(g))} ↗</a></div>`
    if (!only) { const d = Dict.info(g, '_definition'); if (d) out += `<p class="def">${esc(d)}</p>`; if (has(g, '_description')) out += md(Dict.info(g, '_description')) }
    for (const f of only || SECT) if (has(g, f)) out += `<div class="sect${f === '_issues' ? ' issues' : ''}"><div class="sub">${f === '_issues' ? '⚠ ' : ''}${esc(Dict.title(f))}</div>${md(Dict.info(g, f))}</div>`
    return `<div class="term">${out}</div>`
  }
  /** the terms behind a selector's choice: the chosen option and, when it belongs to another namespace than the field's own (a source's periods), that section */
  function chosen(sel) {
    const g = sel && sel.value, t = g && Dict.terms.get(g); if (!t) return []
    const nid = t._code && t._code._nid
    return [g, ...(nid && !String(sel.dataset.key).startsWith(nid) && Dict.terms.has(nid) && Dict.terms.get(nid) ? [nid] : [])]
  }
  const selectOf = (e) => (e.closest('label') || (e.classList.contains('cap') ? e.parentElement : null))?.querySelector(e.classList.contains('cap') ? ':scope > select[data-key]' : 'select[data-key]')
  const warn = () => Object.assign(document.createElement('span'), { className: 'warn', textContent: '⚠', tabIndex: 0 })
  const targets = []
  async function init(root = document) {
    const els = [...root.querySelectorAll('[data-term]')].filter((e) => !e._info)
    await Dict.load([...SECT, ...els.flatMap((e) => (e.dataset.info || '').split(' '))])
    for (const e of els) {
      e._info = true
      // data-info names further terms the element stands for: a label term whose subject is a state property set by a
      // gesture (the map selection has no control of its own, its caption and the draw selector speak for it)
      const gs0 = [e.dataset.term, ...(e.dataset.info || '').split(' ').filter(Boolean)], sel = selectOf(e)
      Pop.card(e, () => { const gs = [...new Set([...gs0, ...chosen(sel)])].filter(rich); if (!gs.length) return null; e.removeAttribute('title'); return gs.map((x) => part(x)).join('') })
      targets.push({ e, gs: gs0, sel, mark: null, selMark: null })
    }
    await refresh()
  }
  let pending = null
  /** show or hide the warning marks; the sections of the chosen options are fetched on first need */
  function refresh() {
    clearTimeout(pending)
    return new Promise((done) => { pending = setTimeout(async () => {
      const nids = targets.map((t) => t.sel && Dict.terms.get(t.sel.value)?._code?._nid).filter((n) => n && !Dict.terms.has(n))
      if (nids.length) await Dict.load(nids)
      for (const t of targets) {
        if (t.gs.some((x) => has(x, '_issues'))) { if (!t.mark) { t.mark = warn(); if (t.e.classList.contains('cap')) t.e.append(t.mark); else t.e.after(t.mark);   // inside a caption: the settings grid gives every child of a group a column
          t.mark._card = () => t.gs.filter((x) => has(x, '_issues')).map((x) => part(x, ['_issues'])).join(''); Pop.bind(t.mark) } }
        if (t.sel) {
          const gs = chosen(t.sel).filter((x) => has(x, '_issues'))
          if (gs.length && !t.selMark) { t.selMark = warn(); t.sel.after(t.selMark); t.selMark._card = () => chosen(t.sel).filter((x) => has(x, '_issues')).map((x) => part(x, ['_issues'])).join('') || null; Pop.bind(t.selMark) }
          if (t.selMark) t.selMark.hidden = !gs.length
        }
      }
      done()
    }, 60) })
  }
  return { init, refresh, SITE }
})()

/* Wait: the activity monitor. service.js reports its pending requests here; the page's body gets the "busy" class while
   any are pending (panes.css dims the controls and shows the hourglass), released 150 ms after the last answer so that a
   chain of requests reads as one wait. A pane tells its host (or the window that opened it) too, so the host waits with
   its panes; the host counts every pane that is busy. */
window.Wait = (() => {
  const busy = new Set(); let timer = null
  const sync = () => { clearTimeout(timer); if (busy.size) document.body.classList.add('busy'); else timer = setTimeout(() => document.body.classList.remove('busy'), 150) }
  function set(who, on) {
    if (on) busy.add(who); else busy.delete(who); sync()
    if (who !== 'self') return
    for (const w of [window.parent !== window && window.parent, window.opener]) if (w) w.postMessage({ type: 'busy', busy: on }, '*')
  }
  window.addEventListener('message', (e) => { if (e.data?.type === 'busy') set(e.source, e.data.busy) })
  return { set }
})()

/* Store: the settings a pane remembers in the browser (localStorage, one entry per page). What is remembered is each
   page's list of state keys — never the species, country, unit or selections, which start empty (Milko, 2026-11-12);
   the restriction level is the portal's. Storage can be absent or blocked: every call is guarded. */
window.Store = {
  load(page, keys) { try { const o = JSON.parse(localStorage.getItem(`panes:${page}`)) || {}; return keys ? Object.fromEntries(Object.entries(o).filter(([k]) => keys.includes(k))) : o } catch { return {} } },
  save(page, state, keys, extra = {}) { try { localStorage.setItem(`panes:${page}`, JSON.stringify({ ...Object.fromEntries(keys.filter((k) => state[k] !== undefined).map((k) => [k, state[k]])), ...extra })) } catch {} },
}
