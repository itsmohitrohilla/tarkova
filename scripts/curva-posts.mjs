#!/usr/bin/env node
// Curva blog posts: validate, insert as drafts, publish in waves.
//
//   node scripts/curva-posts.mjs                      validate topic map + every post file
//   node scripts/curva-posts.mjs --insert [--start YYYY-MM-DD] [--slugs a,b]
//                                                     upsert posts as drafts (idempotent, by slug)
//   node scripts/curva-posts.mjs --publish [--slugs a,b] [--dry-run]
//                                                     flip due drafts (published_at <= today) to published;
//                                                     with --slugs, publish those now (date moves to today)
//
// Reads SUPABASE_DB_URL from the env or .env. Facts live in the Curva repo (CURVA_SOURCES, default ../curva).
// See content/curva/README.md for the body format and the claim rules this enforces.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'content/curva')
const SRC = resolve(ROOT, process.env.CURVA_SOURCES || '../curva')
const PAGES_JS = join(ROOT, 'src/site/pages.js')

const args = process.argv.slice(2)
const flag = (f) => args.includes(f)
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined)
const onlySlugs = opt('--slugs')?.split(',').filter(Boolean)

/* ---------- rules ---------- */

export const TAGS = ['curva guides', 'curva concepts', 'curva use cases', 'curva vs jev', 'curva benchmarks', 'curva engineering']
const INTENTS = ['informational', 'how-to', 'comparison', 'troubleshooting', 'commercial']
const SERP = ['featured-snippet', 'how-to-steps', 'table', 'faq', 'code', 'none']
const DIAGRAMS = ['mermaid', 'svg', 'none']
// Allowed fact roots in the Curva repo: the Content Box and the public docs. Never source code or private notes.
const SOURCE_ROOTS = [/^Content Box\/(README\.md|[1-4] [^/]+\/|6 Blog\/|Jev reference\/)/, /^site\//, /^README\.md$/, /^CHANGELOG\.md$/, /^recipes\//, /^sdk\/(python|typescript)\/README\.md$/, /^integrations\/n8n-nodes-curva\/README\.md$/, /^docs\/(Guides|Product)\//, /^docs\/Curva\.md$/, /^evals\/RESULTS\.md$/]
const BANNED = [
  [/\bredis\b/i, 'says "Redis"'],
  [/\b(hipaa|soc ?2|gdpr|fedramp|iso ?27001|pci[- ]dss)\b/i, 'compliance name (no compliance claims)'],
  [/\b(revolutionary|game[- ]chang\w*|cutting[- ]edge|seamless\w*|unleash\w*|supercharg\w*|magic\w*|delve\w*|blazing\w*|effortless\w*|next[- ]gen|world[- ]class|robust|leverag\w*|simply)\b/i, 'hype word'],
  [/github\.com\/itsmohitrohilla\/curva(?!-docs)/i, 'links the private repo'],
  [/\b0\.136\b/, 'retracted number 0.136'],
  [/—/, 'em dash'],
]
const NUMBERS_NOT_FROM = /^(Content Box\/6 Blog\/|site\/benchmarks\.md$|evals\/RESULTS\.md$|docs\/)/
const SUPERLATIVE = /\b(best|fastest|most accurate|cheapest|#1|number one|leading)\b/i
// Third-party names a post may only mention when a source_check doc mentions them too.
const THIRD_PARTY = ['FastAPI', 'Django', 'Flask', 'Next.js', 'LangChain', 'LlamaIndex', 'LangGraph', 'CrewAI', 'Celery', 'pandas', 'Jupyter', 'pytest', 'Grafana', 'Kubernetes', 'Cloudflare', 'Vercel', 'Express', 'Zapier', 'Pipedream', 'Airflow', 'Dagster', 'Prefect', 'n8n', 'Postman', 'Insomnia', 'Power Automate', 'Retool', 'Airtable', 'Prometheus', 'Caddy', 'nginx', 'Ollama', 'vLLM', 'LM Studio', 'llama.cpp', 'OpenRouter', 'Groq', 'Gemini', 'Mistral', 'DeepSeek', 'Fireworks', 'xAI', 'Cursor', 'Claude Desktop', 'Claude Code', 'Deno', 'Bun', 'Docker']
const PUBLIC_URLS = ['https://itsmohitrohilla.github.io/curva-docs/', 'https://pypi.org/project/curva-ai/', 'https://www.npmjs.com/package/curva-ai', 'https://www.npmjs.com/package/n8n-nodes-curva', 'https://github.com/itsmohitrohilla/curva-docs', 'ghcr.io/itsmohitrohilla/curva']
const MERMAID = /^(flowchart|graph|sequenceDiagram|stateDiagram(-v2)?|classDiagram|pie|xychart-beta|quadrantChart|timeline|gantt)\b/
const WORDS = [900, 1800]

const STOP = new Set('a an and the to of in on for with your you is are how what why when it its vs not do does can from by as at or be this that use using llm llms curva'.split(' '))
const wordSet = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9.]+/).filter((w) => w.length > 1 && !STOP.has(w)))
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0
  let n = 0
  for (const w of a) if (b.has(w)) n++
  return n / (a.size + b.size - n)
}
// Mean best match of each heading of A among B's headings, averaged both ways.
const outlineSim = (A, B) => {
  const half = (x, y) => x.reduce((s, h) => s + Math.max(...y.map((g) => jaccard(h, g))), 0) / x.length
  return A.length && B.length ? (half(A, B) + half(B, A)) / 2 : 0
}
// Every number with a decimal, a %, or a value >= 10 must appear in the sources. "1,146" == "1146".
const numbers = (s) =>
  (String(s).replace(/(\d),(\d{3})\b/g, '$1$2').match(/\d+(?:\.\d+)?%?/g) || [])
    .filter((t) => t.includes('.') || t.endsWith('%') || Number(t) >= 10)
    .map((t) => String(Number(t.replace('%', ''))))
const numberSet = (text) => new Set((text.replace(/(\d),(\d{3})\b/g, '$1$2').match(/\d+(?:\.\d+)?/g) || []).map((t) => String(Number(t))))

/* ---------- loading ---------- */

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'))
const srcCache = new Map()
const source = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, existsSync(join(SRC, rel)) ? readFileSync(join(SRC, rel), 'utf8') : null)
  return srcCache.get(rel)
}
const refPath = (ref) => ref.replace(/:L\d+(-L\d+)?$/, '')

function loadEnv() {
  if (process.env.SUPABASE_DB_URL) return
  try { process.loadEnvFile(join(ROOT, '.env')) } catch {}
}

async function db() {
  loadEnv()
  if (!process.env.SUPABASE_DB_URL) return null
  const pg = (await import('pg')).default
  pg.types.setTypeParser(1082, (v) => v)
  // ponytail: encrypted but unverified, same as vite.config.js; pin Supabase's CA there and here together.
  const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  c.on('error', (e) => console.error(`database connection lost: ${e.message}`))
  await c.connect()
  return c
}

/* ---------- validation ---------- */

// Block kinds the renderer draws today, read from pages.js so this follows the blog redesign.
function rendererSupport() {
  const js = existsSync(PAGES_JS) ? readFileSync(PAGES_JS, 'utf8') : ''
  return { kinds: new Set([...js.matchAll(/case '(\w+)':/g)].map((m) => m[1])), links: /\\\]\\\(/.test(js) }
}

const KINDS = {
  p: { text: 'string' }, plain: { text: 'string' }, h2: { text: 'string' }, h3: { text: 'string' }, quote: { text: 'string' },
  code: { code: 'string', title: 'string' }, diagram: { chart: 'string' }, art: { svg: 'string' },
  bars: { title: 'string', series: 'array' }, venn: { left: 'string', right: 'string', leftItems: 'array', rightItems: 'array' },
  list: { items: 'array' }, table: { head: 'array', rows: 'array' }, callout: { text: 'string' },
}
const PROSE = (b) => [b.text, b.title, b.caption, b.items?.join('\n'), b.head?.join(' '), b.rows?.flat().join(' '), b.series?.map((s) => `${s.label} ${s.sub || ''} ${s.value}${b.unit || ''}`).join('\n')].filter(Boolean).join('\n')
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

function checkText(text, where, err, warn) {
  for (const [re, why] of BANNED) if (re.test(text)) err(`${where}: ${why} (${text.match(re)[0]})`)
  if (SUPERLATIVE.test(text)) warn(`${where}: superlative "${text.match(SUPERLATIVE)[0]}" (only for a measured win, with its source)`)
}

// The backlog gets the same checks (minus dates), and keywords must be unique across both files.
function validateMap(map, backlog, dbSlugs, err, warn) {
  const seen = new Map(), kw = new Map(), slugs = new Set(map.map((e) => e.slug)), all = [...map, ...backlog]
  const later = new Set(backlog.map((e) => e.slug))
  for (const e of all) {
    const inBacklog = later.has(e.slug)
    const at = `${inBacklog ? 'backlog' : 'map'} ${e.slug}`
    for (const f of ['slug', 'title', 'summary', 'tag', 'cluster', 'primary_keyword', 'search_intent', 'serp_feature', 'angle', 'why_it_can_rank', 'diagram', ...(inBacklog ? [] : ['published_at'])])
      if (typeof e[f] !== 'string' || !e[f]) err(`${at}: missing ${f}`)
    for (const f of ['keywords', 'outline', 'facts', 'source_check', 'related']) if (!Array.isArray(e[f])) err(`${at}: ${f} must be an array`)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.slug) || e.slug.length > 60) err(`${at}: bad slug`)
    if (seen.has(e.slug)) err(`${at}: duplicate slug`)
    seen.set(e.slug, e)
    if (dbSlugs.get(e.slug) && !dbSlugs.get(e.slug).startsWith('curva ')) err(`${at}: slug collides with an existing non-Curva post`)
    const k = e.primary_keyword?.toLowerCase().trim()
    if (kw.has(k)) err(`${at}: primary keyword "${k}" also used by ${kw.get(k)}`)
    kw.set(k, e.slug)
    if (k === 'curva vs jev') err(`${at}: "curva vs jev" belongs to /curva/vs-jev/`)
    if (e.indexable !== true) err(`${at}: every entry must be indexable (drop it instead)`)
    if (e.title?.length > 60) err(`${at}: title over 60 chars`)
    if (e.summary?.length > 155) err(`${at}: summary over 155 chars`)
    if (/[–—]/.test(e.title + e.summary)) err(`${at}: dash in title or summary`)
    checkText(`${e.title}\n${e.summary}`, at, err, err) // superlatives are errors in titles and summaries
    if (!TAGS.includes(e.tag)) err(`${at}: tag must be one of ${TAGS.join(', ')}`)
    if (!INTENTS.includes(e.search_intent)) err(`${at}: bad search_intent`)
    if (!SERP.includes(e.serp_feature)) err(`${at}: bad serp_feature`)
    if (!DIAGRAMS.includes(e.diagram)) err(`${at}: bad diagram`)
    if (!(e.outline?.length >= 4)) err(`${at}: outline needs 4+ headings`)
    if (!(e.related?.length >= 3 && e.related.length <= 5)) err(`${at}: related needs 3-5 slugs`)
    for (const r of e.related || []) if (!slugs.has(r) && !(inBacklog && later.has(r))) err(`${at}: related slug ${r} not in ${inBacklog ? 'map or backlog' : 'map'}`)
    if (!inBacklog && !/^\d{4}-\d{2}-\d{2}$/.test(e.published_at || '')) err(`${at}: published_at must be YYYY-MM-DD`)
    for (const ref of [...(e.facts || []), ...(e.source_check || []), ...(e.code_snippet_ref ? [e.code_snippet_ref] : []), ...(e.draft ? [e.draft] : [])]) {
      const p = refPath(ref)
      if (!SOURCE_ROOTS.some((re) => re.test(p))) err(`${at}: ${p} is not an allowed source`)
      else if (source(p) === null) err(`${at}: source ${p} not found under ${SRC}`)
    }
    if (!e.source_check?.length) err(`${at}: source_check is empty (no source, no topic)`)
  }
  // Near-duplicates: title, summary or outline structure too close to another entry.
  const prep = all.map((e) => ({ e, t: wordSet(e.title), s: wordSet(e.summary), o: (e.outline || []).map(wordSet) }))
  for (let i = 0; i < prep.length; i++)
    for (let j = i + 1; j < prep.length; j++) {
      const a = prep[i], b = prep[j]
      const t = jaccard(a.t, b.t), s = jaccard(a.s, b.s), o = outlineSim(a.o, b.o)
      if (t >= 0.6 || s >= 0.5 || o >= 0.5) err(`near-duplicate: ${a.e.slug} ~ ${b.e.slug} (title ${t.toFixed(2)}, summary ${s.toFixed(2)}, outline ${o.toFixed(2)})`)
    }
  return seen
}

function validatePost(post, entry, ctx, err, warn) {
  const at = `post ${post.slug}`
  if (!entry) return err(`${at}: not in topic-map.json`)
  for (const f of ['title', 'summary', 'tag']) if (post[f] !== entry[f]) err(`${at}: ${f} differs from the topic map`)
  if (!Array.isArray(post.body) || !post.body.length) return err(`${at}: empty body`)
  const sources = [...new Set([...(post.source_check || []), ...(entry.source_check || [])])]
  if (!(post.source_check?.length)) err(`${at}: source_check is empty`)
  const srcText = sources.map((p) => source(p) ?? (err(`${at}: source ${p} not found`), '')).join('\n')
  const quoteText = [...sources, ...(entry.code_snippet_ref ? [refPath(entry.code_snippet_ref)] : []), 'Content Box/6 Blog/fact-sheet.md', 'Content Box/2 How to use/code-snippets.md'].map((p) => source(p) || '').join('\n')
  // Benchmark numbers come only from benchmarks.md; secondary copies (fact sheet, drafts, the docs' older
  // benchmark page) don't count. Other numbers (limits, defaults) come from the post's own sources.
  const numberText = sources.filter((p) => !NUMBERS_NOT_FROM.test(p)).map((p) => source(p) || '').join('\n')
  const okNumbers = new Set([...ctx.benchNumbers, ...numberSet(numberText)])
  const okUrls = new Set([...PUBLIC_URLS, ...(srcText.match(/https?:\/\/[^\s)>"'`\]]+/g) || [])])

  let words = 0, h2 = 0
  const prose = [post.title, post.summary]
  post.body.forEach((b, i) => {
    const where = `${at} block ${i} (${b.kind})`
    const spec = KINDS[b.kind]
    if (!spec) return err(`${where}: unknown kind`)
    for (const [f, type] of Object.entries(spec))
      if (type === 'array' ? !Array.isArray(b[f]) || !b[f].length : typeof b[f] !== 'string' || !b[f].trim()) err(`${where}: needs ${f} (${type})`)
    if (b.kind === 'table' && b.rows?.some((r) => !Array.isArray(r) || r.length !== b.head.length)) err(`${where}: every row needs ${b.head.length} cells`)
    if (b.kind === 'diagram' && !MERMAID.test(b.chart?.trim() || '')) err(`${where}: chart must be mermaid (flowchart, sequenceDiagram, ...)`)
    if (b.kind === 'art' && !/^<svg[\s>][\s\S]*<\/svg>$/.test(b.svg?.trim() || '')) err(`${where}: art must be one inline <svg>`)
    if (b.kind === 'art' && /<script|on\w+=|javascript:/i.test(b.svg || '')) err(`${where}: no scripts or handlers in svg`)
    if (b.kind === 'h2') h2++
    if (!ctx.support.kinds.has(b.kind)) ctx.unsupported.add(b.kind)

    if (b.kind === 'code') {
      // Quoted code must be byte-exact from the sources; your own glue code says so with "original": true.
      if (!b.original && !quoteText.includes(b.code.trim())) err(`${where}: code is not byte-exact from a source (mark your own code "original": true)`)
      featureCheck(b.code, where, srcText, err, true)
      return
    }
    const text = PROSE(b)
    if (b.kind !== 'art' && b.kind !== 'diagram') words += text.split(/\s+/).filter(Boolean).length
    prose.push(text)
    checkText(text, where, err, warn)
    if (b.example) warn(`${where}: numbers not checked ("example": true); make sure the text says they are made up`)
    else for (const n of numbers(text.replace(/`[^`]*`/g, ''))) if (!okNumbers.has(n)) err(`${where}: number ${n} not found in benchmarks.md or the post's sources`)
    if (/\b\d+(\.\d+)?%|\bECE\b|\bp50\b/.test(text) && /\b(win|beats?|ahead)\b/i.test(text) && !b.numbers) warn(`${where}: benchmark claim without "numbers": true (refresh marker)`)
    for (const m of (b.text || '').matchAll(/`([^`]+)`/g)) featureCheck(m[1], where, srcText, err, false)
    for (const [, , href] of text.matchAll(LINK)) {
      ctx.hasLinks = true
      const blog = href.match(/^\/blog\/([a-z0-9-]+)\/$/)
      if (blog ? !(ctx.mapSlugs.has(blog[1]) || ctx.dbSlugs.has(blog[1])) : href.startsWith('/') ? !/^\/(curva|curva\/vs-jev|blog|about|products)\/$/.test(href) : ![...okUrls].some((u) => href.startsWith(u)))
        err(`${where}: link target not allowed or unknown: ${href}`)
    }
    for (const name of THIRD_PARTY)
      if (new RegExp(`(?<![\\w.])${name.replace(/[.]/g, '\\.')}(?![\\w])`).test(text) && !srcText.includes(name)) err(`${where}: mentions ${name}, which no source_check doc mentions`)
  })

  const all = prose.join('\n')
  if (post.body[0].kind !== 'p') err(`${at}: must open with a "p" that answers the query`)
  const first100 = post.body.filter((b) => b.kind === 'p' || b.kind === 'plain').map((b) => b.text).join(' ').split(/\s+/).slice(0, 100).join(' ')
  const kwHit = (s) => [...wordSet(entry.primary_keyword)].every((w) => wordSet(s).has(w))
  if (!kwHit(first100)) err(`${at}: primary keyword "${entry.primary_keyword}" not in the first 100 words`)
  if (!kwHit(post.title)) warn(`${at}: primary keyword not fully in the title`)
  if (!post.body.some((b) => b.kind === 'h2' && kwHit(b.text))) warn(`${at}: no H2 carries the primary keyword`)
  if (h2 < 3) err(`${at}: needs 3+ h2 sections`)
  if (words < WORDS[0] || words > WORDS[1]) err(`${at}: ${words} words (want ${WORDS[0]}-${WORDS[1]}, prose only)`)
  if (/[–—]/.test(post.title + post.summary)) err(`${at}: dash in title or summary`)
  if (!/https:\/\/itsmohitrohilla\.github\.io\/curva-docs\//.test(all)) warn(`${at}: no docs link`)
  return { words, shingles: shingles(all) }
}

// Commands, flags, env vars, endpoints and identifiers must exist in the post's source_check docs.
function featureCheck(code, where, srcText, err, block) {
  const tokens = new Set()
  if (!block && !/\s/.test(code) && !/^[\d.%$,]+$/.test(code)) tokens.add(code)
  for (const re of [/--[a-z][a-z-]+/g, /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g, /\/v\d\/[a-z_]+/g, /\bcurva [a-z][a-z-]+/g, /@[a-z]+\//g, /\bcurva\.(\w+)/g, /\b(?:client|curva|AsyncCurva|Curva)\.(\w+)\(/g, /from curva(?:\.\w+)? import ([\w, ]+)/g])
    for (const m of code.matchAll(re)) for (const t of (m[1] ?? m[0]).split(/,\s*/)) tokens.add(t.trim())
  for (const t of tokens) if (t && !srcText.includes(t)) err(`${where}: \`${t}\` not found in the post's source_check docs (ship-today rule)`)
}

const shingles = (s) => {
  const w = s.toLowerCase().split(/\W+/).filter(Boolean), out = new Set()
  for (let i = 0; i + 5 <= w.length; i++) out.add(w.slice(i, i + 5).join(' '))
  return out
}

async function validate(client) {
  const errors = [], warnings = []
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m)
  const map = readJSON(join(CONTENT, 'topic-map.json'))
  const dbSlugs = new Map()
  if (client) for (const r of (await client.query('select slug, tag from posts')).rows) dbSlugs.set(r.slug, r.tag)
  else warn('SUPABASE_DB_URL not set: slug collisions with existing posts were not checked')
  if (!existsSync(join(SRC, 'Content Box'))) throw new Error(`Curva sources not found at ${SRC} (set CURVA_SOURCES)`)
  const backlogFile = join(CONTENT, 'backlog.json')
  const backlog = existsSync(backlogFile) ? readJSON(backlogFile) : []
  const bySlug = validateMap(map, backlog, dbSlugs, err, warn)
  for (const e of backlog) bySlug.delete(e.slug) // posts are written only for topics in the map

  const benchNumbers = numberSet(source('Content Box/4 Benchmarks/benchmarks.md'))
  const ctx = { benchNumbers, support: rendererSupport(), unsupported: new Set(), hasLinks: false, mapSlugs: new Set(bySlug.keys()), dbSlugs }
  const dir = join(CONTENT, 'posts')
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []
  const posts = []
  for (const f of files) {
    const post = readJSON(join(dir, f))
    if (`${post.slug}.json` !== f) err(`posts/${f}: file name must be <slug>.json`)
    const r = validatePost(post, bySlug.get(post.slug), ctx, err, warn)
    if (r) posts.push({ post, entry: bySlug.get(post.slug), ...r })
  }
  for (let i = 0; i < posts.length; i++)
    for (let j = i + 1; j < posts.length; j++) {
      const s = jaccard(posts[i].shingles, posts[j].shingles)
      if (s >= 0.3) err(`near-duplicate bodies: ${posts[i].post.slug} ~ ${posts[j].post.slug} (${s.toFixed(2)} shared 5-word phrases)`)
    }
  const gaps = [...ctx.unsupported, ...(ctx.hasLinks && !ctx.support.links ? ['inline [text](/link/)'] : [])]
  if (gaps.length) warn(`renderer gap: src/site/pages.js does not draw ${gaps.join(', ')} yet; --insert refuses until it does (or pass --force)`)

  for (const w of warnings) console.warn(`warn  ${w}`)
  for (const e of errors) console.error(`error ${e}`)
  console.log(`${map.length} topics (+${backlog.length} in backlog), ${posts.length} posts (${posts.map((p) => `${p.post.slug} ${p.words}w`).join(', ') || 'none'}): ${errors.length} errors, ${warnings.length} warnings`)
  return { errors, posts, gaps }
}

/* ---------- database writes ---------- */

const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)

async function insert(client, posts) {
  const start = opt('--start')
  const first = posts.map((p) => p.entry.published_at).sort()[0]
  const shift = start ? Math.round((Date.parse(start) - Date.parse(first)) / 864e5) : 0
  let n = 0
  await client.query('begin')
  try {
    for (const { post, entry, words } of posts) {
      if (onlySlugs && !onlySlugs.includes(post.slug)) continue
      const keywords = [...new Set([entry.primary_keyword, ...entry.keywords])]
      // Upsert by slug; never touches a non-Curva post and never changes status (publishing is --publish).
      const r = await client.query(
        `insert into posts (slug, title, summary, tag, body, keywords, read_minutes, status, published_at)
         values ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
         on conflict (slug) do update set title = excluded.title, summary = excluded.summary, tag = excluded.tag,
           body = excluded.body, keywords = excluded.keywords, read_minutes = excluded.read_minutes,
           published_at = case when posts.status = 'draft' then excluded.published_at else posts.published_at end
         where posts.tag like 'curva %'`,
        [post.slug, post.title, post.summary, post.tag, JSON.stringify(post.body), keywords, Math.max(1, Math.ceil(words / 220)), addDays(entry.published_at, shift)],
      )
      n += r.rowCount
    }
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  }
  console.log(`upserted ${n} Curva posts as drafts${shift ? ` (dates shifted ${shift} days to start ${start})` : ''}`)
}

async function publish(client) {
  const today = new Date().toISOString().slice(0, 10)
  const sql = onlySlugs
    ? [`update posts set status = 'published', published_at = least(published_at, $2::date) where tag like 'curva %' and status = 'draft' and slug = any($1) returning slug`, [onlySlugs, today]]
    : [`update posts set status = 'published' where tag like 'curva %' and status = 'draft' and published_at <= $1::date returning slug`, [today]]
  await client.query('begin')
  const { rows } = await client.query(...sql)
  await client.query(flag('--dry-run') ? 'rollback' : 'commit')
  if (flag('--dry-run')) return console.log(`would publish ${rows.length}: ${rows.map((r) => r.slug).join(', ') || 'none due'}`)
  console.log(`published ${rows.length}: ${rows.map((r) => r.slug).join(', ') || 'none due'}. Rebuild the site so they go live.`)
}

/* ---------- main ---------- */

async function main() {
  const client = await db().catch((e) => {
    throw new Error(`could not connect to the database: ${e.message}`)
  })
  try {
    if (flag('--publish')) {
      if (!client) throw new Error('SUPABASE_DB_URL is not set')
      return await publish(client)
    }
    const { errors, posts, gaps } = await validate(client)
    if (errors.length) process.exitCode = 1
    if (!flag('--insert')) return
    // With --slugs, only errors in the chosen posts (or map-wide errors) block; a writer's half-finished
    // draft elsewhere in posts/ shouldn't hold back the posts that already pass.
    const ours = (e) => !e.startsWith('post ') || !onlySlugs || onlySlugs.some((s) => e.startsWith(`post ${s} `) || e.startsWith(`post ${s}:`))
    if (errors.some(ours)) throw new Error('fix the errors above before --insert')
    if (gaps.length && !flag('--force')) throw new Error(`renderer cannot draw ${gaps.join(', ')} yet`)
    if (!client) throw new Error('SUPABASE_DB_URL is not set')
    await insert(client, posts)
  } finally {
    await client?.end()
  }
}

main().catch((e) => {
  // Messages only: never the connection string.
  console.error(String(e.message || e).replace(/postgres(ql)?:\/\/\S+/g, '[db url]'))
  process.exitCode = 1
})
