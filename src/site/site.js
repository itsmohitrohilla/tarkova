import './site.css'

// Diagrams ship as Mermaid source (readable without JS); render them only where a post has one.
const diagrams = document.querySelectorAll('pre.mermaid')
if (diagrams.length) {
  import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      fontFamily: 'Funnel Sans, system-ui, sans-serif',
      themeVariables: {
        primaryColor: '#ffffff',
        primaryBorderColor: '#161616',
        primaryTextColor: '#161616',
        lineColor: '#52555A',
        secondaryColor: '#f4f4f1',
        tertiaryColor: '#f4f4f1',
        fontSize: '15px',
      },
    })
    mermaid.run({ nodes: diagrams })
  })
}

// Footer: the landing's animated particle wordmark, mounted with the page (it sits below the fold,
// so it's ready before anyone scrolls to it). Reduced motion keeps the still dotted SVG.
const wordmark = document.querySelector('.foot-wordmark')
if (wordmark && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  Promise.all([
    import('react'),
    import('react-dom/client'),
    import('@designcodeio/threeui'),
    import('./footer.js'),
    import('@designcodeio/threeui/style.css'),
  ]).then(([{ createElement }, { createRoot }, { TextAnimationCollection }, { WORDMARK_PROPS }]) => {
    wordmark.textContent = ''
    createRoot(wordmark).render(createElement(TextAnimationCollection, WORDMARK_PROPS))
  })
}

// The Crowkis page's motion engine, only where its scenes are on the page.
const ck = document.querySelector('[data-ck]')
if (ck) import('./crowkis/motion.js').then((m) => m.start(ck))
const cv = document.querySelector('[data-cv]')
if (cv) import('./curva/motion.js').then((m) => m.start(cv))
const ab = document.querySelector('[data-ab]')
if (ab) import('./about/motion.js').then((m) => m.start(ab))

// A post's outline marks the section being read: the last heading or figure to pass the upper
// fifth of the viewport.
const toc = document.querySelector('.toc')
if (toc) {
  const links = [...toc.querySelectorAll('a')]
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
  let current
  const mark = () => {
    let i = 0
    targets.forEach((t, j) => t && t.getBoundingClientRect().top < innerHeight * 0.2 && (i = j))
    if (links[i] === current) return
    current?.removeAttribute('aria-current')
    ;(current = links[i]).setAttribute('aria-current', 'location')
  }
  addEventListener('scroll', mark, { passive: true })
  mark()
}

// On narrow screens the topic bar scrolls sideways; start it at the current topic.
const tab = document.querySelector('.topics [aria-current]')
if (tab) tab.parentElement.parentElement.scrollLeft = tab.offsetLeft - 20

// Copy buttons: a code block's source, or the URL in data-copy.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]')
  if (!btn) return
  const text = btn.dataset.copy || btn.closest('figure').querySelector('code').textContent
  navigator.clipboard.writeText(text).then(() => {
    btn.dataset.label ??= btn.textContent
    btn.textContent = 'Copied'
    setTimeout(() => (btn.textContent = btn.dataset.label), 1400)
  })
})

// Blog search: filter /blog/search.json (fetched on first focus) as you type. Without JS the form
// falls back to a Google site search, so the box always works.
const bsearch = document.querySelector('[data-bsearch]')
if (bsearch) {
  const q = bsearch.querySelector('input[type=search]'), out = bsearch.querySelector('.bsearch-out')
  let index = null
  const load = () => (index ??= fetch('/blog/search.json').then((r) => r.json()))
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const render = async () => {
    const words = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (!words.length) { out.hidden = true; out.innerHTML = ''; return }
    const rows = await load()
    // ponytail: every word must appear in title/summary/topic; title hits rank first. Swap for a ranked index if it ever feels weak.
    const hits = rows
      .map(([t, s, g, u]) => ({ t, s, g, u, hay: `${t} ${s} ${g}`.toLowerCase(), inTitle: words.every((w) => t.toLowerCase().includes(w)) }))
      .filter((r) => words.every((w) => r.hay.includes(w)))
      .sort((a, b) => b.inTitle - a.inTitle)
    out.hidden = false
    out.innerHTML = hits.length
      ? `<p class="bsearch-n">${hits.length} result${hits.length === 1 ? '' : 's'}</p><ul role="list">${hits.slice(0, 12).map((r) => `<li><a href="${r.u}"><strong>${esc(r.t)}</strong><span>${esc(r.g)} · ${esc(r.s)}</span></a></li>`).join('')}</ul>`
      : '<p class="bsearch-n">No articles match. Try fewer words.</p>'
  }
  q.addEventListener('focus', load, { once: true })
  q.addEventListener('input', render)
  q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { q.value = ''; render() } })
  bsearch.addEventListener('submit', (e) => { e.preventDefault(); const first = out.querySelector('a'); if (first) location.href = first.href })
}
