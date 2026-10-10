// Scripts the first view does not need wait here until that view is on the screen, so they can never hold it
// back. Shared by the home page (main.jsx) and every site page (site/site.js).

// `painted`: the browser has shown the page's first paint. It reports that after the fact, which is the point:
// a frame callback runs before its frame is shown, and a slow device can take seconds to show it.
export const painted = new Promise((done) => {
  // A tab opened in the background paints nothing, and old browsers do not report paints: wait for neither.
  if (document.hidden || !window.PerformanceObserver?.supportedEntryTypes?.includes('paint')) return done()
  new PerformanceObserver((list) => list.getEntriesByName('first-contentful-paint').length && done()).observe({ type: 'paint', buffered: true })
  setTimeout(done, 3000) // a minimised or covered window can count as visible and still paint nothing; don't wait for ever
})

// `settled`: the page has also loaded, and its hero photo (home, About) is drawn: decoded, then a quarter of a
// second to reach the screen.
export const settled = painted
  .then(() => new Promise((done) => (document.readyState === 'complete' ? done() : addEventListener('load', done, { once: true }))))
  .then(() => document.querySelector('img[fetchpriority="high"]')?.decode().catch(() => {}))
  .then(() => new Promise((done) => setTimeout(done, 250)))

// The Google tag's own script (177 KB). The snippet in index.html and shell.html queues the page view in
// dataLayer; it is sent when this arrives.
settled.then(() => document.head.append(Object.assign(document.createElement('script'), { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-2FYF61BX95' })))

// Counts for the owner's dashboard (api/track.js): this page view, what is clicked (the link's or button's own
// words), clicks on "Pick a time" (site/book.js), and how long the page was open. Nothing about the visitor is
// sent, and only from tarkova.com itself, so development and preview deploys stay out of the numbers.
const track = (name, meta) => { try { if (/(^|\.)tarkova\.com$/.test(location.hostname)) navigator.sendBeacon('/api/track/', JSON.stringify({ name, path: location.pathname, meta })) } catch {} }
painted.then(() => track('page_view'))
addEventListener('click', (e) => {
  const el = e.target.closest?.('a[href], button')
  if (!el) return
  if (el.matches('.book-cta')) track('demo_click')
  const words = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  if (words) track('click', words)
})
// ponytail: time on the page is sent once, the first time the page is hidden or left; time after coming back to
// the tab is not counted. Send the rest as a second event if the average ever looks short.
let since = document.hidden ? null : performance.now(), told = false
const leave = () => {
  if (told || since === null) return
  told = true
  const seconds = Math.round((performance.now() - since) / 1000)
  if (seconds >= 1) track('time', String(Math.min(seconds, 1800)))
}
addEventListener('visibilitychange', () => (document.hidden ? leave() : (since ??= performance.now())))
addEventListener('pagehide', leave)
