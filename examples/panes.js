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
