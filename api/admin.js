// GET/POST /admin/<ADMIN_KEY>/: the owner's dashboard. Tarkova and Crowkis share one database, so this one page
// shows both: messages from every form, the blog, and the Crowkis site's page views, clicks and ratings.
// A Vercel function in production (vercel.json rewrites /admin/<key>/ here); vite.config.js mounts the same
// handler in dev. Read-only: it never writes to the database.
//
// What stands between the open internet and the data, in order:
//   1. The secret path segment (ADMIN_KEY). A wrong one gets a plain 404 before anything else runs.
//   2. A signed-in session (ADMIN_USER / ADMIN_PASSWORD), kept in a signed, HttpOnly cookie. All three live in
//      env vars only. Sign-in is a same-origin POST, five tries per ten minutes per visitor.
//   3. Everything from the database is escaped on the way into the page, and the page allows no scripts at all.
import pg from 'pg'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const TZ = 'Asia/Kolkata'
const COOKIE = 'tarkova_admin'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/* ---------- access ---------- */

const digest = (s) => createHash('sha256').update(s).digest()
// Hash both sides so the buffers are always equal length and the length is not leaked.
const same = (a, b) => timingSafeEqual(digest(a), digest(b))
const keyOk = (env, key) => (env.ADMIN_KEY || '').length >= 16 && same(key, env.ADMIN_KEY)

function loginOk(env, user, password) {
  const u = env.ADMIN_USER || '', p = env.ADMIN_PASSWORD || ''
  if (!u || p.length < 16) return false
  const userOk = same(user, u), passOk = same(password, p) // always compare both, no early exit
  return userOk && passOk
}

// Signed with a key derived from the password, so changing the password signs everyone out.
const sign = (env, exp) => createHmac('sha256', digest(`${env.ADMIN_PASSWORD}:${env.ADMIN_KEY}`)).update(exp).digest('hex')

function signedIn(env, req) {
  if ((env.ADMIN_PASSWORD || '').length < 16) return false
  const [exp, mac] = (String(req.headers.cookie || '').match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))?.[1] || '').split('.')
  return Boolean(exp && mac) && Number(exp) > Date.now() && same(mac, sign(env, exp))
}

// ponytail: in memory, so per server instance and reset on redeploy, as on the Crowkis site. The 16+ character
// password is the real defence; count in the database (like contact_rate) if sign-in abuse ever shows up.
const tries = new Map()
function locked(ip) {
  const now = Date.now()
  const recent = (tries.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  if (recent.length >= 5) return true
  tries.set(ip, [...recent, now])
  return false
}

async function form(req) {
  if (req.body && typeof req.body === 'object') return req.body // Vercel has parsed it already
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 4096) throw new Error('body too large')
  }
  return Object.fromEntries(new URLSearchParams(raw))
}

/* ---------- data ---------- */

// The periods the dashboard can show, all ending today. `step` is what one column of a chart covers.
// The SQL below fixes each period's first day; buckets() cuts it into columns.
const RANGES = [
  { key: '1w', label: '1W', name: 'Past week', step: 'day' },
  { key: '1m', label: '1M', name: 'Past month', step: 'day' },
  { key: '3m', label: '3M', name: 'Past 3 months', step: 'week' },
  { key: '6m', label: '6M', name: 'Past 6 months', step: 'week' },
  { key: '1y', label: '1Y', name: 'Past year', step: 'month' },
  { key: '5y', label: '5Y', name: 'Past 5 years', step: 'quarter' },
]
const DEFAULT_RANGE = '1m'

// A top-N list of events for each site and period at once: { 'tarkova:1w': [{ label, n }], 'crowkis:1w': [...], ... }.
const TIMED = `name = 'time' and meta ~ '^[0-9]{1,4}$'` // a time event whose seconds are really a number
const ranked = (label, where, limit, measure = 'count(*)') => `(select json_object_agg(s.site || ':' || r.key, (select coalesce(json_agg(t), '[]') from (
     select ${label} as label, (${measure})::int as n
       from ev where site = s.site and ${where} and day >= r.since group by 1 order by n desc, 1 limit ${limit}) t))
     from sites s cross join ranges r)`

// ponytail: everything in one statement, because each round-trip to the database costs about 0.4s.
// Split it up if it gets unwieldy.
const SQL = `
with today as (select (now() at time zone $1::text)::date as d),
ranges (key, since) as (
  select '1w', d - 6 from today union all
  select '1m', d - 29 from today union all
  select '3m', d - 90 from today union all   -- 13 weeks
  select '6m', d - 181 from today union all  -- 26 weeks
  select '1y', (date_trunc('month', d) - interval '11 months')::date from today union all
  select '5y', (date_trunc('quarter', d) - interval '57 months')::date from today  -- 20 quarters
),
sites (site) as (values ('tarkova'), ('crowkis')),
ev as (
  -- Tarkova's events carry the 'tarkova_' prefix (api/track.js); every other event is the Crowkis site's.
  select case when left(name, 8) = 'tarkova_' then 'tarkova' else 'crowkis' end as site,
         case when left(name, 8) = 'tarkova_' then substr(name, 9) else name end as name,
         path, meta, (created_at at time zone $1::text)::date as day,
         extract(hour from created_at at time zone $1::text)::int as hour
    from events
   where created_at >= now() - interval '62 months'
)
select
  (select d::text from today) as today,
  (select json_object_agg(key, since) from ranges) as since,
  -- one row per site and local day that had any event; days without are filled in as zeros when drawn
  (select coalesce(json_agg(t), '[]') from (
     select site, day,
            (count(*) filter (where name = 'page_view'))::int as views,
            (count(*) filter (where name = 'page_view' and path ~ '^/blog/[^/]+/$'))::int as reads,
            (count(*) filter (where name = 'click'))::int as clicks,
            (count(*) filter (where ${TIMED}))::int as stays,
            coalesce(sum(case when ${TIMED} then meta::int end), 0)::int as secs,
            (count(*) filter (where name = 'demo_click'))::int as demos,
            (count(*) filter (where name = 'arcade_play'))::int as plays,
            (count(*) filter (where name = 'code_copy'))::int as copies
       from ev where day >= (select since from ranges where key = '5y') group by site, day order by day) t) as daily,
  ${ranked(`coalesce(path, '(unknown)')`, `name = 'page_view'`, 12)} as pages,
  ${ranked('path', `name = 'page_view' and path ~ '^/blog/[^/]+/$'`, 10)} as reads,
  ${ranked(`'/' || split_part(coalesce(path, ''), '/', 2)`, `name = 'page_view'`, 8)} as areas,
  ${ranked('hour', `name = 'page_view'`, 24)} as hours,
  ${ranked('meta', `name = 'click' and meta is not null`, 12)} as clicked,
  ${ranked(`coalesce(path, '(unknown)')`, TIMED, 10, 'round(avg(meta::int))')} as dwell,
  (select json_object_agg(s.site || ':' || r.key, (
     select count(distinct path)::int from ev where site = s.site and name = 'page_view' and day >= r.since))
     from sites s cross join ranges r) as breadth,
  ${ranked('meta', `name = 'code_copy' and meta is not null`, 8)} as snippets,
  ${ranked(`coalesce(meta, path, '(unknown)')`, `name = 'demo_click'`, 12)} as buttons,
  (select coalesce(json_agg(t), '[]') from (
     select published_at as day, count(*)::int as n
       from posts where status = 'published' and published_at >= (select since from ranges where key = '5y')
      group by 1 order by 1) t) as posted,
  (select coalesce(json_agg(t), '[]') from (
     select (updated_at at time zone $1::text)::date as day, count(*)::int as n from posts group by 1) t) as revised,
  (select coalesce(json_agg(t), '[]') from (
     select read_minutes as label, count(*)::int as n from posts where read_minutes is not null group by 1 order by 1) t) as lengths,
  (select coalesce(json_agg(t), '[]') from (
     select title, tag, published_at, read_minutes
       from posts where status = 'published' and published_at is not null order by published_at desc, id desc limit 6) t) as newest,
  (select coalesce(json_agg(t), '[]') from (
     select (created_at at time zone $1::text)::date as day, source, count(*)::int as n
       from feedback group by 1, 2) t) as inflow,
  (select count(distinct lower(btrim(email)))::int from feedback where btrim(coalesce(email, '')) <> '') as senders,
  (select coalesce(json_agg(t), '[]') from (
     select id, name, email, message, source, created_at
       from feedback order by created_at desc limit 100) t) as messages,
  (select coalesce(json_agg(t), '[]') from (
     select stars, count(*)::int as n from ratings group by stars) t) as stars,
  (select coalesce(json_agg(t), '[]') from (
     select (created_at at time zone $1::text)::date as day, count(*)::int as n, sum(stars)::int as total,
            (count(*) filter (where stars = 5))::int as five
       from ratings group by 1) t) as rated,
  (select count(*)::int from ratings where btrim(coalesce(comment, '')) <> '') as commented,
  (select coalesce(json_agg(t), '[]') from (
     select id, stars, comment, created_at
       from ratings order by created_at desc limit 50) t) as ratings,
  (select json_build_object('total', count(*)::int,
                            'published', (count(*) filter (where status = 'published'))::int,
                            'curva', (count(*) filter (where tag ~ '^curva'))::int,
                            'minutes', round(avg(read_minutes), 1),
                            'hours', coalesce(round(sum(read_minutes) / 60.0), 0)::int,
                            'edited', max(updated_at))
     from posts) as blog,
  (select coalesce(json_agg(t), '[]') from (
     select tag as label, count(*)::int as n from posts group by 1 order by n desc, 1) t) as topics,
  (select coalesce(json_agg(t), '[]') from (
     select slug, title, tag, status, published_at, updated_at
       from posts order by updated_at desc, id desc limit 12) t) as edited`

async function load(dbUrl) {
  // ponytail: encrypted but unverified, as in api/contact.js; pin Supabase's CA cert to verify the server too.
  const db = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000, statement_timeout: 8000 })
  db.on('error', () => {}) // a dropped connection also fails the query below, which is handled
  try {
    await db.connect()
    return (await db.query(SQL, [TZ])).rows[0]
  } finally {
    await db.end().catch(() => {})
  }
}

/* ---------- formatting ---------- */

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const num = (n) => n.toLocaleString('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' })
const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`
const whenFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' })
const when = (iso) => `<time datetime="${esc(iso)}">${whenFmt.format(new Date(iso))}</time>`
const loadedFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
// Day strings from SQL are already local calendar days, so format them as plain UTC dates.
const dayFmt = (opts) => {
  const f = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', ...opts })
  return (day) => f.format(new Date(`${day}T00:00:00Z`))
}
const shortDay = dayFmt({ day: 'numeric', month: 'short' })
const longDay = dayFmt({ weekday: 'short', day: 'numeric', month: 'short' })
const fullDay = dayFmt({ day: 'numeric', month: 'short', year: 'numeric' })
const monthName = dayFmt({ month: 'short' })
const monthYear = dayFmt({ month: 'long', year: 'numeric' })

// Axis top: a round number whose half is also a whole number.
function niceMax(n) {
  if (n <= 10) return Math.max(2, n + (n % 2))
  const p = 10 ** Math.floor(Math.log10(n))
  return [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((v) => v >= n) ?? n
}

// Which form a message came from, and so which site it belongs to. Tarkova's form (api/contact.js) writes
// 'tarkova'; the Crowkis site writes 'feedback' and 'contact'. Tarkova's wrote 'contact' too until 2026-10-10,
// so a 'contact' row older than that could be from either site.
const VIA = { tarkova: 'Tarkova · Contact form', contact: 'Crowkis · Contact form', feedback: 'Crowkis · Feedback page' }
const siteOf = (source) => (source === 'tarkova' ? 'tarkova' : 'crowkis')

/* ---------- pieces ---------- */

const SITES = { tarkova: 'Tarkova', crowkis: 'Crowkis' }
// Each site's mark, inline: Tarkova's is the favicon's shape (public/favicon.svg), Crowkis's the crow from the
// Crowkis site (public/logo.svg there). mark() sets one in white on a tile of its site's colour, like an app icon,
// and that tile is how a site is named everywhere on the page.
const LOGOS = {
  tarkova: '<svg viewBox="4.5 5 15 14" aria-hidden="true"><path d="M11.64 18.31L7.44 18.31L12.36 5.69L16.56 5.69ZM18.31 12C17.63 13.74 15.66 15.15 13.92 15.15L16.38 8.85C18.13 8.85 18.99 10.26 18.31 12ZM10.08 8.85L7.62 15.15C5.87 15.15 5.01 13.74 5.69 12C6.37 10.26 8.34 8.85 10.08 8.85Z"/></svg>',
  crowkis: '<svg viewBox="268.36 268.12 395.06 280.60" aria-hidden="true"><polygon points="537.21,502.73 569.25,544.48 546.78,544.48 511.05,502.24 521.58,484.67 555.12,484.71 "/><path d="M479.57,413.9l5.96-19.63l-13.14,19.5l-41.68,0.16l24.02-40.83l-35.28,40.8h-54.64l57.07-59.09 l-74.04,59.08l-53.69,0.01l-14.88,0c0,0,106.84-82.78,106.15-82.6l-112.96,68.74l-0.01-54.82l132.25-72.98l176.08,95.66l26.35-36.7 l-61.79-18.17l21.46-17.27l26.7,1.67l14.09-11.3l32.19-0.01l19.57,23.74l-0.24,87.29l-51.49,79.32l-90,0l-24.98,26.38l30.66,41.64 l-21.99,0.01l-36.99-42.24l13.79-24.77l-15.95-0.05l-58.23,67.06h-40.27l56.69-64.15l-68.62,64.35l-27.1-0.14l0.14-27.08 l55.05-36.95l-55.05,25.18v-34.58L479.57,413.9z"/></svg>',
}
const mark = (site) => `<span class="mark ${site}">${LOGOS[site]}</span>`
const marks = (...sites) => `<span class="marks">${sites.map(mark).join('')}</span>`
// 24px line icons, for the menu and the refresh button.
const ICONS = {
  overview: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
  messages: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1Zm4 5h8m-8 3h5',
  blog: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6m-6 4h6',
  traffic: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
  engagement: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  ratings: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 5v3.5h3.5M4 13a8 8 0 0 0 14.9 3M20 19v-3.5h-3.5',
}
// Each site's sections. A site's overview takes the site's own id, so #tarkova and #crowkis switch sites.
// Messages and Ratings are the same lists for both sites, so they sit under each (shared: true).
const VIEWS = [
  { site: 'tarkova', id: 'tarkova', label: 'Overview', icon: 'overview' },
  { site: 'tarkova', id: 'tarkova-traffic', label: 'Page views', icon: 'traffic' },
  { site: 'tarkova', id: 'tarkova-blog', label: 'Blog', icon: 'blog' },
  { site: 'tarkova', id: 'tarkova-messages', label: 'Messages', icon: 'messages', shared: true },
  { site: 'tarkova', id: 'tarkova-ratings', label: 'Ratings', icon: 'ratings', shared: true },
  { site: 'crowkis', id: 'crowkis', label: 'Overview', icon: 'overview' },
  { site: 'crowkis', id: 'crowkis-traffic', label: 'Page views', icon: 'traffic' },
  { site: 'crowkis', id: 'crowkis-engagement', label: 'Engagement', icon: 'engagement' },
  { site: 'crowkis', id: 'crowkis-messages', label: 'Messages', icon: 'messages', shared: true },
  { site: 'crowkis', id: 'crowkis-ratings', label: 'Ratings', icon: 'ratings', shared: true },
]
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`

const panel = (title, note, body) => `<section class="panel"><div class="panel-head"><h2>${title}</h2>${note ? `<p>${note}</p>` : ''}</div>${body}</section>`
const empty = (text) => `<p class="empty">${text}</p>`

// The trend under a tile's number, with the newest point marked.
function spark(data) {
  const max = Math.max(1, ...data)
  const y = (n) => 22 - (n / max) * 20
  const pts = data.map((n, i) => `${((i / (data.length - 1)) * 100).toFixed(1)},${y(n).toFixed(1)}`).join(' ')
  return `<span class="spark" aria-hidden="true"><svg viewBox="0 0 100 24" preserveAspectRatio="none"><polygon points="0,24 ${pts} 100,24"/><polyline points="${pts}"/></svg><i style="top:${((y(data.at(-1)) / 24) * 100).toFixed(1)}%"></i></span>`
}

// A number tile: label, value (with its change), note, and the trend if there is one. The four parts sit on rows
// shared by the whole strip (see .stats), so they line up across tiles. A value of nothing is drawn quieter.
function stat({ label, value, delta = '', note, href, trend }) {
  const body = `<p class="stat-label">${label}</p><p class="stat-value${/^(0|0s|0%|–)$/.test(value) ? ' zero' : ''}">${value}${delta}</p><p class="stat-note">${note}</p>${trend ? spark(trend) : ''}`
  return href ? `<a class="stat" href="${href}">${body}</a>` : `<div class="stat">${body}</div>`
}

// The columns a period's chart draws, oldest first, the last one holding today. Days are 'YYYY-MM-DD' strings,
// which sort and compare as dates.
const iso = (d) => d.toISOString().slice(0, 10)
const quarter = (day) => `Q${Math.ceil(Number(day.slice(5, 7)) / 3)} ${day.slice(0, 4)}`
const NAMED = {
  day: (from) => [shortDay(from), longDay(from)],
  week: (from, to) => [shortDay(from), `${shortDay(from)} to ${shortDay(to)}`],
  month: (from) => [monthName(from), monthYear(from)],
  quarter: (from) => [quarter(from), quarter(from)],
}
function buckets({ step }, since, today) {
  const out = []
  for (let d = new Date(`${since}T00:00:00Z`); iso(d) <= today; ) {
    const from = iso(d)
    if (step === 'day' || step === 'week') d.setUTCDate(d.getUTCDate() + (step === 'day' ? 1 : 7))
    else d.setUTCMonth(d.getUTCMonth() + (step === 'month' ? 1 : 3))
    const to = iso(new Date(d - 864e5))
    const [tick, tip] = NAMED[step](from, to)
    out.push({ from, to, tick, tip })
  }
  return out
}

// One series, one column per day, week, month or quarter. Values are read from the y-axis, the label on the
// peak, the tooltip a column shows on hover or keyboard focus, and the table on the Page views section.
// `plain` is for columns that are not a timeline (weekdays, hours of the day): no "today", labels from the left.
function chart({ title, one, many, data, period, small, plain }) {
  if (!data.length) return panel(title, '', empty(`No ${many} yet.`))
  const total = data.reduce((sum, d) => sum + d.n, 0)
  const peak = data.reduce((a, b) => (b.n >= a.n ? b : a)) // latest on a tie
  const top = niceMax(peak.n)
  const last = data.length - 1
  const summary = total === 0 ? `No ${many} in this period` : plain ? `Most: ${peak.tip}` : `${num(total)} total · peak ${num(peak.n)}, ${peak.tip}`
  const now = plain ? '' : period.step === 'day' ? ' · today' : ' · so far'
  const cols = data.map((d, i) => {
    const pct = (d.n / top) * 100
    const side = i < data.length / 3 ? ' from-left' : i >= (data.length * 2) / 3 ? ' from-right' : ''
    return `<div class="col"${d.n ? ' tabindex="0"' : ''} role="img" aria-label="${d.tip}: ${plural(d.n, one, many)}">${
      d.n ? `<i style="height:max(${pct}%,3px);--i:${i}"></i>` : ''}${
      d.n && d === peak ? `<b class="peak" style="bottom:calc(${pct}% + 4px)" aria-hidden="true">${num(d.n)}</b>` : ''
    }<span class="tip${side}" style="bottom:min(calc(${pct}% + 10px), calc(100% - 3rem))" aria-hidden="true"><strong>${plural(d.n, one, many)}</strong>${d.tip}${i === last ? now : ''}</span></div>`
  }).join('')
  const every = data.length <= 12 && (plain || data.length <= 8) ? 1 : Math.ceil(data.length / (plain ? 4 : 5)) // a handful of labels
  const shown = (i) => (plain ? i : last - i) % every === 0 // a timeline counts back from the newest
  const ticks = data.map((d, i) => `<span>${shown(i) ? `<em${!plain && i === last ? ` class="now${every > 1 ? ' end' : ''}"` : ''}>${!plain && i === last && period.step === 'day' ? 'Today' : d.tick}</em>` : ''}</span>`).join('')
  // With nothing to draw, the plot folds down to its baseline (.flat) and the summary beside the title says so.
  return panel(title, summary, `<div class="chart${small ? ' small' : ''}${total === 0 ? ' flat' : ''}" role="group" aria-label="${title}${plain ? '' : `, ${period.name.toLowerCase()}`}. ${summary}.">
  <div class="plot"><div class="yaxis" aria-hidden="true"><span>${compact.format(top)}</span><span>${compact.format(top / 2)}</span><span>0</span></div><div class="cols">${cols}</div></div>
  <div class="xaxis" aria-hidden="true">${ticks}</div></div>`)
}

// A ranked list; the bar behind each row is its share of the largest row.
function rank(rows, { mono, none, name = (s) => s, show = num } = {}) {
  if (!rows.length) return empty(none)
  const max = Math.max(...rows.map((r) => r.n))
  return `<ol class="rank${mono ? ' mono' : ''}">${rows.map((r) => `<li style="--p:${(r.n / max) * 100}%"><span title="${esc(r.label)}">${esc(name(r.label))}</span><b>${show(r.n)}</b></li>`).join('')}</ol>`
}

const starRow = (n) => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`

// The initial takes the colour of the site the message came through; the badge says the same in words.
function message(m) {
  const name = m.name?.trim(), email = m.email?.trim()
  return `<li class="msg"><span class="avatar ${siteOf(m.source)}" aria-hidden="true">${esc((name || '?')[0].toUpperCase())}</span><div class="msg-main"><div class="msg-head"><p class="msg-name">${esc(name || 'No name given')}</p>${when(m.created_at)}</div><p class="msg-from">${
    email ? `<a href="mailto:${encodeURIComponent(email)}">${esc(email)}</a>` : '<span class="muted">No email given</span>'
  }<span class="badge">${esc(VIA[m.source] || m.source)}</span></p><p class="msg-body">${esc(m.message)}</p></div></li>`
}

/* ---------- pages ---------- */

const titleCase = (s) => String(s ?? '').replace(/^\w/, (c) => c.toUpperCase()).replace(/\bjev\b/, 'Jev') // as in src/site/pages.js

// What each counted event is called on the dashboard: [tile label, one, many, icon, colour]. The icon and colour
// are for the phone app's tiles (appData); this page keeps to each site's one colour.
const EVENTS = {
  views: ['Page views', 'page view', 'page views', 'traffic', '#0a84ff'],
  reads: ['Blog reads', 'read', 'reads', 'blog', '#bf5af2'],
  clicks: ['Clicks', 'click', 'clicks', 'tap', '#ff375f'],
  demos: ['Demo clicks', 'click', 'clicks', 'demo', '#30b650'],
  plays: ['Arcade plays', 'play', 'plays', 'arcade', '#ff9f0a'],
  copies: ['Code copies', 'copy', 'copies', 'copies', '#1fb5c9'],
}

// What the page and the app's JSON are both built from: each period, with a way to total any per-day rows into
// its chart's columns, and how a period's total compares with the same number of days just before it.
function prepare({ today, since }) {
  const periods = RANGES.map((r) => {
    const cols = buckets(r, since[r.key], today)
    const days = (Date.parse(today) - Date.parse(since[r.key])) / 864e5 + 1
    return { ...r, days, fill: (rows, pick = (d) => d.n) => cols.map((c) => ({ ...c, n: rows.reduce((sum, d) => (d.day >= c.from && d.day <= c.to ? sum + pick(d) : sum), 0) })) }
  })
  const total = (cols) => cols.reduce((sum, c) => sum + c.n, 0)
  const within = (p, rows) => rows.filter((d) => d.day >= since[p.key])
  // Nothing for five years (the data does not reach back that far) or when there was nothing before to compare with.
  const changed = (p, rows, pick = (d) => d.n) => {
    if (p.key === '5y') return null
    const end = Date.parse(since[p.key]) - 864e5, from = iso(new Date(end - (p.days - 1) * 864e5)), to = iso(new Date(end))
    const sum = (list) => list.reduce((n, d) => n + pick(d), 0)
    const was = sum(rows.filter((d) => d.day >= from && d.day <= to)), is = sum(within(p, rows))
    return was ? { up: is >= was, percent: Math.round((Math.abs(is - was) / was) * 100) } : null
  }
  return { periods, total, within, changed }
}

// Seconds, as a person would say them: 45s, 1m 20s, 2h 05m.
const span = (s) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`)
// How long visits lasted in a period: [the average as a value, a note, the total seconds].
const stayed = (rows) => {
  const stays = rows.reduce((n, d) => n + d.stays, 0), secs = rows.reduce((n, d) => n + d.secs, 0)
  return stays ? [span(Math.round(secs / stays)), `${stays.toLocaleString('en-US')} ${stays === 1 ? 'visit' : 'visits'} timed`, secs] : ['–', 'No visits timed yet', 0]
}

// When people visit: page views by day of the week, and by hour of the day (India time).
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const clock = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`
const byWeekday = (rows) => WEEK.map((name, i) => ({ tick: name.slice(0, 3), tip: `${name}s`, n: rows.reduce((n, d) => ((new Date(`${d.day}T00:00:00Z`).getUTCDay() + 6) % 7 === i ? n + d.views : n), 0) }))
const byHour = (list) => {
  const counts = new Map(list.map((r) => [r.label, r.n]))
  return Array.from({ length: 24 }, (_, h) => ({ tick: clock(h), tip: `${clock(h)} to ${clock((h + 1) % 24)}, India time`, n: counts.get(h) || 0 }))
}

function dashboard(data) {
  const { today, since, daily, pages, reads, areas, hours, clicked, dwell, breadth, snippets, buttons, posted, revised, lengths, newest, inflow, senders, messages, stars, rated, commented, ratings, blog, topics, edited } = data
  const { periods, total, within, changed } = prepare(data)
  // The same block once per period; the period control shows the chosen one (see .range in the CSS).
  const ranged = (block) => periods.map((p) => `<div data-r="${p.key}">${block(p)}</div>`).join('')
  const change = (p, rows, pick) => {
    const c = changed(p, rows, pick)
    return c ? `<span class="delta ${c.up ? 'up' : 'down'}" title="Compared with the ${num(p.days)} days before"><span aria-hidden="true">${c.up ? '▲' : '▼'}</span><span class="sr">${c.up ? 'up' : 'down'}</span> ${c.percent}%</span>` : ''
  }
  const percent = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(part && part * 10 < whole ? 1 : 0)}%` : '<span class="muted">–</span>')
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()))
  // The line under an overview's title: a greeting, then the two things worth knowing before any number.
  const hero = (line) => `<p class="hello"><b>Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}.</b> ${line}</p>`

  // counted events, per site
  const events = (site) => daily.filter((d) => d.site === site)
  const now = (site) => events(site).find((d) => d.day === today) || { views: 0, reads: 0, clicks: 0, demos: 0, plays: 0, copies: 0 }
  const tile = (p, site, k, { href, label = EVENTS[k][0] } = {}) => {
    const cols = p.fill(events(site), (d) => d[k])
    return stat({ href, label, value: num(total(cols)), delta: change(p, events(site), (d) => d[k]), note: `${num(now(site)[k])} today`, trend: cols.map((c) => c.n) })
  }
  const plot = (p, site, k, { small, title = EVENTS[k][0] } = {}) => chart({ period: p, small, title, one: EVENTS[k][1], many: EVENTS[k][2], data: p.fill(events(site), (d) => d[k]) })
  const top = (list, p, site) => list[`${site}:${p.key}`]
  const time = (p, site) => { const [value, note] = stayed(within(p, events(site))); return stat({ label: 'Average time on page', value, note }) }
  const behaviour = (p, site) => `<div class="stats three">
        ${tile(p, site, 'clicks')}${time(p, site)}${stat({ label: 'Total time on the site', value: span(stayed(within(p, events(site)))[2]), note: p.name })}
      </div>
      <div class="grid two">
        ${panel('What visitors click', `Links and buttons · ${p.name.toLowerCase()}`, rank(top(clicked, p, site), { none: 'No clicks recorded in this period.' }))}
        ${panel('Time spent by page', `Average · ${p.name.toLowerCase()}`, rank(top(dwell, p, site), { mono: true, none: 'No visits timed in this period.', show: span }))}
      </div>`
  const rate = (p, site, label) => {
    const rows = within(p, events(site)), sum = (k) => rows.reduce((n, d) => n + d[k], 0)
    return stat({ label, value: percent(sum('demos'), sum('views')), note: `${num(sum('demos'))} of ${plural(sum('views'), 'page view', 'page views')}` })
  }
  const rhythm = (p, site) => `<div class="grid two">
        ${chart({ plain: true, small: true, title: 'By day of the week', one: 'page view', many: 'page views', data: byWeekday(within(p, events(site))) })}
        ${chart({ plain: true, small: true, title: 'By hour of the day', one: 'page view', many: 'page views', data: byHour(top(hours, p, site)) })}
      </div>`
  // A site that has sent nothing at all yet says so once, above its zeros.
  const quiet = (site) => (events(site).length ? '' : `<p class="hello">Nothing recorded for ${SITES[site]} yet. This page fills in once the site starts sending page views.</p>`)
  // The page views section: the same for both sites but for the lists under the charts.
  const traffic = (site, keys, labels, lists) => quiet(site) + ranged((p) => {
    const rows = keys.map((k) => p.fill(events(site), (d) => d[k]))
    const views = total(rows[0]), best = rows[0].reduce((a, b) => (b.n >= a.n ? b : a))
    return `<div class="stats four lead">
        ${stat({ label: 'Page views', value: num(views), delta: change(p, events(site), (d) => d.views), note: `${num(now(site).views)} today` })}
        ${stat({ label: 'Daily average', value: num(Math.round((views / p.days) * 10) / 10), note: `Over ${num(p.days)} days` })}
        ${stat({ label: `Busiest ${p.step}`, value: num(best.n), note: views ? best.tip : 'Nothing yet' })}
        ${stat({ label: 'Pages viewed', value: num(breadth[`${site}:${p.key}`]), note: 'Different pages' })}
      </div>
      ${plot(p, site, 'views')}
      ${behaviour(p, site)}
      ${rhythm(p, site)}
      ${lists(p)}
      <details class="panel"><summary>Numbers as a table</summary><div class="scroll"><table>
        <thead><tr><th>${titleCase(p.step)}</th>${labels.map((l) => `<th>${l}</th>`).join('')}</tr></thead>
        <tbody>${rows[0].map((c, i) => `<tr><th scope="row">${c.tip}</th>${rows.map((r) => `<td>${num(r[i].n)}</td>`).join('')}</tr>`).reverse().join('')}</tbody>
      </table></div></details>`
  })
  const pagesPanel = (p, site, n) => panel('Top pages', `Views · ${p.name.toLowerCase()}`, rank(top(pages, p, site).slice(0, n), { mono: true, none: 'No page views in this period.' }))
  const areasPanel = (p, site) => panel('Views by section', `First part of the address · ${p.name.toLowerCase()}`, rank(top(areas, p, site), { mono: true, none: 'No page views in this period.', name: (a) => (a === '/' ? '/ (home)' : a) }))

  // messages and ratings: one list for both sites, shown under each
  const received = (site) => inflow.filter((d) => !site || siteOf(d.source) === site).reduce((sum, d) => sum + d.n, 0)
  const latest = (site) => panel('Latest messages', received() ? `<a href="#${site}-messages">All ${num(received())}</a>` : '', messages.length ? `<ul class="msgs brief">${messages.slice(0, 3).map(message).join('')}</ul>` : empty('No messages yet.'))
  const mail = (p, site) => stat({ href: `#${site}-messages`, label: 'Messages', value: num(total(p.fill(inflow))), delta: change(p, inflow), note: `${num(received())} all time` })
  const inbox = `
      ${ranged((p) => `<div class="stats four lead">
        ${stat({ label: 'Messages', value: num(total(p.fill(inflow))), delta: change(p, inflow), note: p.name })}
        ${stat({ label: 'All time', value: num(received()), note: `From ${plural(senders, 'person', 'people')}` })}
        ${stat({ label: `${mark('tarkova')}From Tarkova`, value: num(received('tarkova')), note: 'Contact form' })}
        ${stat({ label: `${mark('crowkis')}From Crowkis`, value: num(received('crowkis')), note: 'Contact form and feedback page' })}
      </div>
      ${chart({ period: p, small: true, title: 'Messages received', one: 'message', many: 'messages', data: p.fill(inflow) })}`)}
      ${panel('Inbox', received() > messages.length ? `Newest ${num(messages.length)} of ${num(received())}` : received() ? 'Newest first' : '', messages.length ? `<ul class="msgs">${messages.map(message).join('')}</ul>` : empty('No messages yet. The contact forms on both sites and the Crowkis feedback page all land here.'))}`

  const ratingTotal = stars.reduce((s, r) => s + r.n, 0)
  const ratingAvg = ratingTotal ? stars.reduce((s, r) => s + r.stars * r.n, 0) / ratingTotal : null
  const starPeak = Math.max(1, ...stars.map((r) => r.n))
  const outOf5 = (avg) => (avg === null ? '<span class="muted">–</span>' : `${avg.toFixed(1)}<small> / 5</small>`)
  const dist = ratingTotal === 0 ? empty('No ratings yet. They come from the star widget on crowkis.com.') : `<ul class="dist" aria-label="Number of ratings for each star value">${[5, 4, 3, 2, 1].map((s) => {
    const n = stars.find((r) => r.stars === s)?.n ?? 0
    return `<li><span><span aria-hidden="true">${s} ★</span><span class="sr">${s} stars:</span></span><span class="track"><i style="width:${n ? `max(${(n / starPeak) * 100}%, 3px)` : 0}"></i></span><b>${num(n)}</b><em>${Math.round((n / ratingTotal) * 100)}%</em></li>`
  }).join('')}</ul>`
  const rating = `
      ${ranged((p) => {
        const rows = within(p, rated), n = rows.reduce((s, d) => s + d.n, 0)
        return `<div class="stats four lead">
        ${stat({ label: 'Ratings', value: num(n), delta: change(p, rated), note: `${num(ratingTotal)} all time` })}
        ${stat({ label: 'Average', value: outOf5(n ? rows.reduce((s, d) => s + d.total, 0) / n : null), note: ratingAvg === null ? 'No ratings yet' : `${ratingAvg.toFixed(1)} / 5 all time` })}
        ${stat({ label: 'Five stars', value: percent(rows.reduce((s, d) => s + d.five, 0), n), note: p.name })}
        ${stat({ label: 'With a comment', value: num(commented), note: `${percent(commented, ratingTotal)} of all ratings` })}
      </div>
      ${chart({ period: p, small: true, title: 'Ratings received', one: 'rating', many: 'ratings', data: p.fill(rated) })}`
      })}
      <div class="grid two">
        ${panel('Rating distribution', ratingTotal ? `${plural(ratingTotal, 'rating', 'ratings')} · all time` : '', dist)}
        ${panel('Recent ratings', 'Newest first', ratings.length ? `<ul class="rated">${ratings.map((r) => `<li><div>${starRow(r.stars)}${when(r.created_at)}</div>${r.comment?.trim() ? `<p>${esc(r.comment)}</p>` : '<p class="muted">No comment</p>'}</li>`).join('')}</ul>` : empty('No ratings yet.'))}
      </div>`

  // blog
  const lastEdit = blog.edited ? whenFmt.format(new Date(blog.edited)) : 'No posts yet'
  const postList = (rows, line) => (rows.length ? `<ul class="posts">${rows.map((p) => `<li><h3>${esc(p.title)}</h3><p>${esc(titleCase(p.tag))} · ${line(p)}</p></li>`).join('')}</ul>` : empty('No posts yet.'))
  const dated = (p) => (p.published_at ? `published ${fullDay(p.published_at)}` : 'not published')
  const recent = (n) => postList(edited.slice(0, n), (p) => `${dated(p)}${p.status === 'published' ? '' : ` · <b>${esc(p.status)}</b>`} · edited ${when(p.updated_at)}`)
  const published = (p) => chart({ period: p, title: 'Posts published', one: 'post', many: 'posts', data: p.fill(posted) })

  return shell({
    tarkova: `
      ${hero(`${plural(blog.total, 'blog post', 'blog posts')} · ${plural(received(), 'message', 'messages')} in the inbox`)}
      ${ranged((p) => `<div class="stats four lead">${tile(p, 'tarkova', 'views', { href: '#tarkova-traffic' })}${tile(p, 'tarkova', 'clicks', { href: '#tarkova-traffic' })}${time(p, 'tarkova')}${mail(p, 'tarkova')}</div>
      ${plot(p, 'tarkova', 'views')}
      <div class="grid two">${pagesPanel(p, 'tarkova', 5)}${panel('What visitors click', `Links and buttons · ${p.name.toLowerCase()}`, rank(top(clicked, p, 'tarkova').slice(0, 5), { none: 'No clicks recorded in this period.' }))}</div>`)}
      <div class="grid two">
        ${latest('tarkova')}
        ${panel('Recently edited posts', '<a href="#tarkova-blog">Blog</a>', recent(5))}
      </div>`,
    'tarkova-traffic': traffic('tarkova', ['views', 'reads', 'demos'], ['Page views', 'Blog reads', 'Call clicks'], (p) => `<div class="grid two">
        ${pagesPanel(p, 'tarkova')}
        ${panel('Most read posts', `Views · ${p.name.toLowerCase()}`, rank(top(reads, p, 'tarkova'), { mono: true, none: 'No blog posts read in this period.', name: (path) => path.slice(6, -1) }))}
      </div>
      <div class="stats three">${tile(p, 'tarkova', 'reads')}${tile(p, 'tarkova', 'demos', { label: 'Call clicks' })}${rate(p, 'tarkova', 'Call click rate')}</div>
      <div class="grid two">
        ${areasPanel(p, 'tarkova')}
        ${panel('Call clicks by page', `“Pick a time” · ${p.name.toLowerCase()}`, rank(top(buttons, p, 'tarkova'), { mono: true, none: 'Nobody has clicked “Pick a time” in this period.' }))}
      </div>`),
    'tarkova-blog': `
      <div class="stats four lead">
        ${stat({ label: 'Posts', value: num(blog.total), note: blog.published === blog.total ? 'All published' : `${num(blog.published)} published` })}
        ${stat({ label: 'About Crowkis', value: num(blog.total - blog.curva), note: `${percent(blog.total - blog.curva, blog.total)} of posts` })}
        ${stat({ label: 'About Curva', value: num(blog.curva), note: `${percent(blog.curva, blog.total)} of posts` })}
        ${stat({ label: 'Average read', value: blog.minutes === null ? '<span class="muted">–</span>' : `${blog.minutes}<small> min</small>`, note: `${num(blog.hours)} hours of reading in all` })}
      </div>
      ${ranged((p) => `<div class="stats four">
        ${stat({ label: 'Published', value: num(total(p.fill(posted))), delta: change(p, posted), note: p.name })}
        ${stat({ label: 'Edited', value: num(total(p.fill(revised))), note: p.name })}
        ${stat({ label: 'Topics', value: num(topics.length), note: topics.length ? `Largest: ${esc(titleCase(topics[0].label))}` : 'No posts yet' })}
        ${stat({ label: 'Last edit', value: blog.edited ? shortDay(new Date(blog.edited).toLocaleDateString('en-CA', { timeZone: TZ })) : '<span class="muted">–</span>', note: lastEdit })}
      </div>
      ${published(p)}`)}
      <div class="grid two">
        ${panel('Posts by topic', plural(topics.length, 'topic', 'topics'), rank(topics, { none: 'No posts yet.', name: titleCase }))}
        <div class="stack">
          ${chart({ plain: true, small: true, title: 'Posts by reading time', one: 'post', many: 'posts', data: lengths.map((l) => ({ tick: `${l.label}`, tip: `${l.label} minute read`, n: l.n })) })}
          ${panel('Newest posts', 'By publish date', postList(newest, (p) => `${dated(p)}${p.read_minutes ? ` · ${p.read_minutes} min read` : ''}`))}
        </div>
      </div>
      ${panel('Recently edited', 'Newest first', recent(12))}`,
    crowkis: `
      ${hero(`${ratingAvg === null ? 'No ratings yet' : `Rated ${ratingAvg.toFixed(1)} / 5 by ${num(ratingTotal)}`} · ${plural(received(), 'message', 'messages')} in the inbox`)}
      ${ranged((p) => `<div class="stats four lead">${tile(p, 'crowkis', 'views', { href: '#crowkis-traffic' })}${tile(p, 'crowkis', 'clicks', { href: '#crowkis-traffic' })}${time(p, 'crowkis')}${tile(p, 'crowkis', 'demos', { href: '#crowkis-engagement' })}</div>
      ${plot(p, 'crowkis', 'views')}
      <div class="grid two">${pagesPanel(p, 'crowkis', 5)}${panel('What visitors click', `Links and buttons · ${p.name.toLowerCase()}`, rank(top(clicked, p, 'crowkis').slice(0, 5), { none: 'No clicks recorded in this period.' }))}</div>`)}
      <div class="grid two">
        ${latest('crowkis')}
        ${panel('Ratings', ratingTotal ? `<a href="#crowkis-ratings">${ratingAvg.toFixed(1)} / 5 from ${num(ratingTotal)}</a>` : '', dist)}
      </div>`,
    'crowkis-traffic': traffic('crowkis', ['views', 'demos', 'plays', 'copies'], ['Page views', 'Demo clicks', 'Arcade plays', 'Code copies'], (p) => `<div class="grid two">${pagesPanel(p, 'crowkis')}${areasPanel(p, 'crowkis')}</div>`),
    'crowkis-engagement': ranged((p) => `<div class="stats four lead">${tile(p, 'crowkis', 'demos')}${tile(p, 'crowkis', 'plays')}${tile(p, 'crowkis', 'copies')}${rate(p, 'crowkis', 'Demo click rate')}</div>
      <div class="multiples">${plot(p, 'crowkis', 'demos', { small: true })}${plot(p, 'crowkis', 'plays', { small: true })}${plot(p, 'crowkis', 'copies', { small: true })}</div>
      <div class="grid two">
        ${panel('Demo clicks by button', `Clicks · ${p.name.toLowerCase()}`, rank(top(buttons, p, 'crowkis'), { mono: true, none: 'No Book a demo clicks in this period.' }))}
        ${panel('Most copied code', `Copies · ${p.name.toLowerCase()}`, rank(top(snippets, p, 'crowkis'), { mono: true, none: 'No snippets copied in this period.' }))}
      </div>`),
    'tarkova-messages': inbox, 'crowkis-messages': inbox,
    'tarkova-ratings': rating, 'crowkis-ratings': rating,
  }, {
    'tarkova-messages': received(), 'crowkis-messages': received(), 'tarkova-ratings': ratingTotal, 'crowkis-ratings': ratingTotal, 'tarkova-blog': blog.total,
  })
}

const unavailable = () => shell({ crowkis: '', tarkova: `<div class="panel" role="alert"><div class="panel-head"><h2>The data could not be loaded</h2></div><p class="lede">The site could not reach the database, so there is nothing to show right now. Reload in a minute. If it keeps happening, check that SUPABASE_DB_URL is set and the Supabase project is running. The server log has the error.</p></div>` })

// Every section of both sites, for every period, is already in the page. The address's #hash picks the section
// on show (CSS :target) and with it the site whose menu the sidebar lists; the period control is a row of radio
// buttons. So switching site, section or period is instant and needs no script. No hash shows the Tarkova overview.
// ponytail: that makes the page about 750 KB before compression (six periods of everything). If it grows heavy,
// render one period per request (?range=) and accept a reload when the period changes.
function shell(sections, counts = {}) {
  const views = VIEWS.filter((v) => v.id in sections)
  const link = (v, i, all) => `${v.shared && !all[i - 1].shared ? '<p class="group">Both websites</p>' : ''}<a href="#${v.id}">${icon(v.icon)}<span>${v.label}</span>${v.id in counts ? `<b>${compact.format(counts[v.id])}</b>` : ''}</a>`
  const current = [...views.map((v) => `body:has(#${v.id}:target) .side nav a[href="#${v.id}"]`), 'body:not(:has(.view:target)) .side nav a[href="#tarkova"]'].join(', ')
  return doc('Admin', `<style>${current} { --on: var(--tint); --on-ink: var(--accent); --tab: var(--accent); font-weight: 600; }</style>
<div class="app">
  <aside class="side">
    <div class="switch" role="group" aria-label="Website">${Object.entries(SITES).map(([site, name]) => `<a href="#${site}">${mark(site)}${name}</a>`).join('')}</div>
    ${Object.entries(SITES).map(([site, name]) => `<nav data-site="${site}" aria-label="${name} sections">${views.filter((v) => v.site === site).map(link).join('')}</nav>`).join('')}
    <div class="side-foot"><p>Loaded ${loadedFmt.format(new Date())}</p><form method="get"><button type="submit" aria-label="Refresh the numbers">${icon('refresh')}<span>Refresh</span></button></form><form method="post"><input type="hidden" name="action" value="logout" /><button type="submit">Sign out</button></form></div>
  </aside>
  <main><div class="wrap">
    <fieldset class="range"><legend class="sr">Period</legend>${RANGES.map((r) => `<label title="${r.name}"><input type="radio" name="range" id="r-${r.key}"${r.key === DEFAULT_RANGE ? ' checked' : ''} /><span>${r.label}</span></label>`).join('')}</fieldset>
    ${views.map((v) => `<section class="view" id="${v.id}" data-site="${v.site}"><header>${v.shared ? marks('tarkova', 'crowkis') : mark(v.site)}<div><p class="eyebrow">${v.shared ? 'Both websites' : SITES[v.site]}</p><h1>${v.label}</h1></div></header>${sections[v.id]}</section>`).join('')}
  </div></main>
</div>`)
}

/* ---------- the same numbers as JSON, for the phone app (app/) ---------- */

// GET /admin/<key>/?format=json. Every section is a list of generic blocks (hero, tiles, chart, list, posts,
// stars, messages, ratings), once per period, so the app only has to know how to draw those and a new metric
// here shows up there without an app change. SYMBOLS names each tile's icon (Ionicons, which Expo ships).
const SYMBOLS = { tap: 'finger-print', overview: 'grid', traffic: 'bar-chart', blog: 'document-text', messages: 'chatbubble', ratings: 'star', engagement: 'flash', demo: 'calendar', arcade: 'game-controller', copies: 'copy', clock: 'time', tag: 'pricetag' }
function appData(data) {
  const { today, since, daily, pages, reads, areas, hours, clicked, dwell, breadth, snippets, buttons, posted, revised, lengths, newest, inflow, senders, messages, stars, rated, commented, ratings, blog, topics, edited } = data
  const { periods, total, within, changed } = prepare(data)
  const sum = (rows, pick = (d) => d.n) => rows.reduce((n, d) => n + pick(d), 0)
  const percent = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(part && part * 10 < whole ? 1 : 0)}%` : '–')
  const events = (site) => daily.filter((d) => d.site === site)
  const now = (site) => events(site).find((d) => d.day === today) || { views: 0, reads: 0, clicks: 0, demos: 0, plays: 0, copies: 0 }
  const top = (list, p, site) => list[`${site}:${p.key}`]
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()))

  // blocks
  const tile = (label, value, note, icon, color, more = {}) => ({ label, value: String(value), note, symbol: SYMBOLS[icon], color, ...more })
  const tiles = (...list) => ({ type: 'tiles', tiles: list })
  const chart = (title, cols, one, many, plain = false) => ({ type: 'chart', title, one, many, plain, points: cols.map(({ tick, tip, n }) => ({ tick, tip, n })) })
  // `value` is what to print for a row when it is not the plain number (seconds as "1m 20s").
  const list = (title, rows, empty, name = (s) => s, show) => ({ type: 'list', title, empty, rows: rows.map((r) => ({ label: String(name(r.label)), n: r.n, ...(show ? { value: show(r.n) } : {}) })) })
  const time = (p, site) => { const [value, note] = stayed(within(p, events(site))); return tile('Average time on page', value, note, 'clock', '#5e5ce6') }
  const clicks = (p, site, n) => list('What visitors click', top(clicked, p, site).slice(0, n), 'No clicks recorded in this period.')
  const postList = (title, rows, line) => ({ type: 'posts', title, rows: rows.map((p) => ({ title: p.title, line: `${titleCase(p.tag)} · ${line(p)}` })) })
  const hero = (site, line) => ({ type: 'hero', greeting: `Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}`, title: `${SITES[site]} at a glance`, line })

  // counted events
  const count = (p, site, k, label = EVENTS[k][0]) => {
    const cols = p.fill(events(site), (d) => d[k])
    return tile(label, num(total(cols)), `${num(now(site)[k])} today`, EVENTS[k][3], EVENTS[k][4], { change: changed(p, events(site), (d) => d[k]), trend: cols.map((c) => c.n) })
  }
  const plot = (p, site, k, title = EVENTS[k][0]) => chart(title, p.fill(events(site), (d) => d[k]), EVENTS[k][1], EVENTS[k][2])
  const rate = (p, site, label) => {
    const rows = within(p, events(site))
    return tile(label, percent(sum(rows, (d) => d.demos), sum(rows, (d) => d.views)), `${num(sum(rows, (d) => d.demos))} of ${plural(sum(rows, (d) => d.views), 'page view', 'page views')}`, 'engagement', '#ff9f0a')
  }
  const topPages = (p, site, n) => list('Top pages', top(pages, p, site).slice(0, n), 'No page views in this period.')
  const traffic = (p, site, extra) => {
    const cols = p.fill(events(site), (d) => d.views), views = total(cols), best = cols.reduce((a, b) => (b.n >= a.n ? b : a))
    return [
      tiles(
        tile('Page views', num(views), `${num(now(site).views)} today`, 'traffic', EVENTS.views[4], { change: changed(p, events(site), (d) => d.views) }),
        tile('Daily average', num(Math.round((views / p.days) * 10) / 10), `Over ${num(p.days)} days`, 'clock', '#5e5ce6'),
        tile(`Busiest ${p.step}`, num(best.n), views ? best.tip : 'Nothing yet', 'ratings', '#ffb300'),
        tile('Pages viewed', num(breadth[`${site}:${p.key}`]), 'Different pages', 'blog', '#30b650'),
      ),
      plot(p, site, 'views'),
      tiles(count(p, site, 'clicks'), time(p, site)),
      clicks(p, site),
      list('Time spent by page', top(dwell, p, site), 'No visits timed in this period.', undefined, span),
      chart('By day of the week', byWeekday(within(p, events(site))), 'page view', 'page views', true),
      chart('By hour of the day', byHour(top(hours, p, site)), 'page view', 'page views', true),
      topPages(p, site),
      ...extra,
      list('Views by section', top(areas, p, site), 'No page views in this period.', (a) => (a === '/' ? '/ (home)' : a)),
    ]
  }

  // messages and ratings: the same for both sites
  const received = (site) => sum(inflow.filter((d) => !site || siteOf(d.source) === site))
  const mailTile = (p) => tile('Messages', num(total(p.fill(inflow))), `${num(received())} all time`, 'messages', '#ff375f', { change: changed(p, inflow) })
  const ratingTotal = sum(stars), ratingAvg = ratingTotal ? sum(stars, (r) => r.stars * r.n) / ratingTotal : null
  const outOf5 = (avg) => (avg === null ? '–' : `${avg.toFixed(1)} / 5`)
  const starBlock = { type: 'stars', title: 'Rating distribution', rows: [5, 4, 3, 2, 1].map((s) => { const n = stars.find((r) => r.stars === s)?.n ?? 0; return { stars: s, n, percent: ratingTotal ? Math.round((n / ratingTotal) * 100) : 0 } }) }
  const inbox = (p) => [
    tiles(mailTile(p), tile('All time', num(received()), `From ${plural(senders, 'person', 'people')}`, 'clock', '#8e8e93'), tile('From Tarkova', num(received('tarkova')), 'Contact form', 'messages', '#5856d6'), tile('From Crowkis', num(received('crowkis')), 'Contact and feedback', 'messages', '#d92d34')),
    chart('Messages received', p.fill(inflow), 'message', 'messages'),
    { type: 'messages', title: 'Inbox' },
  ]
  const rating = (p) => {
    const rows = within(p, rated), n = sum(rows)
    return [
      tiles(
        tile('Ratings', num(n), `${num(ratingTotal)} all time`, 'ratings', '#ffb300', { change: changed(p, rated) }),
        tile('Average', outOf5(n ? sum(rows, (d) => d.total) / n : null), `${outOf5(ratingAvg)} all time`, 'ratings', '#ff9f0a'),
        tile('Five stars', percent(sum(rows, (d) => d.five), n), p.name, 'ratings', '#30b650'),
        tile('With a comment', num(commented), `${percent(commented, ratingTotal)} of all ratings`, 'messages', '#0a84ff'),
      ),
      chart('Ratings received', p.fill(rated), 'rating', 'ratings'),
      starBlock,
      { type: 'ratings', title: 'Recent ratings' },
    ]
  }

  // blog
  const dated = (p) => (p.published_at ? `published ${fullDay(p.published_at)}` : 'not published')
  const lastEdit = blog.edited ? shortDay(new Date(blog.edited).toLocaleDateString('en-CA', { timeZone: TZ })) : '–'
  const published = (p) => chart('Posts published', p.fill(posted), 'post', 'posts')

  const section = (id, title, icon, build) => ({ id, title, symbol: SYMBOLS[icon], blocks: Object.fromEntries(periods.map((p) => [p.key, build(p)])) })
  const shared = [section('messages', 'Messages', 'messages', inbox), section('ratings', 'Ratings', 'ratings', rating)]
  const inboxLine = `${plural(received(), 'message', 'messages')} in the inbox`
  return {
    loaded: loadedFmt.format(new Date()),
    periods: periods.map(({ key, label, name }) => ({ key, label, name })),
    defaultPeriod: DEFAULT_RANGE,
    sites: [
      { id: 'tarkova', name: 'Tarkova', color: '#5856d6', sections: [
        section('overview', 'Overview', 'overview', (p) => [hero('tarkova', `${plural(blog.total, 'blog post', 'blog posts')} · ${inboxLine}`), tiles(count(p, 'tarkova', 'views'), count(p, 'tarkova', 'clicks'), time(p, 'tarkova'), mailTile(p)), plot(p, 'tarkova', 'views'), topPages(p, 'tarkova', 5), clicks(p, 'tarkova', 5)]),
        section('traffic', 'Page views', 'traffic', (p) => traffic(p, 'tarkova', [
          list('Most read posts', top(reads, p, 'tarkova'), 'No blog posts read in this period.', (path) => path.slice(6, -1)),
          tiles(count(p, 'tarkova', 'reads'), count(p, 'tarkova', 'demos', 'Call clicks'), rate(p, 'tarkova', 'Call click rate')),
          list('Call clicks by page', top(buttons, p, 'tarkova'), 'Nobody has clicked “Pick a time” in this period.'),
        ])),
        section('blog', 'Blog', 'blog', (p) => [
          tiles(tile('Posts', num(blog.total), blog.published === blog.total ? 'All published' : `${num(blog.published)} published`, 'blog', '#5e5ce6'), tile('About Crowkis', num(blog.total - blog.curva), `${percent(blog.total - blog.curva, blog.total)} of posts`, 'tag', '#e0353b'), tile('About Curva', num(blog.curva), `${percent(blog.curva, blog.total)} of posts`, 'tag', '#1fb5c9'), tile('Average read', blog.minutes === null ? '–' : `${blog.minutes} min`, `${num(blog.hours)} hours in all`, 'clock', '#ff9f0a')),
          tiles(tile('Published', num(total(p.fill(posted))), p.name, 'blog', '#30b650', { change: changed(p, posted) }), tile('Edited', num(total(p.fill(revised))), p.name, 'copies', '#0a84ff'), tile('Topics', num(topics.length), topics.length ? `Largest: ${titleCase(topics[0].label)}` : 'No posts yet', 'tag', '#bf5af2'), tile('Last edit', lastEdit, blog.edited ? whenFmt.format(new Date(blog.edited)) : 'No posts yet', 'clock', '#8e8e93')),
          published(p),
          list('Posts by topic', topics, 'No posts yet.', titleCase),
          chart('Posts by reading time', lengths.map((l) => ({ tick: `${l.label}`, tip: `${l.label} minute read`, n: l.n })), 'post', 'posts', true),
          postList('Newest posts', newest, (x) => `${dated(x)}${x.read_minutes ? ` · ${x.read_minutes} min read` : ''}`),
          postList('Recently edited', edited, (x) => `${dated(x)} · edited ${whenFmt.format(new Date(x.updated_at))}`),
        ]),
        ...shared,
      ] },
      { id: 'crowkis', name: 'Crowkis', color: '#d92d34', sections: [
        section('overview', 'Overview', 'overview', (p) => [hero('crowkis', `${ratingAvg === null ? 'No ratings yet' : `Rated ${ratingAvg.toFixed(1)} / 5 by ${num(ratingTotal)}`} · ${inboxLine}`), tiles(count(p, 'crowkis', 'views'), count(p, 'crowkis', 'clicks'), time(p, 'crowkis'), count(p, 'crowkis', 'demos')), plot(p, 'crowkis', 'views'), topPages(p, 'crowkis', 5), clicks(p, 'crowkis', 5), starBlock]),
        section('traffic', 'Page views', 'traffic', (p) => traffic(p, 'crowkis', [])),
        section('engagement', 'Engagement', 'engagement', (p) => [
          tiles(count(p, 'crowkis', 'demos'), count(p, 'crowkis', 'plays'), count(p, 'crowkis', 'copies'), rate(p, 'crowkis', 'Demo click rate')),
          plot(p, 'crowkis', 'demos'), plot(p, 'crowkis', 'plays'), plot(p, 'crowkis', 'copies'),
          list('Demo clicks by button', top(buttons, p, 'crowkis'), 'No Book a demo clicks in this period.'),
          list('Most copied code', top(snippets, p, 'crowkis'), 'No snippets copied in this period.'),
        ]),
        ...shared,
      ] },
    ],
    messages: messages.map((m) => ({ id: m.id, name: m.name?.trim() || null, email: m.email?.trim() || null, body: m.message, from: VIA[m.source] || m.source, at: m.created_at, when: whenFmt.format(new Date(m.created_at)) })),
    ratings: ratings.map((r) => ({ id: r.id, stars: r.stars, comment: r.comment?.trim() || null, at: r.created_at, when: whenFmt.format(new Date(r.created_at)) })),
  }
}

const signIn = (error) => doc('Sign in', `<main class="gate"><form method="post" class="gate-card">
  ${marks('tarkova', 'crowkis')}
  <h1>Admin</h1>
  <p class="muted">Sign in to see Tarkova and Crowkis.</p>
  <div class="fields">
    <label><span>Username</span><input name="username" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false" autofocus /></label>
    <label><span>Password</span><input name="password" type="password" required autocomplete="current-password" /></label>
  </div>
  ${error ? `<p class="error" role="alert">${error === 'locked' ? 'Too many attempts. Try again in 10 minutes.' : 'Wrong username or password.'}</p>` : ''}
  <button type="submit">Sign in</button>
</form></main>`)

const doc = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="robots" content="noindex, nofollow" />
<meta name="color-scheme" content="light dark" />
<!-- An app on the iPhone: Safari's "Add to Home Screen" opens this page full screen, under the Tarkova icon. -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Tarkova" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="theme-color" content="#f3f3f7" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0b0b0e" media="(prefers-color-scheme: dark)" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<title>${title} · Tarkova</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<style>${CSS}</style>
</head>
<body>${body}</body>
</html>`

/* ---------- look: the system type, grouped surfaces ruled into cells, one colour per site; light and dark follow the device ---------- */

const CSS = `
/* Hallmark · redesign · genre: modern-minimal · structure: workbench (sidebar, then grouped bands ruled on quarters) · theme: custom (system sans, neutrals tinted to the site's hue, one accent per site) · pre-emit critique: P4 H4 E4 S4 R4 V4 */

/* Tokens. They sit on body, not :root, because the site on show is picked on body (:has(:target)): changing
   --hue and the three accent tokens there re-tints everything derived from them. Every colour below is a token. */
body {
  --hue: 285;
  --tarkova: #5856d6; --tarkova-ink: #4a47c9; --tarkova-bar: #5856d6;
  --crowkis: #d92d34; --crowkis-ink: #bd0e2b; --crowkis-bar: #d92d34;
  --accent: var(--tarkova-ink); --accent-fill: var(--tarkova); --bar: var(--tarkova-bar); --on-accent: oklch(100% 0 0);
  --bg: oklch(96.6% 0.005 var(--hue)); --card: oklch(99.5% 0.002 var(--hue)); --seg: var(--card);
  --ink: oklch(21% 0.012 var(--hue)); --ink2: oklch(48% 0.012 var(--hue));
  --rule: oklch(91.5% 0.005 var(--hue)); --axis: oklch(78% 0.008 var(--hue));
  --fill: oklch(21% 0.012 var(--hue) / 0.06); --fill2: oklch(21% 0.012 var(--hue) / 0.1);
  --tint: color-mix(in oklch, var(--accent-fill) 11%, transparent); --wash: color-mix(in oklch, var(--bar) 14%, transparent);
  --press: color-mix(in oklch, var(--accent-fill) 88%, var(--ink)); --hover: color-mix(in oklch, var(--card) 97%, var(--ink));
  --glass: color-mix(in oklch, var(--bg) 80%, transparent); --tip: color-mix(in oklch, var(--bg) 76%, var(--ink));
  --soft: 13%; --tarkova-soft: color-mix(in oklch, var(--tarkova) var(--soft), transparent); --crowkis-soft: color-mix(in oklch, var(--crowkis) var(--soft), transparent);
  --up: #1a7f37; --down: #c9101c; --star: #e8a200; --star-track: color-mix(in oklch, var(--star) 20%, transparent);
  --lift: 0 1px 2px oklch(21% 0.012 var(--hue) / 0.16); --pop: 0 6px 20px -6px oklch(21% 0.012 var(--hue) / 0.35);
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --r-card: 16px; --r-ctl: 11px; --r-seg: 8px; --pad: 24px; --gap: 16px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
@media (prefers-color-scheme: dark) {
  body {
    --tarkova-ink: #a8a6ff; --tarkova-bar: #7d7aff; --crowkis-ink: #ff8a80; --crowkis-bar: #f0554e;
    --bg: oklch(15% 0.006 var(--hue)); --card: oklch(20.5% 0.008 var(--hue)); --seg: oklch(33% 0.01 var(--hue));
    --ink: oklch(95% 0.004 var(--hue)); --ink2: oklch(72% 0.01 var(--hue));
    --rule: oklch(27.5% 0.008 var(--hue)); --axis: oklch(42% 0.008 var(--hue));
    --fill: oklch(95% 0.004 var(--hue) / 0.08); --fill2: oklch(95% 0.004 var(--hue) / 0.14);
    --soft: 24%; --tint: color-mix(in oklch, var(--accent-fill) 26%, transparent); --wash: color-mix(in oklch, var(--bar) 22%, transparent);
    --up: #3ecf5e; --down: #ff6b63; --star: #ffd60a;
    --lift: 0 1px 2px oklch(0% 0 0 / 0.5); --pop: 0 6px 20px -6px oklch(0% 0 0 / 0.6);
  }
}
/* each site has its own colour and its own temperature of grey: Tarkova indigo and cool (above), Crowkis ember and warm */
body:has(.view[data-site="crowkis"]:target) { --hue: 35; --accent: var(--crowkis-ink); --accent-fill: var(--crowkis); --bar: var(--crowkis-bar); }

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; overflow-x: clip; scroll-behavior: auto; }
body { margin: 0; overflow-x: clip; background: var(--bg); color: var(--ink); font: 400 15px/1.45 var(--font); letter-spacing: -0.008em; -webkit-font-smoothing: antialiased; }
h1, h2, h3, p, ul, ol { margin: 0; padding: 0; }
ul, ol { list-style: none; }
a { color: var(--accent); text-decoration: none; }
a, button, label, summary { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
time { white-space: nowrap; }
.muted { color: var(--ink2); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* a site's mark: its logo in white on a tile of its colour. --m is the tile's size. */
.mark { --m: 20px; flex: none; display: inline-grid; place-items: center; width: var(--m); height: var(--m); border-radius: calc(var(--m) * 0.28); color: var(--on-accent); }
.mark.tarkova { background: var(--tarkova); }
.mark.crowkis { background: var(--crowkis); }
.mark svg { width: 62%; height: 62%; fill: currentColor; }
.mark.crowkis svg { width: 74%; height: 74%; }
.marks { display: inline-flex; flex: none; gap: 6px; }

/* frame: sidebar beside the content; under 900px the sidebar becomes a top bar with a row of tabs */
.app { display: flex; min-height: 100dvh; }
.side { position: sticky; top: 0; z-index: 5; flex: none; display: flex; flex-direction: column; width: 248px; height: 100dvh; padding: 20px 12px 16px; border-right: 1px solid var(--rule); }
/* the website switch: a segmented control; the site on show is the one whose section the #hash names */
.switch { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; border-radius: var(--r-ctl); background: var(--fill); }
.switch a { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 36px; padding: 0 10px; border-radius: var(--r-seg); color: var(--ink2); font-size: 14px; font-weight: 500; white-space: nowrap; }
.switch a:hover { color: var(--ink); }
body:has(.view[data-site="crowkis"]:target) .switch a[href="#crowkis"], body:not(:has(.view[data-site="crowkis"]:target)) .switch a[href="#tarkova"] { background: var(--seg); box-shadow: var(--lift); color: var(--ink); font-weight: 600; }
.side nav { display: none; flex-direction: column; gap: 2px; margin-top: 20px; }
body:has(.view[data-site="crowkis"]:target) nav[data-site="crowkis"], body:not(:has(.view[data-site="crowkis"]:target)) nav[data-site="tarkova"] { display: flex; }
.group { margin: 20px 0 4px; padding: 0 12px; color: var(--ink2); font-size: 12px; font-weight: 500; }
.side nav a { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 12px; border-radius: var(--r-seg); background: var(--on, transparent); color: var(--on-ink, var(--ink)); font-size: 14px; font-weight: 500; white-space: nowrap; }
.side nav a:hover { background: var(--on, var(--fill)); }
.side nav a:active { background: var(--on, var(--fill2)); }
.side nav svg { flex: none; width: 18px; height: 18px; color: var(--on-ink, var(--ink2)); }
.side nav b { margin-left: auto; color: var(--on-ink, var(--ink2)); font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }
.side-foot { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: auto; }
.side-foot p { grid-column: 1 / -1; padding: 0 12px 4px; color: var(--ink2); font-size: 12px; }
.side-foot button { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 36px; padding: 0 12px; border: 0; border-radius: var(--r-seg); background: var(--fill); color: var(--ink); font: 500 13px var(--font); white-space: nowrap; cursor: pointer; }
.side-foot button:hover { background: var(--fill2); }
.side-foot button:active { transform: translateY(1px); }
.side-foot svg { width: 15px; height: 15px; }
main { flex: 1; min-width: 0; padding: 32px clamp(20px, 3.5vw, 48px) 72px; }
/* a container, so the bands below fold by the room they have, not by the window (the sidebar comes and goes) */
.wrap { position: relative; max-width: 1120px; margin: 0 auto; container-type: inline-size; }

/* the period control: radio buttons drawn as a segmented control. Each period's blocks are in the page as
   [data-r]; only the checked period's are shown. Hidden on sections with nothing that follows a period.
   z-index: each .view animates in, which lifts it into its own layer; without this the section (its header on
   desktop, its own box on phones) would lie over the control and take its clicks. */
.range { position: absolute; z-index: 2; top: 11px; right: 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(44px, 1fr); gap: 2px; margin: 0; padding: 3px; border: 0; border-radius: var(--r-ctl); background: var(--fill); }
.range span { display: grid; place-items: center; min-height: 28px; padding: 0 8px; border-radius: var(--r-seg); color: var(--ink2); font-size: 13px; font-weight: 500; cursor: pointer; }
.range span:hover { color: var(--ink); }
.range input { position: absolute; opacity: 0; pointer-events: none; }
.range input:checked + span { background: var(--seg); box-shadow: var(--lift); color: var(--ink); font-weight: 600; }
.range input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 1px; }
.wrap:has(.view:target:not(:has([data-r]))) .range, .wrap:not(:has([data-r])) .range { display: none; }
[data-r] { display: none; }
${RANGES.map((r) => `body:has(#r-${r.key}:checked) [data-r="${r.key}"]`).join(', ')} { display: contents; }

/* one section on show at a time; see shell() */
.view { display: none; grid-template-columns: minmax(0, 1fr); gap: var(--gap); scroll-margin-top: 100vh; }
.view:target, .wrap:not(:has(.view:target)) > #tarkova { display: grid; animation: show 0.24s var(--ease-out) both; }
@keyframes show { from { opacity: 0; } }
.view > header { display: flex; align-items: center; gap: 12px; min-height: 56px; margin-bottom: 8px; }
.view > header > div { min-width: 0; }
.view > header .mark { --m: 44px; }
.eyebrow { color: var(--ink2); font-size: 13px; font-weight: 500; line-height: 1.3; }
h1 { font-size: 32px; font-weight: 700; line-height: 1.12; letter-spacing: -0.024em; overflow-wrap: anywhere; }
.hello { max-width: 64ch; margin: -4px 0 4px; color: var(--ink2); font-size: 17px; line-height: 1.4; letter-spacing: -0.014em; }
.hello b { color: var(--ink); font-weight: 600; }

/* A strip of numbers: one surface, ruled into cells by the 1px gaps. Each tile's label, value, note and trend
   sit on rows it borrows from the strip (subgrid), so the four line up across tiles however a label wraps.
   The first number of a section (.lead) is set on the site's colour. */
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; border-radius: var(--r-card); background: var(--rule); box-shadow: 0 0 0 1px var(--rule); overflow: hidden; }
.stats.three > :first-child { grid-column: span 2; }
.stat { display: grid; grid-template-rows: subgrid; grid-row: span 4; row-gap: 0; align-content: start; min-width: 0; padding: 20px var(--pad); background: var(--card); color: var(--ink); }
a.stat:is(:hover, :active) { background: var(--hover); }
a.stat:focus-visible { outline-offset: -3px; }
.stats.lead > :first-child { --card: var(--accent-fill); --hover: var(--press); --ink: var(--on-accent); --ink2: var(--on-accent); --bar: var(--on-accent); --up: var(--on-accent); --down: var(--on-accent); outline-color: var(--on-accent); }
.stat-label { display: flex; align-items: center; gap: 8px; color: var(--ink2); font-size: 13px; font-weight: 500; line-height: 1.3; }
.stat-label .mark { --m: 16px; }
.stat-value { margin-top: 8px; font-size: 30px; font-weight: 600; line-height: 1.1; letter-spacing: -0.022em; }
.stat-value.zero { color: var(--ink2); font-weight: 500; }
.stat-value small { color: var(--ink2); font-size: 0.5em; font-weight: 500; letter-spacing: 0; }
.stat-note { margin-top: 4px; color: var(--ink2); font-size: 13px; line-height: 1.35; }
.delta { margin-left: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0; white-space: nowrap; vertical-align: 0.32em; }
.delta > :first-child { font-size: 0.72em; }
.delta.up { color: var(--up); }
.delta.down { color: var(--down); }
.spark { position: relative; display: block; height: 28px; margin-top: 16px; }
.spark svg { display: block; width: 100%; height: 100%; overflow: visible; }
.spark polyline { fill: none; stroke: var(--bar); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.spark polygon { fill: var(--bar); opacity: 0.1; }
.spark i { position: absolute; right: -4px; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--bar); box-shadow: 0 0 0 2px var(--card); }

/* Panels. One alone is a surface; two side by side (.grid.two) share one, ruled down the middle, so a short list
   beside a long one leaves quiet space and never a ragged pair of cards. .multiples stacks small charts on one
   time axis, each with its title in the first quarter. */
.panel { min-width: 0; padding: 20px var(--pad) var(--pad); border-radius: var(--r-card); background: var(--card); box-shadow: 0 0 0 1px var(--rule); }
.grid, .multiples { display: grid; grid-template-columns: minmax(0, 1fr); border-radius: var(--r-card); background: var(--card); box-shadow: 0 0 0 1px var(--rule); }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.stack { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; min-width: 0; }
:is(.grid, .stack, .multiples) > * { border-radius: 0; background: none; box-shadow: none; }
.grid.two > * + * { border-left: 1px solid var(--rule); }
:is(.stack, .multiples) > * + * { border-top: 1px solid var(--rule); }
.multiples > .panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 3fr); gap: var(--pad); }
.multiples .panel-head { display: block; margin: 0; }
.multiples .panel-head p { margin-top: 4px; }
.multiples .plot { padding-top: 8px; }
.panel-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 2px 16px; margin-bottom: 16px; }
h2 { font-size: 16px; font-weight: 600; line-height: 1.3; letter-spacing: -0.012em; }
.panel-head p { color: var(--ink2); font-size: 13px; }
.panel-head a { font-weight: 500; }
:is(.panel-head, .msg-from) a:hover { text-decoration: underline; text-underline-offset: 2px; }
.lede { max-width: 60ch; color: var(--ink2); }
.empty { display: flex; align-items: baseline; gap: 8px; color: var(--ink2); font-size: 14px; }
.empty::before { content: ""; flex: none; width: 7px; height: 7px; border: 1.5px solid var(--axis); border-radius: 50%; }
details.panel { padding: 0; }
details.panel > summary { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 var(--pad); border-radius: var(--r-card); font-size: 14px; font-weight: 500; list-style: none; cursor: pointer; }
details.panel > summary::-webkit-details-marker { display: none; }
details.panel > summary::before { content: ""; width: 7px; height: 7px; margin-left: 2px; border: solid var(--ink2); border-width: 0 1.5px 1.5px 0; transform: rotate(-45deg); transition: transform 0.15s var(--ease-out); }
details.panel[open] > summary::before { transform: rotate(45deg); }
details.panel > .scroll { padding: 0 var(--pad) 20px; }

/* column chart: one hue, thin columns with air between them, hairline grid, labels in the text colours */
.plot { display: flex; gap: 8px; padding-top: 16px; }
.yaxis { position: relative; flex: none; width: 28px; color: var(--ink2); font-size: 11px; font-variant-numeric: tabular-nums; }
.yaxis span { position: absolute; right: 0; line-height: 1; transform: translateY(-50%); }
.yaxis span:nth-child(1) { top: 0; } .yaxis span:nth-child(2) { top: 50%; } .yaxis span:nth-child(3) { top: 100%; }
.cols { position: relative; flex: 1; display: flex; min-width: 0; height: 208px; border-bottom: 1px solid var(--axis); background: linear-gradient(var(--rule), var(--rule)) top / 100% 1px no-repeat, linear-gradient(var(--rule), var(--rule)) center / 100% 1px no-repeat; }
.chart.small .cols { height: 112px; }
.col { position: relative; flex: 1; display: flex; align-items: flex-end; justify-content: center; height: 100%; padding: 0 1px; border-radius: 4px 4px 0 0; outline-offset: -2px; }
.col:is(:hover, :focus-visible) { background: var(--fill); }
.col > i { width: 100%; max-width: 24px; border-radius: 3px 3px 0 0; background: var(--bar); transform-origin: bottom; animation: grow 0.5s var(--ease-out) calc(var(--i) * 10ms) both; }
@keyframes grow { from { transform: scaleY(0); } }
.peak { position: absolute; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 600; line-height: 1; white-space: nowrap; }
.tip { display: none; position: absolute; left: 50%; z-index: 2; transform: translateX(-50%); padding: 8px 12px; border-radius: var(--r-seg); background: var(--ink); box-shadow: var(--pop); color: var(--tip); font-size: 12px; line-height: 1.35; white-space: nowrap; pointer-events: none; }
.tip strong { display: block; color: var(--bg); font-weight: 600; }
.tip.from-left { left: 0; transform: none; } .tip.from-right { left: auto; right: 0; transform: none; }
.col:is(:hover, :focus-visible) .tip { display: block; }
.xaxis { display: flex; height: 14px; margin: 8px 0 0 36px; color: var(--ink2); font-size: 11px; }
.xaxis span { position: relative; flex: 1; }
.xaxis em { position: absolute; left: 50%; transform: translateX(-50%); font-style: normal; line-height: 1; white-space: nowrap; }
.xaxis em.now { color: var(--ink); font-weight: 600; }
.xaxis em.end { left: auto; right: 0; transform: none; }
/* nothing in the period: the plot folds down to its baseline, so a quiet site reads as quiet and not as broken */
.chart.flat .plot { padding-top: 0; }
.chart.flat .cols { height: 28px; background: none; pointer-events: none; }
.chart.flat .yaxis span:not(:last-child) { display: none; }

/* lists */
.rank { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; margin: 0 -8px; }
.rank li { position: relative; display: flex; align-items: center; gap: 16px; min-height: 34px; padding: 0 8px; font-size: 14px; }
.rank li::before { content: ""; position: absolute; inset: 2px auto 2px 0; width: max(var(--p), 6px); border-radius: 6px; background: var(--wash); }
.rank span { position: relative; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank.mono span { font: 13px var(--mono); letter-spacing: 0; }
.rank b { position: relative; font-weight: 600; font-variant-numeric: tabular-nums; }
.posts li, .rated li, .msg { padding: 12px 0; border-top: 1px solid var(--rule); }
:is(.posts, .rated, .msgs) > li:first-child { padding-top: 0; border-top: 0; }
:is(.posts, .rated, .msgs) > li:last-child { padding-bottom: 0; }
.posts h3 { margin: 0; font-size: 15px; font-weight: 500; line-height: 1.35; }
.posts p { margin-top: 2px; color: var(--ink2); font-size: 13px; }
.posts b { color: var(--ink); font-weight: 600; }
.rated div { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2px 12px; color: var(--ink2); font-size: 13px; }
.rated p { margin-top: 4px; font-size: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.stars { color: var(--star); font-size: 14px; letter-spacing: 0.1em; line-height: 1; white-space: nowrap; }
.stars i { color: var(--axis); font-style: normal; opacity: 0.5; }
.dist { display: grid; gap: 12px; }
.dist li { display: grid; grid-template-columns: 30px minmax(0, 1fr) 28px 38px; align-items: center; gap: 12px; font-size: 13px; line-height: 1.2; font-variant-numeric: tabular-nums; }
.dist li > span:first-child { color: var(--ink2); }
.track { height: 6px; border-radius: 99px; background: var(--star-track); }
.track i { display: block; height: 100%; border-radius: 99px; background: var(--star); }
.dist b { text-align: right; font-weight: 600; }
.dist em { color: var(--ink2); font-style: normal; text-align: right; }

/* messages */
.msg { display: flex; gap: 12px; padding-block: 16px; }
.avatar { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; font-size: 14px; font-weight: 600; }
.avatar.tarkova { background: var(--tarkova-soft); color: var(--tarkova-ink); }
.avatar.crowkis { background: var(--crowkis-soft); color: var(--crowkis-ink); }
.msg-main { flex: 1; min-width: 0; }
.msg-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; color: var(--ink2); font-size: 13px; }
.msg-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-size: 15px; font-weight: 600; }
.msg-from { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin-top: 1px; font-size: 14px; }
.msg-from a { overflow-wrap: anywhere; }
.badge { padding: 1px 8px; border-radius: 6px; background: var(--fill); color: var(--ink2); font-size: 12px; font-weight: 500; white-space: nowrap; }
.msg-body { max-width: 70ch; margin-top: 8px; white-space: pre-wrap; overflow-wrap: anywhere; }
.brief .msg-body { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }

/* table */
.scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table { width: 100%; min-width: 460px; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }
th, td { padding: 8px 0 8px 16px; border-top: 1px solid var(--rule); text-align: right; font-weight: 400; white-space: nowrap; }
thead th { border-top: 0; color: var(--ink2); font-size: 12px; font-weight: 500; }
:is(th, td):first-child { padding-left: 0; text-align: left; }

/* sign in: a narrow column in the middle of the page, set from its left edge */
.gate { display: grid; place-items: center; min-height: 100dvh; padding: 24px 24px 12vh; }
.gate-card { width: 100%; max-width: 340px; }
.gate-card .mark { --m: 48px; }
.gate-card h1 { margin-top: 20px; font-size: 28px; }
.gate-card > p { margin-top: 4px; }
.fields { margin-top: 24px; border-radius: 12px; background: var(--card); box-shadow: 0 0 0 1px var(--rule); }
.fields label { display: flex; align-items: center; }
.fields label:first-child { border-radius: 12px 12px 0 0; }
.fields label:last-child { border-radius: 0 0 12px 12px; }
.fields label + label { border-top: 1px solid var(--rule); }
.fields label:focus-within { outline: 2px solid var(--accent); outline-offset: -1px; }
.fields span { flex: none; width: 104px; padding-left: 16px; font-size: 15px; }
.fields input { flex: 1; min-width: 0; height: 48px; padding: 0 16px 0 0; border: 0; background: transparent; color: var(--ink); font: 400 16px var(--font); outline: none; }
.gate-card .error { margin-top: 12px; color: var(--down); font-size: 14px; font-weight: 500; }
.gate-card button { width: 100%; min-height: 46px; margin-top: 16px; border: 0; border-radius: 12px; background: var(--accent-fill); color: var(--on-accent); font: 600 16px var(--font); cursor: pointer; }
.gate-card button:hover { background: var(--press); }
.gate-card button:active { transform: translateY(1px); }

/* The bands fold by the width of the content column. Under 720px a strip is two tiles wide and the paired
   panels stack; under 560px (a phone) the period control drops under the title and everything tightens. */
@container (max-width: 720px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .multiples > .panel { display: block; }
  .multiples .panel-head { display: flex; margin-bottom: 16px; }
  .multiples .panel-head p { margin-top: 0; }
  .grid.two { grid-template-columns: minmax(0, 1fr); }
  .grid.two > * + * { border-left: 0; border-top: 1px solid var(--rule); }
}
@container (max-width: 560px) {
  .wrap > * { --pad: 16px; --gap: 12px; }
  .range { top: 60px; left: 0; }
  .view > header { min-height: 48px; margin-bottom: 4px; }
  .view:has([data-r]) > header { margin-bottom: 52px; }
  .view > header .mark { --m: 40px; }
  h1 { font-size: 28px; }
  .hello { margin: 0 0 4px; font-size: 16px; }
  .stat { padding-block: 16px; }
  .stat-value { font-size: 26px; }
  .panel { padding-top: 16px; }
  .cols { height: 168px; }
  .xaxis { letter-spacing: -0.02em; }
  .avatar { width: 32px; height: 32px; font-size: 13px; }
}
@media (pointer: coarse) { .range span { min-height: 34px; } }
/* the narrowest phones: the site not on show keeps its mark and gives up its name, so Sign out stays on the bar */
@media (max-width: 360px) {
  .switch { grid-auto-columns: auto; }
  body:has(.view[data-site="crowkis"]:target) .switch a[href="#tarkova"], body:not(:has(.view[data-site="crowkis"]:target)) .switch a[href="#crowkis"] { gap: 0; font-size: 0; }
}
/* Phones and small tablets: an app. A top bar with the website switch, and the sections as a tab bar along the
   bottom, as on iOS. The frosted backgrounds sit on ::before, because a backdrop-filter on .side itself would
   trap the fixed tab bar inside it. */
@media (max-width: 900px) {
  .app { display: block; }
  .side { flex-flow: row nowrap; align-items: center; gap: 8px; width: auto; height: auto; padding: max(10px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left)); border: 0; }
  .side::before, .side nav::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--glass); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px); }
  .side::before { border-bottom: 1px solid var(--rule); }
  .switch { flex: 1; max-width: 300px; margin-right: auto; }
  .side nav { position: fixed; inset: auto 0 0; z-index: 5; flex-direction: row; gap: 0; margin: 0; padding: 4px max(6px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left)); -webkit-user-select: none; user-select: none; }
  .side nav::before { border-top: 1px solid var(--rule); }
  .side nav a { flex: 1; flex-direction: column; justify-content: center; gap: 3px; min-width: 0; min-height: 48px; padding: 4px 2px; background: none; color: var(--tab, var(--ink2)); font-size: 10px; font-weight: 600; letter-spacing: 0; }
  .side nav a:hover { background: none; }
  .side nav svg { width: 24px; height: 24px; color: inherit; }
  .side nav a span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .side nav b, .group { display: none; }
  .side-foot { display: flex; margin: 0; }
  .side-foot p, .side-foot form:first-of-type span { display: none; }
  .side-foot button { width: auto; min-height: 42px; padding: 0 12px; border-radius: var(--r-ctl); }
  .side-foot form:first-of-type button { width: 42px; padding: 0; }
  main { padding: 20px max(16px, env(safe-area-inset-right)) calc(88px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`

/* ---------- handler ---------- */

export const admin = (env) => async (req, res) => {
  const send = (status, html, headers = {}) => {
    res.writeHead(status, {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow',
      // Not no-referrer: under it browsers send "Origin: null" with the sign-in form, and the check below refuses that.
      // same-origin still keeps this address (the key is in it) from ever reaching another site.
      'Referrer-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
      // No scripts at all, so a message that slipped past escaping still could not run anything.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      ...headers,
    })
    res.end(req.method === 'HEAD' ? undefined : html)
  }
  // The phone app (app/) asks for JSON with ?format=json: the same checks, answers and cookie, without the HTML.
  const json = (status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers })
    res.end(JSON.stringify(body))
  }
  // Vercel hands the rewritten path segment over as ?key=; in dev it is still in the path.
  const url = new URL(req.originalUrl || req.url, 'http://x')
  const key = req.query?.key ?? url.searchParams.get('key') ?? url.pathname.match(/^\/admin\/([^/]+)\/?$/)?.[1] ?? ''
  if (typeof key !== 'string' || !keyOk(env, key)) return send(404, 'Not found') // before any database access
  const home = `/admin/${encodeURIComponent(key)}/`
  const app = url.searchParams.get('format') === 'json'
  const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`
  const go = (to, headers = {}) => send(303, '', { Location: to, ...headers })

  if (req.method === 'POST') {
    let origin
    try { origin = new URL(req.headers.origin).host } catch {}
    // From our own page, or from the app: it has no Origin, and says who it is with a header that a web page on
    // another site cannot add to a form or to a request we give no CORS permission for.
    if (origin !== req.headers.host && !(app && !origin && req.headers['x-requested-with'] === 'tarkova-app')) return send(403, 'Not allowed from here.')
    let data
    try { data = await form(req) } catch { return send(400, 'That did not arrive in one piece.') }
    if (data.action === 'logout') return app ? json(200, { ok: true }, { 'Set-Cookie': cookie('', 0) }) : go(home, { 'Set-Cookie': cookie('', 0) })
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim()
    if (locked(ip)) return app ? json(429, { error: 'Too many attempts. Try again in 10 minutes.' }) : go(`${home}?error=locked`)
    if (!loginOk(env, String(data.username ?? ''), String(data.password ?? ''))) return app ? json(401, { error: 'Wrong username or password.' }) : go(`${home}?error=1`)
    const exp = String(Date.now() + MAX_AGE * 1000)
    const session = { 'Set-Cookie': cookie(`${exp}.${sign(env, exp)}`, MAX_AGE) }
    return app ? json(200, { ok: true }, session) : go(home, session)
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'GET or POST only.', { Allow: 'GET, HEAD, POST' })
  if (!signedIn(env, req)) return app ? json(401, { error: 'Sign in first.' }) : send(200, signIn(url.searchParams.get('error')))

  let page
  try {
    const data = await load(env.SUPABASE_DB_URL)
    page = app ? appData(data) : dashboard(data)
  } catch (e) {
    console.error(`admin: ${e.message}`) // the reason stays in the server log
    return app ? json(503, { error: 'The numbers could not be loaded. Try again in a minute.' }) : send(503, unavailable())
  }
  app ? json(200, page) : send(200, page)
}

export default admin(process.env)
