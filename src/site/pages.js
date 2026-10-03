// Static pages for the blog, products and legal routes. Runs in Node (vite.config.js),
// in dev per request and at build time once, so every page ships as real HTML crawlers can read.
import { readFileSync } from 'node:fs'
import { coverArt, ACCENT } from './art.js'
import { products } from './products.js'
import { footerHTML, MARK } from './footer.js'
import { crowkisMain, CK_HEAD } from './crowkis/page.js'
import { curvaMain, CV_HEAD, CV_META } from './curva/page.js'
import { vsJevMain, VJ_META, VJ_PATH, VJ_UPDATED } from './curva/vs-jev.js'
import { aboutMain, AB_HEAD, TEAM } from './about/about.js'

const PER_PAGE = 24
// TODO(tarkova): confirm this inbox exists before launch; it's printed on the legal pages.
const CONTACT = 'hello@tarkova.com'
const CROWKIS = 'https://www.crowkis.com/'

// The 610 "Cache {framework} in your {use case} with Crowkis" posts are one template
// filled in 610 ways. Google reads that as scaled content and can demote the whole
// domain for it, so they stay live and linked but ask not to be indexed. Flip this
// once each one carries content unique to its use case.
const INDEX_MATRIX_PAGES = false
const MATRIX = /^Cache (?:the )?(.+?) in your (.+?) with Crowkis$/
const HUB = /^How to cache (?:the )?(.+?) LLM calls with Crowkis$/
const MEMORY = /^Give (?:the )?(.+?) agents long-term memory with Crowkis$/
// Definitions worth linking the first time another post uses the term.
const GLOSSARY = [
  ['what-is-a-semantic-cache-for-llms', /(?<![\w-])semantic cach(?:e|ing)(?![\w-])/i],
  ['what-is-an-embedding-really', /(?<![\w-])embeddings?(?![\w-])/i],
  ['what-is-agent-memory', /(?<![\w-])agent memory(?![\w-])/i],
]
const MAX_AUTO_LINKS = 4

// The footer wordmark in bright halftone dots (like the landing's particle wordmark),
// with an orange shimmer sweeping through the same letters.
const WM_SRC = readFileSync(new URL('../tarkova-wordmark.svg', import.meta.url), 'utf8').trim()
const WM_BOX = WM_SRC.match(/viewBox="([^"]+)"/)[1]
const [wx, wy, ww, wh] = WM_BOX.split(' ').map(Number)
const WORDMARK = `<svg viewBox="${WM_BOX}" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="wmd" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="1.05" fill="#f4f4f0"/></pattern>
<pattern id="wmo" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="1.25" fill="#ff4407"/></pattern>
<linearGradient id="wms" gradientUnits="userSpaceOnUse" x1="${wx}" y1="0" x2="${wx + 220}" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/><animateTransform attributeName="gradientTransform" type="translate" from="-260 0" to="${ww + 40} 0" dur="5.5s" repeatCount="indefinite"/></linearGradient>
<mask id="wmm"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#wms)"/></mask>
<g id="wml">${WM_SRC.match(/<path[\s\S]*\/>/)[0].replace(/ fill="#[0-9a-f]{6}"/gi, '')}</g>
</defs>
<use href="#wml" fill="url(#wmd)"/>
<use href="#wml" fill="url(#wmo)" mask="url(#wmm)" class="wm-sweep"/>
</svg>`

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const topicSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const topicPath = (t) => `/blog/topic/${topicSlug(t)}/`
const postPath = (p) => `/blog/${p.slug}/`
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…')
const titleCase = (s) => s.replace(/^\w/, (c) => c.toUpperCase())
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`

/* ---------- chrome shared by every static page ---------- */

function head({ site, title, description, path, type = 'website', noindex, ld, extra = '' }) {
  const url = site + path
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
<meta property="og:site_name" content="Tarkova" />
<meta property="og:type" content="${type}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${site}/og.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${site}/og.jpg" />
${extra}${ld ? jsonld(ld) : ''}`
}

// Same glass pill as the landing page; the logo always leads home. Products show their wordmark.
const NAV_MARK = {
  crowkis: '<img class="pill-wm" src="/products/crowkis-wordmark-white.png" alt="Crowkis" width="73" height="14" />',
  curva: '<img class="pill-wm" src="/products/curva-wordmark-white.png" alt="Curva" width="55" height="14" />',
}
function nav(active) {
  const link = (href, label, key, extra = '') => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}${extra}</a>`
  return `<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><nav class="pill" aria-label="Main">
<a class="pill-mark" href="/" aria-label="Tarkova home"><img src="/mark.png" alt="" width="38" height="38" /></a>
<div class="pill-links">${link('/about/', 'About', 'about')}${products.map((p) => link(`/${p.id}/`, NAV_MARK[p.id] || p.name, p.id)).join('')}${link('/blog/', 'Blog', 'blog', '<span class="nav-dot" aria-hidden="true"></span>')}</div>
</nav></header>`
}

const footer = (topics) => `<footer class="foot">${footerHTML(topics)}<div class="foot-wordmark" aria-hidden="true">${WORDMARK}</div></footer>`

const page = (active, topics, main, pre = '') => `${nav(active)}${pre}<main id="main">${main}</main>${footer(topics)}`

// Heading words rise in one after another; `*word*` renders in the serif italic.
const riseTitle = (s) =>
  s.split(' ').map((w, i) => `<span class="w" style="--i:${i}">${w.startsWith('*') ? `<em>${esc(w.replace(/\*/g, ''))}</em>` : esc(w)}</span>`).join(' ')

/* ---------- internal links ---------- */

function linkIndex(posts) {
  const bySlug = new Map(posts.map((p) => [p.slug, p]))
  const hubs = new Map() // framework → hub post
  for (const p of posts) {
    const m = p.title.match(HUB)
    if (m) hubs.set(m[1], p)
  }
  const terms = [
    ...GLOSSARY.filter(([s]) => bySlug.has(s)).map(([s, re]) => ({ re, to: bySlug.get(s) })),
    ...[...hubs].map(([fw, p]) => ({ re: new RegExp(`(?<![\\w.])${escRe(fw)}(?![\\w]|\\.\\w)`), to: p })),
  ]
  const frameworkOf = (p) => (p.title.match(MATRIX) || p.title.match(HUB) || p.title.match(MEMORY) || [])[1]
  return { hubs, terms, frameworkOf }
}

// Escaped text → HTML with `code` spans and at most a few first-mention links.
function inline(text, ctx) {
  let html = esc(text).replace(/`([^`]+)`/g, '<code>$1</code>')
  const guarded = /(<code>[\s\S]*?<\/code>|<a [\s\S]*?<\/a>)/
  const tryLink = (re, href, cls) => {
    const parts = html.split(guarded)
    for (let i = 0; i < parts.length; i += 2) {
      const m = parts[i].match(re)
      if (!m) continue
      parts[i] = parts[i].slice(0, m.index) + `<a href="${href}"${cls}>${m[0]}</a>` + parts[i].slice(m.index + m[0].length)
      html = parts.join('')
      return true
    }
    return false
  }
  if (!ctx.crowkisLinked && tryLink(/\bCrowkis\b/, CROWKIS, ' rel="noopener"')) ctx.crowkisLinked = true
  for (const t of ctx.terms) {
    if (ctx.linked.size >= MAX_AUTO_LINKS) break
    if (ctx.linked.has(t.to.slug) || t.to.slug === ctx.self) continue
    if (tryLink(t.re, postPath(t.to), '')) ctx.linked.add(t.to.slug)
  }
  return html
}

/* ---------- post body blocks ---------- */

// ctx.outline collects the h2s and titled figures for the post's "On this page" list.
function block(b, ctx) {
  switch (b.kind) {
    case 'p':
      return `<p>${inline(b.text, ctx)}</p>`
    case 'plain':
      return `<div class="callout" role="note"><p><strong>In plain words.</strong> ${inline(b.text, ctx)}</p></div>`
    case 'h2': {
      const id = topicSlug(b.text)
      ctx.outline.push({ id, text: b.text })
      return `<h2 id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${esc(b.text)}</h2>`
    }
    case 'quote':
      return `<blockquote class="pull"><p>${esc(b.text)}</p></blockquote>`
    case 'code':
      return `<figure class="code"><figcaption><span>${esc(b.title || 'code')}</span><button type="button" class="copy" data-copy aria-live="polite">Copy</button></figcaption><pre tabindex="0"><code>${highlight(b.code)}</code></pre></figure>`
    case 'table':
      return `<div class="table" role="region" tabindex="0" aria-label="${esc(b.title || 'Table')}"><table>${b.title ? `<caption>${esc(b.title)}</caption>` : ''}<thead><tr>${b.head.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(String(c), ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    case 'diagram':
      return `<figure class="diagram"${fig(b, ctx)}><pre class="mermaid">${esc(b.chart)}</pre>${caption(b, ctx.fig)}</figure>`
    case 'art':
      // ponytail: authored SVG from our own posts table (RLS: public read, owner write) is trusted as-is.
      return `<figure class="art"${fig(b, ctx)}>${b.svg.trim()}${caption(b, ctx.fig)}</figure>`
    case 'bars':
      return bars(b, fig(b, ctx), ctx.fig)
    case 'venn':
      return venn(b, fig(b, ctx), ctx.fig)
    default:
      return ''
  }
}

// Figures are numbered in reading order; titled ones join the outline.
function fig(b, ctx) {
  const id = `figure-${++ctx.fig}`
  if (b.title) ctx.outline.push({ id, text: b.title, fig: true })
  return ` id="${id}"`
}

const caption = (b, n) => `<figcaption><span class="fig-n">Figure ${n}.</span> ${b.title ? `<strong>${esc(b.title)}</strong>` : ''}${b.caption ? ` ${esc(b.caption)}` : ''}</figcaption>`

// Build-time syntax colour for the shell, Python, JS/TS, JSON and Rust samples in posts: comments,
// strings, numbers and common keywords. Plain spans, so the copy button still gets the raw text.
const TOKEN = /((?<=^|\s)#[^\n]*|(?<![:\w])\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(\d+(?:\.\d+)?)\b|\b(import|from|def|class|return|await|async|const|let|var|function|new|if|else|elif|for|in|of|while|try|except|catch|with|as|export|default|true|false|null|None|True|False|fn|pub|use|mut|impl|struct|match|docker|pip|npm|curl)\b/gm
function highlight(code) {
  let out = '', at = 0
  for (const m of code.matchAll(TOKEN)) {
    out += esc(code.slice(at, m.index)) + `<span class="t-${m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : 'k'}">${esc(m[0])}</span>`
    at = m.index + m[0].length
  }
  return out + esc(code.slice(at))
}

// One series, so no legend: the title names it, each bar carries its own value label,
// and the highlighted bar is the one the post is about.
function bars(b, id, n) {
  const max = Math.max(...b.series.map((s) => s.value)) || 1
  const rows = b.series.map((s) => `<li class="${s.accent ? 'on' : ''}" title="${esc(`${s.label}: ${s.value}${b.unit || ''}`)}">
<span class="bar-label">${esc(s.label)}${s.sub ? ` <small>${esc(s.sub)}</small>` : ''}</span>
<span class="bar-track"><span class="bar-fill" style="--v:${(s.value / max).toFixed(3)}"></span></span>
<span class="bar-val">${esc(String(s.value))}${esc(b.unit || '')}</span></li>`).join('')
  return `<figure class="bars"${id}><strong class="bars-title">${esc(b.title)}</strong><ul role="list">${rows}</ul>${caption({ caption: b.caption }, n)}</figure>`
}

function venn(b, id, n) {
  const col = (items, x, y0) => items.map((t, i) => `<text x="${x}" y="${y0 + i * 22}" text-anchor="middle" class="vi">${esc(t)}</text>`).join('')
  const overlap = (b.overlap || '').split('\n')
  return `<figure class="venn"${id}><svg viewBox="0 0 640 330" role="img" aria-label="${esc(`${b.left} versus ${b.right}. Only ${b.left}: ${b.leftItems.join(', ')}. Both: ${overlap.join(', ')}. Only ${b.right}: ${b.rightItems.join(', ')}.`)}">
<circle cx="235" cy="170" r="145" class="vl"/><circle cx="405" cy="170" r="145" class="vr"/>
<text x="165" y="92" text-anchor="middle" class="vh">${esc(b.left)}</text><text x="475" y="92" text-anchor="middle" class="vh">${esc(b.right)}</text>
${col(b.leftItems, 160, 150)}${col(b.rightItems, 480, 150)}${col(overlap, 320, 170 - (overlap.length - 1) * 11)}
</svg>${caption(b, n)}</figure>`
}

/* ---------- cards & listings ---------- */

// Topic, date and read time sit under the title, never above it.
const metaLine = (p) => `<p class="meta"><span class="topic" style="--t:${ACCENT[p.tag] || '#FF4407'}">${esc(titleCase(p.tag))}</span><time datetime="${p.published_at}">${fmtDate(p.published_at)}</time><span>${p.read_minutes} min read</span></p>`

function card(p, h = 'h2') {
  return `<li class="card"><a href="${postPath(p)}">
<div class="card-art">${coverArt(p.slug, p.tag)}</div>
<div class="card-text"><${h}>${esc(p.title)}</${h}><p class="card-sum">${esc(p.summary)}</p>${metaLine(p)}</div>
</a></li>`
}

// Page one opens with the newest post large, and the five after it alongside.
function spread(lead, side) {
  return `<section class="spread" aria-label="Newest articles">
<a class="lead" href="${postPath(lead)}">
  <div class="lead-art">${coverArt(lead.slug, lead.tag)}</div>
  <h2>${esc(lead.title)}</h2>
  <p class="lead-sum">${esc(lead.summary)}</p>
  ${metaLine(lead)}
</a>
${side.length ? `<div class="side"><h2 class="side-h">Also new</h2><ul role="list">${side.map((p) => `<li><a href="${postPath(p)}"><div class="side-text"><h3>${esc(p.title)}</h3>${metaLine(p)}</div><div class="side-art">${coverArt(p.slug, p.tag)}</div></a></li>`).join('')}</ul></div>` : ''}
</section>`
}

function pager(base, n, total) {
  if (total < 2) return ''
  const href = (i) => (i === 1 ? base : `${base}page/${i}/`)
  const nums = [...new Set([1, n - 1, n, n + 1, total])].filter((i) => i >= 1 && i <= total).sort((a, b) => a - b)
  let out = '', last = 0
  for (const i of nums) {
    if (i - last > 1) out += '<li class="gap" aria-hidden="true">…</li>'
    out += i === n ? `<li><span aria-current="page">${i}</span></li>` : `<li><a href="${href(i)}" aria-label="Page ${i}">${i}</a></li>`
    last = i
  }
  return `<nav class="pager" aria-label="Pagination">${n > 1 ? `<a class="pg-edge" rel="prev" href="${href(n - 1)}">← Newer</a>` : '<span></span>'}<ol role="list">${out}</ol>${n < total ? `<a class="pg-edge pg-next" rel="next" href="${href(n + 1)}">Older →</a>` : '<span></span>'}</nav>`
}

// One line per topic for its page's masthead (and meta description).
const TOPIC_LEDE = {
  guides: 'Step-by-step setups for caching LLM calls and giving agents memory with Crowkis, one framework at a time.',
  features: 'What Crowkis does under the hood, one capability at a time.',
  'use cases': 'Where semantic caching and agent memory pay off in real products.',
  'vs the field': 'How Crowkis compares with vector databases, gateways and other caches.',
  engineering: 'How Crowkis is built: the Rust internals, the search engine and the decisions behind them.',
  economics: 'The cost math of LLM workloads, and where repeated calls quietly add up.',
  security: 'Keeping AI infrastructure safe: injection checks, poisoning defences and tenant isolation.',
  reference: 'Short references for Crowkis commands, one command per page.',
  operations: 'Running Crowkis in production: cache warming, rate limits, dedup and dashboards.',
  benchmarks: 'Latency, throughput and memory results from our own test runs.',
}

function listingPages({ site, posts, topics, base, topic, allCount }) {
  const lead = posts.find((p) => p.indexable) || posts[0]
  const rest = posts.filter((p) => p !== lead)
  // Page one also carries the five "Also new" entries beside the lead, so its grid keeps rows of three.
  const FIRST = PER_PAGE + 2
  const total = 1 + Math.ceil(Math.max(0, rest.length - FIRST) / PER_PAGE)
  const out = []
  for (let n = 1; n <= total; n++) {
    const path = n === 1 ? base : `${base}page/${n}/`
    const from = n === 1 ? 0 : FIRST + (n - 2) * PER_PAGE
    const slice = rest.slice(from, n === 1 ? FIRST : from + PER_PAGE)
    const side = n === 1 ? slice.slice(0, 5) : []
    const name = topic ? `${titleCase(topic)} articles` : 'Blog'
    const title = `${name}${n > 1 ? ` · page ${n}` : ''} | Tarkova`
    const description = topic
      ? `${TOPIC_LEDE[topic] || `Tarkova articles on ${topic}.`} ${posts.length} articles from Tarkova.`
      : 'Practical reads on semantic caching, agent memory, LLM cost and the engineering behind Crowkis, from the team at Tarkova.'
    const tabs = [['All', '/blog/', allCount, !topic], ...topics.map(([t, c]) => [titleCase(t), topicPath(t), c, t === topic])]
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': topic ? 'CollectionPage' : 'Blog', '@id': `${site}${base}#blog`, name: `Tarkova ${name}`, url: site + path, description, publisher: { '@id': `${site}/#org` } },
        breadcrumbs(site, [['Home', '/'], ['Blog', '/blog/'], ...(topic ? [[titleCase(topic), base]] : [])]),
        org(site),
      ],
    }
    const lede = topic
      ? `${esc(TOPIC_LEDE[topic] || '')} ${posts.length} articles.`
      : 'Guides, benchmarks and deep dives on semantic caching, agent memory and LLM cost, from the team building Crowkis.'
    const main = `<div class="blog-wrap">
<header class="mast${n > 1 ? ' mast-sub' : ''}">
  <h1>${topic ? esc(titleCase(topic)) : 'Practical reads to help you spend less on AI.'}</h1>
  <div class="mast-foot"><p class="mast-lede">${lede}</p><a class="mast-rss" href="/rss.xml">Subscribe with RSS</a></div>
</header>
<nav class="topics" aria-label="Topics"><ul role="list">${tabs.map(([l, h, c, on]) => `<li><a href="${h}"${on ? ` aria-current="${n === 1 ? 'page' : 'true'}"` : ''}>${esc(l)}<span class="n">${c}</span></a></li>`).join('')}</ul></nav>
${n === 1 ? spread(lead, side) : ''}
${slice.length > side.length ? `<section class="more" aria-labelledby="more-h">
<div class="sec-head"><h2 id="more-h">${n === 1 ? 'More articles' : 'Older articles'}</h2>${total > 1 ? `<span>Page ${n} of ${total}</span>` : ''}</div>
<ul class="grid" role="list">${slice.slice(side.length).map((p) => card(p, 'h3')).join('')}</ul>
</section>` : ''}
${pager(base, n, total)}
</div>`
    out.push([path, { head: head({ site, title, description, path, ld }), body: page('blog', topics, main) }])
  }
  return out
}

const org = (site) => ({ '@type': 'Organization', '@id': `${site}/#org`, name: 'Tarkova', url: `${site}/`, logo: `${site}/apple-touch-icon.png`, slogan: 'Building new age businesses', sameAs: [CROWKIS] })
const breadcrumbs = (site, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site + path })),
})

/* ---------- a post ---------- */

const STOP = new Set('a an and the to of in on for with your you is are how what why when it its vs not just your crowkis'.split(' '))
const words = (s) => new Set(s.toLowerCase().split(/[^a-z0-9.]+/).filter((w) => w.length > 2 && !STOP.has(w)))

function related(p, posts, idx, n = 3) {
  const fw = idx.frameworkOf(p)
  const mine = words(p.title)
  return posts
    .filter((q) => q !== p)
    .map((q) => {
      let s = (q.tag === p.tag ? 2 : 0) + (q.indexable ? 1 : 0) + (fw && idx.frameworkOf(q) === fw ? 4 : 0)
      for (const w of words(q.title)) if (mine.has(w)) s++
      return [s, q]
    })
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map(([, q]) => q)
}

function postPage({ site, p, posts, idx, topics, prev, next }) {
  const path = postPath(p)
  const url = site + path
  const ctx = { terms: idx.terms, linked: new Set(), self: p.slug, crowkisLinked: false, fig: 0, outline: [] }
  const body = p.body.map((b) => block(b, ctx)).join('\n')
  const wordCount = p.body.reduce((n, b) => n + String(b.text || b.code || '').split(/\s+/).length, 0)
  const fw = idx.frameworkOf(p)
  const hub = fw && idx.hubs.get(fw)
  // A framework's hub lists its use-case pages, so every one of them is a click from a real guide.
  const family = hub === p ? posts.filter((q) => q !== p && idx.frameworkOf(q) === fw) : []
  const share = encodeURIComponent(url)
  const title = `${p.title} | Tarkova`
  const description = clip(p.summary, 158)

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: clip(p.title, 110),
        description: p.summary,
        datePublished: p.published_at,
        dateModified: p.updated_at.toISOString(),
        author: { '@type': 'Organization', name: 'Tarkova', url: `${site}/` },
        publisher: { '@id': `${site}/#org` },
        mainEntityOfPage: url,
        image: `${site}/og.jpg`,
        articleSection: p.tag,
        keywords: p.keywords?.length ? p.keywords.join(', ') : undefined,
        wordCount,
        inLanguage: 'en',
        isPartOf: { '@id': `${site}/blog/#blog` },
        mentions: [{ '@type': 'SoftwareApplication', name: 'Crowkis', url: CROWKIS, applicationCategory: 'DeveloperApplication' }],
      },
      breadcrumbs(site, [['Home', '/'], ['Blog', '/blog/'], [titleCase(p.tag), topicPath(p.tag)], [p.title, path]]),
      org(site),
    ],
  }
  const extra = `<meta property="article:published_time" content="${p.published_at}" />
<meta property="article:modified_time" content="${p.updated_at.toISOString()}" />
<meta property="article:section" content="${esc(p.tag)}" />
`
  // The closing pitch is for the product the post is about.
  const prod = products.find((x) => x.id === (/\bcurva\b/i.test(`${p.title} ${p.summary}`) ? 'curva' : 'crowkis'))
  const pitch = prod.id === 'curva'
    ? [`${CV_META.title.replace(/^Curva: /, '').replace(/^\w/, (c) => c.toUpperCase())}.`, CV_META.description]
    : ['Stop paying twice for the same answer.', 'Crowkis is a semantic cache for LLM workloads, built in Rust. Free community edition, one Docker image.']
  const [wm, ww, wh] = prod.wordmark
  const topic = titleCase(p.tag)
  const shareTo = [
    ['X', `https://x.com/intent/post?text=${encodeURIComponent(p.title)}&amp;url=${share}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${share}`],
    ['Hacker News', `https://news.ycombinator.com/submitlink?u=${share}&amp;t=${encodeURIComponent(p.title)}`],
    ['Reddit', `https://www.reddit.com/submit?url=${share}&amp;title=${encodeURIComponent(p.title)}`],
  ]
  // An outline of one entry is noise, so short posts skip it and the rail holds only sharing.
  const toc = ctx.outline.length > 1
    ? `<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h" class="rail-h">On this page</h2><ol role="list">${ctx.outline.map((o) => `<li${o.fig ? ' class="toc-fig"' : ''}><a href="#${o.id}">${esc(o.text)}</a></li>`).join('')}</ol></nav>`
    : ''
  const main = `<article class="post">
<header class="post-head">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/blog/">Blog</a></li><li><a href="${topicPath(p.tag)}">${esc(topic)}</a></li></ol></nav>
  <h1>${esc(p.title)}</h1>
  <p class="post-lede">${esc(p.summary)}</p>
  <p class="post-meta"><span class="by"><span class="by-mark">${MARK}</span>Tarkova</span><time datetime="${p.published_at}">${fmtDate(p.published_at)}</time><span>${p.read_minutes} min read</span></p>
</header>
<div class="post-art">${coverArt(p.slug, p.tag)}</div>
<div class="post-body">
<div class="prose">
${body}
</div>
<aside class="rail" aria-label="On this page and sharing">
${toc}
<div class="share"><h2 class="rail-h">Share</h2><ul role="list">${shareTo.map(([l, h]) => `<li><a href="${h}" rel="noopener" target="_blank">${l}<span class="sr"> (opens in a new tab)</span></a></li>`).join('')}<li><button type="button" data-copy="${url}" aria-live="polite">Copy link</button></li></ul></div>
</aside>
</div>
<footer class="post-end">
  <p class="filed">Filed under <a href="${topicPath(p.tag)}">${esc(topic)}</a>. Published <time datetime="${p.published_at}">${fmtDate(p.published_at)}</time>.</p>
  ${family.length ? `<section class="family" aria-labelledby="family-h"><h2 id="family-h">${esc(fw)}, by use case</h2><ul>${family.map((q) => `<li><a href="${postPath(q)}">${esc(q.title.replace(/ with Crowkis$/, ''))}</a></li>`).join('')}</ul></section>` : ''}
  ${hub && hub !== p ? `<p class="hub-link">New to ${esc(fw)} with Crowkis? Start with <a href="${postPath(hub)}">${esc(hub.title)}</a>.</p>` : ''}
</footer>
<aside class="post-cta" style="--brand:${prod.color}" aria-labelledby="cta-h">
  <img src="${wm}" alt="${esc(prod.name)}" width="${Math.round((28 * ww) / wh)}" height="28" />
  <h2 id="cta-h">${esc(pitch[0])}</h2>
  <p>${esc(pitch[1])}</p>
  <div class="cta-links"><a class="cta-btn" href="/${prod.id}/">Meet ${esc(prod.name)} <span aria-hidden="true">→</span></a>${prod.url ? `<a class="cta-btn cta-ghost" href="${prod.url}" rel="noopener">Visit ${esc(new URL(prod.url).hostname.replace('www.', ''))} <span aria-hidden="true">↗</span></a>` : ''}</div>
</aside>
<nav class="prevnext" aria-label="Newer and older posts">
  ${next ? `<a href="${postPath(next)}"><small>Newer</small>${esc(next.title)}</a>` : '<span></span>'}
  ${prev ? `<a href="${postPath(prev)}" class="older"><small>Older</small>${esc(prev.title)}</a>` : ''}
</nav>
</article>
<section class="blog-wrap related" aria-labelledby="keep">
<div class="sec-head"><h2 id="keep">Keep reading</h2><a href="${topicPath(p.tag)}">More in ${esc(topic)} <span aria-hidden="true">→</span></a></div>
<ul class="grid" role="list">${related(p, posts, idx).map((q) => card(q, 'h3')).join('')}</ul>
</section>`
  return [path, { head: head({ site, title, description, path, type: 'article', noindex: !p.indexable, ld, extra }), body: page('blog', topics, main, '<div class="progress" aria-hidden="true"></div>') }]
}

/* ---------- products, legal, 404 ---------- */

function productsPage(site, topics) {
  const title = 'Products: Crowkis and Curva | Tarkova'
  const description = 'Tarkova builds software businesses. Crowkis is a semantic cache for LLMs; Curva is coming next.'
  const live = products.filter((p) => p.url)
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        itemListElement: live.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'SoftwareApplication', name: p.name, url: p.url, description: p.summary, applicationCategory: 'DeveloperApplication', operatingSystem: 'Linux, macOS, Windows (Docker)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${site}/#org` } },
        })),
      },
      breadcrumbs(site, [['Home', '/'], ['Products', '/products/']]),
      org(site),
    ],
  }
  const main = `<div class="wrap">
<header class="blog-hero"><span class="chip chip-soft">Products</span><h1>${riseTitle('Two products. One obsession: *smarter* software.')}</h1><p class="lede">Tarkova builds new age businesses. Here's what's shipping, and what's next.</p></header>
${products.map((p) => `<section class="product" id="${p.id}" style="--brand:${p.color}">
  <div class="product-art"><img src="${p.logo}" alt="${esc(p.logoAlt)}" width="512" height="512" /></div>
  <div class="product-body">
    <span class="chip">${esc(p.status)}</span>
    <h2>${esc(p.name)}</h2>
    <p class="product-tag">${esc(p.tagline)}</p>
    <p>${esc(p.summary)}</p>
    <a class="btn" href="/${p.id}/">Explore ${esc(p.name)} <span aria-hidden="true">→</span></a>
    ${p.facts.length ? `<dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    ${p.links.length ? `<div class="product-links">${p.links.map(([l, h], i) => `<a class="btn btn-ghost" href="${h}" rel="noopener">${esc(l)} <span aria-hidden="true">↗</span></a>`).join('')}${p.id === 'crowkis' ? '<a class="btn btn-ghost" href="/blog/">Read the Crowkis blog</a>' : ''}</div>` : ''}
  </div>
</section>`).join('')}
</div>`
  return ['/products/', { head: head({ site, title, description, path: '/products/', ld }), body: page('products', topics, main) }]
}

// A product's own page on tarkova.com: the problem, what it is, how it works, what it does for you.
// Sections render only when products.js has their copy, so Curva can grow into the same layout.
function productPage(site, topics, p, latest) {
  const c = p.page
  const path = `/${p.id}/`
  const serif = (t) => esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>')
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      p.url
        ? { '@type': 'SoftwareApplication', '@id': `${site}${path}#app`, name: p.name, url: p.url, mainEntityOfPage: site + path, description: c.description, image: site + p.logo, applicationCategory: 'DeveloperApplication', operatingSystem: 'Linux, macOS, Windows (Docker)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': `${site}/#org` } }
        : { '@type': 'WebPage', name: c.title, url: site + path, description: c.description, publisher: { '@id': `${site}/#org` } },
      breadcrumbs(site, [['Home', '/'], [p.name, path]]),
      org(site),
    ],
  }
  const section = (id, kicker, title, inner) => `<section class="pp-sec wrap" id="${id}" aria-labelledby="${id}-h"><p class="pp-kicker">${kicker}</p><h2 id="${id}-h">${serif(title)}</h2>${inner}</section>`

  // Crowkis gets the full motion piece (src/site/crowkis/); other products use the layout below.
  if (p.id === 'crowkis')
    return [path, { head: head({ site, title: `${c.title} | Tarkova`, description: c.description, path, ld, extra: CK_HEAD }), body: page(p.id, topics, crowkisMain({ p, c, latest, esc, serif, card })) }]
  // Curva gets its own "calibration lab" piece (src/site/curva/), with copy from its Content Box.
  if (p.id === 'curva') {
    const cvld = { '@context': 'https://schema.org', '@graph': [curvaApp(site), breadcrumbs(site, [['Home', '/'], [p.name, path]]), org(site)] }
    return [path, { head: head({ site, title: `${CV_META.title} | Tarkova`, description: CV_META.description, path, ld: cvld, extra: CV_HEAD }), body: page(p.id, topics, curvaMain({ p, esc, serif })) }]
  }
  const main = `<div class="pp" style="--brand:${p.color}">
<section class="pp-hero">
  <div class="pp-dots" aria-hidden="true"></div>
  <div class="pp-hero-text">
    <h1${p.wordmark ? ' class="pp-wordmark"' : ''}>${p.wordmark ? `<img src="${p.wordmark[0]}" alt="${esc(p.name)}" width="${p.wordmark[1]}" height="${p.wordmark[2]}" />` : riseTitle(p.name)}</h1>
    <p class="pp-tag">${esc(p.tagline)}</p>
    <p class="pp-lede">${esc(c.hero)}</p>
    <div class="product-links">${c.how ? '<a class="btn pp-btn" href="#how">See how it works</a>' : '<a class="btn pp-btn" href="/blog/">Read the Tarkova blog</a>'}${p.url ? `<a class="btn pp-btn-ghost" href="${p.url}" rel="noopener">Visit ${esc(new URL(p.url).hostname.replace('www.', ''))} <span aria-hidden="true">↗</span></a>` : ''}</div>
  </div>
  <div class="pp-logo${p.mark ? ' pp-logo-mark' : ''}">${p.mark ? `<img src="${p.mark[0]}" alt="${esc(p.logoAlt)}" width="${p.mark[1]}" height="${p.mark[2]}" />` : `<img src="${p.logo}" alt="${esc(p.logoAlt)}" width="512" height="512" />`}</div>
</section>
${p.facts.length ? `<dl class="pp-stats wrap">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
${c.problem ? section('problem', 'The problem', c.problem.title, `<p class="pp-intro">${esc(c.problem.intro)}</p><ol class="pp-problems" role="list">${c.problem.items.map(([h, t], i) => `<li><span class="pp-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>`) : ''}
${c.what ? section('what', `What ${esc(p.name)} is`, c.what.title, `<p class="pp-intro">${esc(c.what.text)}</p><div class="pp-compare" role="table" aria-label="How ${esc(p.name)} compares">${c.what.compare.map(([n, a, b], i) => `<div role="row" class="${i === c.what.compare.length - 1 ? 'on' : ''}"><strong role="rowheader">${esc(n)}</strong><span role="cell">${esc(a)}</span><span role="cell">${esc(b)}</span></div>`).join('')}</div>`) : ''}
${c.how ? section('how', 'How it works', 'From question to answer in *four* steps.', `<ol class="pp-steps" role="list">${c.how.map(([h, t], i) => `<li style="--i:${i}"><span class="pp-step">${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>${c.code ? `<figure class="code pp-code"><figcaption><span>${esc(c.code.title)}</span><button type="button" class="copy" data-copy>Copy</button></figcaption><pre><code>${esc(c.code.body)}</code></pre></figure>` : ''}`) : ''}
${c.forYou ? section('for-you', 'What it can do for you', `Less spend. Faster answers. *Safer* AI.`, `<ul class="pp-grid" role="list">${c.forYou.map(([h, t]) => `<li><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ul>`) : ''}
${!c.problem ? section('next', 'In the works', `Something *new* is on the way.`, `<p class="pp-intro">We're keeping the details close for now. When ${esc(p.name)} is ready, this page is where you'll meet it first. Until then, see what the Tarkova studio already ships.</p><div class="product-links"><a class="btn" href="/crowkis/">Meet Crowkis <span aria-hidden="true">→</span></a><a class="btn btn-ghost" href="/blog/">Read the blog</a></div>`) : ''}
${latest.length ? section('reading', 'From the blog', `Go *deeper*.`, `<ul class="grid" role="list">${latest.map((q) => card(q, 'h3')).join('')}</ul>`) : ''}
${p.url ? `<section class="pp-cta wrap">${p.mark ? `<img class="pp-cta-mark" src="${p.mark[0]}" alt="" width="136" height="${Math.round((136 * p.mark[2]) / p.mark[1])}" />` : `<img src="${p.logo}" alt="" width="96" height="96" />`}<h2>${serif(p.id === 'crowkis' ? 'Stop paying *twice* for the same answer.' : p.tagline)}</h2><div class="product-links">${p.links.map(([l, h], i) => `<a class="btn ${i ? 'pp-btn-ghost' : 'pp-btn'}" href="${h}" rel="noopener">${esc(l)} <span aria-hidden="true">↗</span></a>`).join('')}</div></section>` : ''}
</div>`
  return [path, { head: head({ site, title: `${c.title} | Tarkova`, description: c.description, path, ld }), body: page(p.id, topics, main) }]
}

/* ---------- Curva vs Jev ---------- */

// Curva has no domain of its own yet, so its page on tarkova.com is the app's URL.
const curvaApp = (site) => ({
  '@type': 'SoftwareApplication',
  '@id': `${site}/curva/#app`,
  name: 'Curva',
  url: `${site}/curva/`,
  description: CV_META.description,
  image: `${site}/products/curva.png`,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any (Python, Node.js or Docker)',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  softwareHelp: { '@type': 'CreativeWork', url: 'https://itsmohitrohilla.github.io/curva-docs/' },
  downloadUrl: 'https://pypi.org/project/curva-ai/',
  publisher: { '@id': `${site}/#org` },
})

function vsJevPage(site, topics) {
  const url = site + VJ_PATH
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#page`,
        name: VJ_META.title,
        url,
        description: VJ_META.description,
        dateModified: VJ_UPDATED,
        inLanguage: 'en',
        about: [{ '@id': `${site}/curva/#app` }, { '@type': 'SoftwareApplication', name: 'Jev', applicationCategory: 'DeveloperApplication', publisher: { '@type': 'Organization', name: 'TypeSafe AI', url: 'https://typesafe.ai' } }],
        publisher: { '@id': `${site}/#org` },
      },
      curvaApp(site),
      breadcrumbs(site, [['Home', '/'], ['Curva', '/curva/'], ['Curva vs Jev', VJ_PATH]]),
      org(site),
    ],
  }
  return [VJ_PATH, { head: head({ site, title: `${VJ_META.title} | Tarkova`, description: VJ_META.description, path: VJ_PATH, ld }), body: page('curva', topics, vsJevMain({ esc })) }]
}

/* ---------- about ---------- */

function aboutPage(site, topics) {
  const path = '/about/'
  const title = 'About Tarkova: the studio behind Crowkis and Curva'
  const description = 'Tarkova builds products that make AI work better in the real world. How Crowkis started, why our mark is a single letter, and the founders, Mohit Rohilla and Subhraneel Baruah.'
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'AboutPage', name: title, url: site + path, description, mainEntity: { '@id': `${site}/#org` } },
      { ...org(site), founder: TEAM.map((m) => ({ '@type': 'Person', name: m.name, jobTitle: m.role, sameAs: [m.linkedin], ...(m.photo ? { image: site + m.photo } : {}) })) },
      breadcrumbs(site, [['Home', '/'], ['About', path]]),
    ],
  }
  return [path, { head: head({ site, title: `${title} | Tarkova`, description, path, ld, extra: AB_HEAD }), body: page('about', topics, aboutMain({ esc })) }]
}

const UPDATED = 'September 29, 2026'

function legal(site, topics, path, heading, description, sections) {
  const main = `<article class="legal narrow">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li></ol></nav>
<h1>${esc(heading)}</h1>
<p class="byline"><span>Last updated ${UPDATED}</span></p>
${sections.map(([h, ...ps]) => `<h2>${h}</h2>${ps.map((t) => `<p>${t}</p>`).join('')}`).join('\n')}
</article>`
  return [path, { head: head({ site, title: `${heading} | Tarkova`, description, path, ld: { '@context': 'https://schema.org', '@graph': [breadcrumbs(site, [['Home', '/'], [heading, path]]), org(site)] } }), body: page('', topics, main) }]
}

const mail = `<a href="mailto:${CONTACT}">${CONTACT}</a>`

const privacy = (site, topics) =>
  legal(site, topics, '/privacy/', 'Privacy policy', 'How Tarkova handles information when you visit tarkova.com: no tracking cookies, no ads, no data sales.', [
    ['Who we are', `This policy covers tarkova.com, run by Tarkova ("we", "us"). Our products, such as <a href="${CROWKIS}" rel="noopener">Crowkis</a>, have their own sites and policies, which apply when you use them.`],
    ['What we collect', 'You can read everything on this site without an account, and we do not ask you for personal information.', 'Like any website, the servers that host this site keep standard request logs: your IP address, browser type, the page you asked for and when. We use these only to keep the site running and secure, and they are deleted on the hosting provider\'s normal schedule.', `If you email us at ${mail}, we keep your message and address so we can reply.`],
    ['Cookies', 'This site does not set cookies, run analytics, or show ads, so there is nothing to consent to. Fonts and images are served from our own domain. If we ever add analytics, we will update this page and ask for consent where the law requires it.'],
    ['Links to other sites', 'Posts link to other websites, and the share buttons open X, LinkedIn, Hacker News or Reddit. Those sites have their own privacy practices, which we do not control.'],
    ['Sharing', 'We do not sell or rent personal information. We share it only with the service providers that host this site, or when the law requires it.'],
    ['Your rights', `Depending on where you live (for example under the GDPR or India's Digital Personal Data Protection Act, 2023), you can ask us to access, correct or delete personal information we hold about you. Email ${mail} and we will respond within 30 days.`],
    ['Children', 'This site is not aimed at children under 13, and we do not knowingly collect their information.'],
    ['Changes', 'When we change this policy we update the date at the top of this page.'],
    ['Contact', `Questions about privacy: ${mail}.`],
  ])

const terms = (site, topics) =>
  legal(site, topics, '/terms/', 'Terms & conditions', 'The terms for using tarkova.com and its blog, including how you can quote our articles and reuse code samples.', [
    ['Agreement', 'By using tarkova.com you agree to these terms. If you do not agree, please do not use the site.'],
    ['Using the site', 'You may browse, read and share this site for any lawful purpose. Please do not try to disrupt it, scrape it at a rate that degrades it for others, or access parts of it you are not meant to.'],
    ['Our content', 'The articles, diagrams, illustrations, logos and design on this site belong to Tarkova. The Tarkova, Crowkis and Curva names and logos are our trademarks.', 'You are welcome to quote short passages from our articles, as long as you credit Tarkova and link back to the original article.'],
    ['Code samples', 'Code snippets in our articles are provided so you can use them. You may copy, modify and use them in your own projects, commercial or not, without attribution.'],
    ['Our products', `Products such as <a href="${CROWKIS}" rel="noopener">Crowkis</a> are governed by their own licence and terms, published on their own sites.`],
    ['No warranty', 'Articles are for general information. Benchmarks and cost figures describe the setups we tested; your results will depend on your workload. The site and its content are provided "as is", without warranties of any kind.'],
    ['Limitation of liability', 'To the extent the law allows, Tarkova is not liable for any indirect or consequential loss arising from your use of this site or reliance on its content.'],
    ['Other websites', 'We link to other sites for convenience. We are not responsible for their content or practices.'],
    ['Changes', 'We may update these terms from time to time. The date at the top shows the latest version, and continuing to use the site means you accept it.'],
    ['Governing law', 'These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute.'],
    ['Contact', `Questions about these terms: ${mail}.`],
  ])

function notFound(site, topics, latest) {
  const main = `<div class="wrap nf">
<p class="nf-code" aria-hidden="true">404</p>
<h1>${riseTitle('This page took a *different* path.')}</h1>
<p class="lede">The link may be old, or the page may have moved. Try one of these instead.</p>
<div class="product-links"><a class="btn" href="/">Go home</a><a class="btn btn-ghost" href="/blog/">Read the blog</a><a class="btn btn-ghost" href="/products/">See products</a></div>
<ul class="grid" role="list">${latest.map((p) => card(p, 'h2')).join('')}</ul>
</div>`
  return ['/404.html', { head: head({ site, title: 'Page not found | Tarkova', description: 'This page could not be found.', path: '/404.html', noindex: true }), body: page('', topics, main) }]
}

/* ---------- feeds for crawlers ---------- */

const xml = (s) => esc(s)

function sitemap(site, posts, topics) {
  const url = (path, lastmod, priority) => `<url><loc>${site}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority></url>`
  const newest = posts[0].updated_at.toISOString().slice(0, 10)
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
    url('/', newest, '1.0'),
    ...products.map((p) => url(`/${p.id}/`, null, '0.9')),
    url(VJ_PATH, VJ_UPDATED, '0.8'),
    url('/products/', null, '0.8'),
    url('/about/', null, '0.7'),
    url('/blog/', newest, '0.9'),
    ...topics.map(([t]) => url(topicPath(t), null, '0.6')),
    ...posts.filter((p) => p.indexable).map((p) => url(postPath(p), p.updated_at.toISOString().slice(0, 10), '0.7')),
    url('/privacy/', null, '0.2'),
    url('/terms/', null, '0.2'),
  ].join('\n')}
</urlset>`
}

const robots = (site) => `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`

function rss(site, posts) {
  const items = posts.filter((p) => p.indexable).slice(0, 50)
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>Tarkova Blog</title><link>${site}/blog/</link><description>Practical reads on semantic caching, agent memory and LLM cost.</description><language>en</language>
<atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
${items.map((p) => `<item><title>${xml(p.title)}</title><link>${site}${postPath(p)}</link><guid>${site}${postPath(p)}</guid><pubDate>${new Date(p.published_at + 'T00:00:00Z').toUTCString()}</pubDate><category>${xml(p.tag)}</category><description>${xml(p.summary)}</description></item>`).join('\n')}
</channel></rss>`
}

// llms.txt: a plain map of the site for AI answer engines (llmstxt.org).
function llms(site, posts, topics) {
  const idx = posts.filter((p) => p.indexable)
  return `# Tarkova

> Tarkova builds new age software businesses. Products: Crowkis (${CROWKIS}), a semantic cache and agent memory layer for LLM workloads, built in Rust; and Curva (coming soon).

${products.map((p) => `- [${p.name}](${site}/${p.id}/): ${p.summary}`).join('\n')}
- [Curva vs Jev](${site}${VJ_PATH}): ${VJ_META.description}
- [About Tarkova](${site}/about/)
- [Products](${site}/products/)
- [Blog](${site}/blog/)

${topics.map(([t]) => `## ${titleCase(t)}\n\n${idx.filter((p) => p.tag === t).map((p) => `- [${p.title}](${site}${postPath(p)}): ${p.summary}`).join('\n')}`).join('\n\n')}
`
}

/* ---------- everything ---------- */

// rows: posts ordered newest first. Returns route → {head, body} plus raw files.
export function buildSite(rows, { site }) {
  const posts = rows.map((p) => ({ ...p, indexable: INDEX_MATRIX_PAGES || !MATRIX.test(p.title) }))
  const idx = linkIndex(posts)
  const counts = new Map()
  for (const p of posts) counts.set(p.tag, (counts.get(p.tag) || 0) + 1)
  const topics = [...counts].sort((a, b) => b[1] - a[1])
  const indexable = posts.filter((p) => p.indexable)

  const pages = new Map([
    // The main listing shows the hand-written posts; topic pages list everything.
    ...listingPages({ site, posts: indexable, topics, base: '/blog/', allCount: posts.length }),
    ...topics.flatMap(([t]) => listingPages({ site, posts: posts.filter((p) => p.tag === t), topics, base: topicPath(t), topic: t, allCount: posts.length })),
    ...posts.map((p, i) => postPage({ site, p, posts, idx, topics, prev: posts[i + 1], next: posts[i - 1] })),
    productsPage(site, topics),
    aboutPage(site, topics),
    ...products.map((p) => productPage(site, topics, p, p.url ? indexable.slice(0, 3) : [])),
    vsJevPage(site, topics),
    privacy(site, topics),
    terms(site, topics),
    notFound(site, topics, indexable.slice(0, 3)),
  ])

  const latest = indexable.slice(0, 3).map((p) => ({ title: p.title, summary: p.summary, tag: p.tag, url: postPath(p), minutes: p.read_minutes, cover: coverArt(p.slug, p.tag) }))
  const files = new Map([
    ['/sitemap.xml', sitemap(site, posts, topics)],
    ['/robots.txt', robots(site)],
    ['/rss.xml', rss(site, posts)],
    ['/llms.txt', llms(site, posts, topics)],
    ['/blog/latest.json', JSON.stringify({ posts: latest, topics })],
  ])
  return { pages, files }
}

// Placeholders live in shell.html; a function replacement keeps `$&` in code samples literal.
export const fillShell = (shell, { head, body }) => shell.replace('<!--head-->', () => head).replace('<!--body-->', () => body)
