// POST /api/contact: the "write to us" form (src/site/book.js). Saves to the `feedback` table with source
// 'contact'. A Vercel function in production; vite.config.js mounts the same handler in dev. Plain Node
// request/response only, so both run this exact code. The database URL stays on the server.
//
// What stands between the open internet and the table, in order:
//   1. POST with a JSON body only, from our own pages only (Origin must match Host). A form on another site
//      cannot post here: browsers will not send cross-site JSON without CORS headers, and we send none.
//   2. A small body (8 KB), then every field checked for type, length and shape.
//   3. A honeypot field people never see.
//   4. Rate limits per visitor and for the whole site (LIMITS), counted in the database inside one
//      transaction, so parallel requests cannot slip past.
//   5. Values reach SQL only as parameters, never as text.
// The message is stored, not shown on the site; anything that displays it later must escape it.
import pg from 'pg'
import { createHmac } from 'node:crypto'

const MAX_BODY = 8 * 1024
const LIMITS = { minute: 1, day: 5, siteHour: 60 } // one message a minute and five a day per visitor; 60 an hour in all
const FIELDS = { name: 120, email: 200, message: 4000 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Control characters out (they have no place in a name or a message, and newlines in name/email are how
// header injection starts if this is ever emailed); the message keeps its line breaks and tabs.
const clean = (v, max, multiline) => (typeof v === 'string' ? v.replace(multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '')

// Who is asking, for the rate limit. On Vercel x-forwarded-for is set by the platform and cannot be forged;
// behind any other proxy, make sure it overwrites the header too. IPv6 visitors are counted by network
// (the first four groups), because one visitor owns a whole /64 of addresses.
// ponytail: a compressed address (2001:db8::1) is not expanded first; fine for real visitors, whose addresses are full length.
function visitor(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().replace(/^::ffff:/, '')
  return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip
}

async function body(req) {
  if (req.body !== undefined) return req.body // Vercel has parsed it already
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY) throw new Error('body too large')
  }
  return JSON.parse(raw)
}

// Takes the visitor's turn, or says how long to wait. `key` is a keyed hash of the address, so the table
// never holds an IP; rows older than a day are dropped as we go.
async function save(db, key, { name, email, message }) {
  await db.query('begin')
  try {
    await db.query('select pg_advisory_xact_lock(hashtext($1))', [key]) // one request per visitor at a time
    await db.query(`delete from contact_rate where created_at < now() - interval '1 day'`)
    const { rows: [n] } = await db.query(
      `select count(*) filter (where key = $1 and created_at > now() - interval '1 minute')::int as minute,
              count(*) filter (where key = $1)::int as day,
              count(*) filter (where created_at > now() - interval '1 hour')::int as site_hour
         from contact_rate`,
      [key],
    )
    const wait = n.minute >= LIMITS.minute ? 60 : n.day >= LIMITS.day ? 86400 : n.site_hour >= LIMITS.siteHour ? 3600 : 0
    if (wait) {
      await db.query('rollback')
      return wait
    }
    await db.query('insert into contact_rate (key) values ($1)', [key])
    await db.query(`insert into feedback (name, email, message, source) values ($1, $2, $3, 'contact')`, [name, email, message])
    await db.query('commit')
    return 0
  } catch (e) {
    await db.query('rollback').catch(() => {})
    throw e
  }
}

export const contact = (dbUrl) => async (req, res) => {
  const reply = (status, out, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers })
    res.end(JSON.stringify(out))
  }
  const h = req.headers
  if (req.method !== 'POST') return reply(405, { error: 'POST only.' }, { Allow: 'POST' })
  if (!String(h['content-type']).startsWith('application/json')) return reply(415, { error: 'Send JSON.' })
  let origin
  try { origin = new URL(h.origin).host } catch {}
  if (!origin || origin !== h.host) return reply(403, { error: 'Not allowed from here.' })
  if (Number(h['content-length']) > MAX_BODY) return reply(413, { error: 'That message is too long.' })

  let data
  try { data = await body(req) } catch { return reply(400, { error: 'That did not arrive in one piece. Please try again.' }) }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { error: 'That did not arrive in one piece. Please try again.' })
  if (clean(data.company, 1)) return reply(200, { ok: true }) // honeypot: bots fill it, and are told all went well

  const msg = { name: clean(data.name, FIELDS.name), email: clean(data.email, FIELDS.email), message: clean(data.message, FIELDS.message, true) }
  if (!msg.name || !msg.message || !EMAIL.test(msg.email)) return reply(400, { error: 'Please give your name, a valid email and a message.' })

  // ponytail: encrypted but unverified, as in vite.config.js; pin Supabase's CA cert to verify the server too.
  const db = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000, statement_timeout: 8000 })
  db.on('error', () => {}) // a dropped connection also fails the query below, which is handled
  try {
    await db.connect()
    const wait = await save(db, createHmac('sha256', dbUrl).update(visitor(req)).digest('hex'), msg)
    if (!wait) return reply(200, { ok: true })
    reply(429, { error: wait === 60 ? 'One message a minute, please. Try again shortly.' : 'That is a lot of messages. Please try again later.' }, { 'Retry-After': String(wait) })
  } catch (e) {
    console.error(`contact: ${e.message}`) // the reason stays in the server log
    reply(500, { error: 'That did not send. Please try again.' })
  } finally {
    await db.end().catch(() => {})
  }
}

export default contact(process.env.SUPABASE_DB_URL)
