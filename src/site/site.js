import '../global.css'
import './site.css'
import './book.css'
import { mountMusic } from '../music.js'
import { mountGlass } from '../glass.js'
import { painted, settled } from '../paint.js'

mountMusic()
mountGlass(document.querySelector('.pill'))

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

// Footer: the landing's animated particle wordmark. It sits below the fold, so its 240 KB of script waits
// until the page has loaded, is on the screen (paint.js) and the browser is idle; that is still well before
// anyone scrolls to it. Reduced motion keeps the still dotted SVG.
const wordmark = document.querySelector('.foot-wordmark')
if (wordmark && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const mount = () => Promise.all([
    import('react'),
    import('react-dom/client'),
    // Destructured in the .then, so the bundler keeps only this component instead of the whole 6.5 MB library.
    import('@designcodeio/threeui').then(({ TextAnimationCollection }) => TextAnimationCollection),
    import('./footer.js'),
    import('@designcodeio/threeui/style.css'),
  ]).then(([{ createElement }, { createRoot }, TextAnimationCollection, { WORDMARK_PROPS }]) => {
    wordmark.textContent = ''
    createRoot(wordmark).render(createElement(TextAnimationCollection, WORDMARK_PROPS))
  })
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1)) // Safari has no requestIdleCallback
  settled.then(() => idle(mount))
}

// Book a demo and the contact form (book.js), on the pages that end with that section.
const book = document.querySelector('.book')
if (book) import('./book.js').then((m) => m.mountBook(book))

// The Crowkis page's motion engine, only where its scenes are on the page.
const ck = document.querySelector('[data-ck]')
if (ck) import('./crowkis/motion.js').then((m) => m.start(ck))
const cv = document.querySelector('[data-cv]')
if (cv) import('./curva/motion.js').then((m) => m.start(cv))
// The About page's engine (51 KB) lets the hero photo arrive first: nothing there moves until someone scrolls,
// and the photo is the first thing they see. It starts once the photo is on the screen (paint.js), or a second
// after the first paint on a slow line, whichever comes first.
const ab = document.querySelector('[data-ab]')
if (ab) Promise.race([settled, painted.then(() => new Promise((done) => setTimeout(done, 1000)))]).then(() => import('./about/motion.js')).then((m) => m.start(ab))

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

// Blog light/dark toggle (blog pages only). The choice is saved and applied before paint by shell.html.
if (document.querySelector('.blog-wrap, .post')) {
  const root = document.documentElement
  const SUN = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  const MOON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
  const btn = document.createElement('button')
  btn.className = 'theme-toggle'
  const paint = () => {
    const dark = root.dataset.theme === 'dark'
    btn.innerHTML = dark ? SUN : MOON
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
  }
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('tk-blog-theme', root.dataset.theme) } catch {}
    paint()
  })
  paint()
  document.body.append(btn)
}
