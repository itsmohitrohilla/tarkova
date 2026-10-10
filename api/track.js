// POST /api/track: counts page views, clicks and time on the page for the owner's dashboard (api/admin.js). Sent
// as a beacon by src/paint.js. A Vercel function in production; vite.config.js mounts the same handler in dev.
// It stores the event's name, the page's path and, for a click, the words on what was clicked or, for time, the
// seconds. Nothing about the visitor: no IP address, no cookie, no id.
// The Crowkis site keeps its events in the same table; ours carry the 'tarkova_' prefix, so the two sites'
// numbers never mix.
import pg from 'pg'

// Each event we take, and what its `meta` must be: null for none, undefined for "refuse this".
const EVENTS = {
  page_view: () => null,
  demo_click: () => null,
  click: (m) => (typeof m === 'string' ? m.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60) || undefined : undefined),
  time: (m) => (typeof m === 'string' && /^\d{1,4}$/.test(m) && m >= 1 && m <= 1800 ? String(Number(m)) : undefined),
}
const NAMES = Object.keys(EVENTS).map((name) => `tarkova_${name}`)
const SITE_HOUR = 5000 // events an hour, in all; far above real traffic, and the most a flood can add to the table
const PATH = /^\/[\w\-./~%]{0,199}$/
const MAX_BODY = 2000

// ponytail: in memory, so per server instance and reset on redeploy, as on the Crowkis site. It slows one visitor;
// SITE_HOUR is what bounds the table. Each attempt still opens a database connection: Vercel's firewall rate
// limit is what stops a flood before that (see TODO.md).
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  if (recent.length >= 120) return true
  hits.set(ip, [...recent, now])
  return false
}

// A beacon arrives as text/plain: Vercel hands that over as a string, dev as a stream.
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body
  let raw = typeof req.body === 'string' ? req.body : ''
  if (req.body === undefined) for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY) throw new Error('body too large')
  }
  if (raw.length > MAX_BODY) throw new Error('body too large')
  return JSON.parse(raw)
}

export const track = (dbUrl) => async (req, res) => {
  const done = (status, headers = {}) => { res.writeHead(status, { 'Cache-Control': 'no-store', ...headers }); res.end() }
  if (req.method !== 'POST') return done(405, { Allow: 'POST' })
  let origin
  try { origin = new URL(req.headers.origin).host } catch {}
  if (!origin || origin !== req.headers.host) return done(403) // from our own pages only
  let data
  try { data = await body(req) } catch { return done(400) }
  if (!data || !Object.hasOwn(EVENTS, data.name) || typeof data.path !== 'string' || !PATH.test(data.path)) return done(400)
  const meta = EVENTS[data.name](data.meta)
  if (meta === undefined) return done(400)
  // Best-effort counting from here on: a dropped event must never show as an error in the visitor's console.
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
  if (limited(ip)) return done(204)

  // ponytail: encrypted but unverified, as in api/contact.js; pin Supabase's CA cert to verify the server too.
  const db = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000, statement_timeout: 8000 })
  db.on('error', () => {})
  try {
    await db.connect()
    // One statement, so the hourly cap cannot be raced past by more than the requests in flight.
    await db.query(
      `insert into events (name, path, meta)
       select $1, $2, $3
        where (select count(*) from events where name = any($4) and created_at > now() - interval '1 hour') < $5`,
      [`tarkova_${data.name}`, data.path, meta, NAMES, SITE_HOUR],
    )
  } catch (e) {
    console.error(`track: ${e.message}`)
  } finally {
    await db.end().catch(() => {})
  }
  done(204)
}

export default track(process.env.SUPABASE_DB_URL)
