#!/usr/bin/env node
// Crowkis guides: validate the files in content/crowkis/posts/, and write them over the posts they replace.
//
//   node --env-file=.env scripts/crowkis-posts.mjs [--slugs a,b]            validate
//   node --env-file=.env scripts/crowkis-posts.mjs --apply [--slugs a,b]    validate, then update title, summary, body
//
// Each guide takes over an existing post's URL (content/crowkis/pillars.json says which, and which short posts it
// absorbs). Facts come from the Crowkis repo (CROWKIS_SOURCES, default ../crowkis); see content/crowkis/README.md.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'content/crowkis')
const SRC = resolve(ROOT, process.env.CROWKIS_SOURCES || '../crowkis')
const args = process.argv.slice(2)
const only = args.includes('--slugs') ? args[args.indexOf('--slugs') + 1].split(',') : null
const { pillars, citeHosts } = JSON.parse(readFileSync(join(DIR, 'pillars.json'), 'utf8'))

const WORDS = [1100, 2400]
// The owner's rules for site copy, plus the claims this site does not make.
const BANNED = [
  [/\bredis\b/i, 'the word "Redis" (say drop-in, RESP3, your existing clients)'],
  [/hipaa|soc ?2\b|fedramp|\bgdpr\b|iso ?27001|complian|certifi/i, 'a certification or compliance claim'],
  [/[—–]/, 'an em or en dash'],
  [/\d\s?%[^.]{0,60}\b(sav|cost|cheaper|bill|spend)|\b(sav|cut|reduc)\w*[^.]{0,60}\d\s?%/i, 'a savings percentage (say it saves cost; no figure)'],
  [/\b(best|fastest|cheapest|#1|number one|world.class|leading|revolutionary|game.chang)/i, 'a superlative'],
]
// Block kinds the renderer draws, read from pages.js so this follows it.
const KINDS = new Set([...readFileSync(join(ROOT, 'src/site/pages.js'), 'utf8').matchAll(/case '([a-z0-9]+)':/g)].map((m) => m[1]))
const UNREAD = new Set(['kind', 'chart', 'svg', 'unit', 'code'])
const strings = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => (UNREAD.has(k) ? [] : strings(x))) : [])
const LINK = /\[([^\]]+)\]\(([^)\s`]+)\)/g
const norm = (s) => s.toLowerCase().replace(/[,\s]+/g, ' ')

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
const live = new Map((await db.query(`select slug, tag from posts where status = 'published'`)).rows.map((r) => [r.slug, r.tag]))

let failed = 0
const files = readdirSync(join(DIR, 'posts')).filter((f) => f.endsWith('.json')).filter((f) => !only || only.includes(f.replace('.json', '')))
const ok = []
for (const f of files) {
  const errs = [], warn = []
  let post
  try { post = JSON.parse(readFileSync(join(DIR, 'posts', f), 'utf8')) } catch (e) { console.log(`✗ ${f}: not valid JSON (${e.message})`); failed++; continue }
  const pillar = pillars.find((p) => p.slug === post.slug)
  if (!pillar || f !== `${post.slug}.json`) errs.push('slug is not a pillar in pillars.json, or the file name differs from it')
  if (!live.has(post.slug) || live.get(post.slug)?.startsWith('curva')) errs.push('no published Crowkis post has this slug')
  if (!post.title || post.title.length > 60) errs.push(`title is ${post.title?.length ?? 0} characters (1 to 60)`)
  if (!post.summary || post.summary.length < 110 || post.summary.length > 155) errs.push(`summary is ${post.summary?.length ?? 0} characters (110 to 155)`)
  if (!Array.isArray(post.keywords) || post.keywords.length < 3) errs.push('keywords: at least 3')
  if (!Array.isArray(post.sources) || !post.sources.length) errs.push('sources: list the Crowkis repo files the facts come from')
  const body = Array.isArray(post.body) ? post.body : []
  for (const b of body) if (!KINDS.has(b.kind)) errs.push(`block kind "${b.kind}" is not drawn by the renderer`)
  if (body[0]?.kind !== 'p') errs.push('the first block must be a paragraph that answers the query directly')
  if (body.filter((b) => b.kind === 'h2').length < 4) errs.push('fewer than 4 h2 sections')
  const prose = strings({ t: post.title, s: post.summary, body })
  const words = prose.join(' ').split(/\s+/).filter(Boolean).length
  if (words < WORDS[0] || words > WORDS[1]) errs.push(`${words} words (${WORDS[0]} to ${WORDS[1]})`)
  for (const [re, what] of BANNED) { const hit = prose.find((t) => re.test(t)); if (hit) errs.push(`${what}: "${hit.match(re)[0]}" in "${hit.slice(Math.max(0, hit.search(re) - 40), hit.search(re) + 50)}"`) }

  // Links: site links must point at live posts; outside links must be on an approved host and answer.
  const links = prose.flatMap((t) => [...t.matchAll(LINK)].map((m) => m[2]))
  const inner = links.filter((h) => h.startsWith('/')), outer = links.filter((h) => !h.startsWith('/'))
  for (const h of inner) { const s = h.match(/^\/blog\/([a-z0-9-]+)\/$/)?.[1]; if (h.startsWith('/blog/') && !h.startsWith('/blog/topic/') && !live.has(s)) errs.push(`links to ${h}, which is not a live post`) }
  if (new Set(inner).size < 4) errs.push(`${new Set(inner).size} site links (at least 4)`)
  if (new Set(outer).size < 3) errs.push(`${new Set(outer).size} outside sources (at least 3)`)
  for (const h of new Set(outer)) {
    let host; try { host = new URL(h).host } catch { errs.push(`bad link ${h}`); continue }
    if (!h.startsWith('https://') || !citeHosts.includes(host)) { errs.push(`outside link host not approved: ${host} (ask for it to be added to citeHosts)`); continue }
    const status = await fetch(h, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (link check)' }, signal: AbortSignal.timeout(15000) }).then((r) => r.status, () => 0)
    if (status === 404 || status === 410 || status === 0) errs.push(`outside link does not answer (${status}): ${h}`)
    else if (status >= 400) warn.push(`outside link answered ${status} (may block scripts): ${h}`)
  }

  // Numbers with a unit must be in the listed source files, or sit in a block that cites an outside source.
  const srcText = norm((post.sources || []).map((s) => { const p = s.startsWith('tarkova:') ? join(ROOT, s.slice(8)) : join(SRC, s); if (!existsSync(p)) { errs.push(`source file not found: ${s}`); return '' } return readFileSync(p, 'utf8') }).join('\n'))
  for (const t of prose) {
    if (/\]\(https:\/\//.test(t)) continue
    for (const m of t.matchAll(/\b\d[\d,.]*\s?(?:%|ms|µs|us|x\b|×|GB|MB|KB|k\b|M\b|million|billion|QPS|ops\/s|rps)/g)) {
      const n = norm(m[0]), bare = n.replace(/\s/g, '')
      if (!srcText.includes(n) && !srcText.replace(/\s/g, '').includes(bare)) errs.push(`number "${m[0]}" is not in the listed sources: "${t.slice(Math.max(0, m.index - 50), m.index + 40)}"`)
    }
  }

  if (errs.length) { failed++; console.log(`✗ ${post.slug ?? f}\n${errs.map((e) => `    - ${e}`).join('\n')}`) }
  else { ok.push(post); console.log(`✓ ${post.slug} (${words} words, ${new Set(inner).size} site links, ${new Set(outer).size} outside sources)`) }
  for (const w of warn) console.log(`    ! ${w}`)
}

if (args.includes('--apply')) {
  if (failed) console.log(`\nNot applied: ${failed} file(s) failed.`)
  else for (const p of ok) {
    const r = await db.query(`update posts set title = $2, summary = $3, body = $4, keywords = $5, updated_at = now() where slug = $1 and tag not like 'curva %'`, [p.slug, p.title, p.summary, JSON.stringify(p.body), p.keywords])
    console.log(`${r.rowCount ? 'updated' : 'NOT FOUND'} ${p.slug}`)
  }
}
await db.end()
console.log(`\n${ok.length} of ${files.length} valid`)
process.exit(failed ? 1 : 0)
