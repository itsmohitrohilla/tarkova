// One footer for every page: the static pages render it in Node (pages.js), the landing renders it
// in React (App.jsx). The animated particle wordmark goes in `.foot-wordmark` below this markup.
import { products } from './products.js'

export const MARK = `<svg class="mark" viewBox="4.6 4.6 14.8 14.8" aria-hidden="true"><path fill="currentColor" d="M11.64 18.31L7.44 18.31L12.36 5.69L16.56 5.69ZM18.31 12C17.63 13.74 15.66 15.15 13.92 15.15L16.38 8.85C18.13 8.85 18.99 10.26 18.31 12ZM10.08 8.85L7.62 15.15C5.87 15.15 5.01 13.74 5.69 12C6.37 10.26 8.34 8.85 10.08 8.85Z"/></svg>`

const topicLink = (t) => `<li><a href="/blog/topic/${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/">${t.replace(/^\w/, (c) => c.toUpperCase())}</a></li>`

// topics: [[name, count], ...] biggest first; tag names are plain words from our own posts table.
export function footerHTML(topics = []) {
  return `<div class="foot-grid">
  <div class="foot-brand"><a href="/" class="foot-logo">${MARK}<span>Tarkova</span></a></div>
  <div class="foot-cols">
  <div><h2>Products</h2><ul>${products.map((p) => `<li><a href="/${p.id}/">${p.name}</a></li>`).join('')}<li><a href="/products/">All products</a></li></ul></div>
  <div><h2>Docs</h2><ul>${products.map((p) => `<li><a href="${p.docs}" rel="noopener">${p.name} docs</a></li>`).join('')}</ul></div>
  <div><h2>Read</h2><ul><li><a href="/blog/">Blog</a></li>${topics.slice(0, 4).map(([t]) => topicLink(t)).join('')}<li><a href="/rss.xml">RSS feed</a></li></ul></div>
  <div><h2>Company</h2><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact us</a></li><li><a href="/privacy/">Privacy policy</a></li><li><a href="/terms/">Terms &amp; conditions</a></li></ul></div>
  </div>
</div>
<div class="foot-base"><span>© ${new Date().getFullYear()} Tarkova. All rights reserved.</span><a href="#top">Back to top <span aria-hidden="true">↑</span></a></div>`
}

// The particle wordmark's props, shared so both footers render it identically.
export const WORDMARK_PROPS = { variant: 'particle-wordmark', mode: 'dark', hue: 0, saturation: 1.0, brightness: 1.65 }
