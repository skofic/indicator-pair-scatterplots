/* Shared page helpers of the panes. Pop: the reading popover behind the "i" (status) and "?" (hints) marks of the legend
   row. A native title tooltip cannot be styled; this one has a text style of its own (panes.css .pop) and shows a
   " · "-separated status as a list of lines. Hovering or focusing the mark opens it, leaving closes it. */
window.Pop = (() => {
  let box = null, owner = null, timer = null
  const el = () => box ?? (box = Object.assign(document.body.appendChild(document.createElement('div')), { className: 'pop' }))
  const html = (text) => String(text ?? '').split(' · ').map((s) => `<div>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('')
  function show(mark) {
    const text = mark.dataset.text; if (!text) return
    const b = el(); b.innerHTML = (mark.dataset.head ? `<div class="head">${mark.dataset.head}</div>` : '') + html(text); b.classList.add('open'); owner = mark
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
    mark.addEventListener('mouseleave', () => { timer = setTimeout(hide, 120) })
    mark.addEventListener('click', (e) => { e.stopPropagation(); if (pinned && owner === mark) { pinned = false; hide() } else { pinned = false; show(mark); pinned = true } })
    mark.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pinned = false; hide() } })
    if (!bind.doc) { bind.doc = true; document.addEventListener('click', () => { pinned = false; hide() }) }
  }
  /** set a mark's text; the mark glows briefly so that a changed status catches the eye without staying prominent */
  function set(mark, text, head) {
    mark.dataset.text = text ?? ''; if (head !== undefined) mark.dataset.head = head
    mark.classList.remove('flash'); void mark.offsetWidth; mark.classList.add('flash')
    if (owner === mark) show(mark)
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
  return { bind, set, show, hide, shortLabels }
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
