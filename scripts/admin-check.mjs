// End-to-end check of the owner's dashboard (api/admin.js) and its event counter (api/track.js) against the
// local dev server.
//   npm run dev                      (in another terminal)
//   node --env-file=.env scripts/admin-check.mjs [http://localhost:5173]
// It signs in with ADMIN_USER / ADMIN_PASSWORD from .env. The one event it records is deleted at the end.
// Each run makes three sign-in attempts, and five in ten minutes locks sign-in, so do not run it in a loop.
import assert from 'node:assert/strict'
import pg from 'pg'

const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '')
const { ADMIN_KEY: key, ADMIN_USER: user, ADMIN_PASSWORD: pass, SUPABASE_DB_URL: dbUrl } = process.env
const home = `${base}/admin/${key}/`
const CHECK_PATH = '/__admin-check/'
const post = (body, headers = {}) => fetch(home, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: base, ...headers }, body: new URLSearchParams(body) })
const beacon = (body, origin = base) => fetch(`${base}/api/track/`, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8', ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) })

const db = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await db.connect()
const tidy = () => db.query(`delete from events where path = $1 and left(name, 8) = 'tarkova_'`, [CHECK_PATH])
let failed = false
try {
  // Nobody gets in, or learns anything, without the key and a session.
  assert.equal((await fetch(`${base}/admin/not-the-key-0123456789/`)).status, 404, 'a wrong key is a 404')
  assert.equal((await fetch(`${base}/admin/`)).status, 404, 'no key is a 404')
  const gate = await fetch(home)
  const gateHtml = await gate.text()
  assert.match(gateHtml, /name="password"/, 'signed out shows the sign-in form')
  assert.doesNotMatch(gateHtml, /class="msg"|mailto:/, 'and no data')
  assert.match(gate.headers.get('content-security-policy'), /default-src 'none'/)
  // Under no-referrer browsers send "Origin: null" with the sign-in form, which the handler refuses.
  assert.notEqual(gate.headers.get('referrer-policy'), 'no-referrer', 'the sign-in form can still send its Origin')
  assert.equal((await post({ username: user, password: pass }, { Origin: 'https://evil.example' })).status, 403, 'another site cannot post')
  const bad = await post({ username: user, password: 'wrong-password-wrong' })
  assert.doesNotMatch(bad.headers.get('location') || '', /locked/, 'sign-in is locked (five tries in ten minutes): wait ten minutes, or restart the dev server, and run this again')
  assert.match(bad.headers.get('location'), /error=1$/, 'a wrong password goes back to the form')
  assert.equal(bad.headers.get('set-cookie'), null, 'and sets no cookie')
  const forged = await fetch(home, { headers: { Cookie: `tarkova_admin=${Date.now() + 1e6}.${'0'.repeat(64)}` } })
  assert.match(await forged.text(), /name="password"/, 'a forged cookie is refused')

  // The right sign-in shows every section of both sites, with nothing broken in it.
  const ok = await post({ username: user, password: pass })
  assert.equal(ok.status, 303, 'the right sign-in redirects')
  assert.match(ok.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/)
  const Cookie = ok.headers.get('set-cookie').split(';')[0]
  const page = await fetch(home, { headers: { Cookie } })
  const html = await page.text()
  assert.equal(page.status, 200)
  for (const id of ['tarkova', 'tarkova-traffic', 'tarkova-blog', 'tarkova-messages', 'tarkova-ratings', 'crowkis', 'crowkis-traffic', 'crowkis-engagement', 'crowkis-messages', 'crowkis-ratings']) assert.match(html, new RegExp(`<section class="view" id="${id}" `), `section ${id}`)
  for (const r of ['1w', '1m', '3m', '6m', '1y', '5y']) assert.match(html, new RegExp(`id="r-${r}"`), `period ${r}`)
  assert.doesNotMatch(html, /<script/i, 'the page carries no script')
  assert.doesNotMatch(html, /<a href="(?!#|mailto:)/, 'no link leaves the admin')
  assert.doesNotMatch(html, /undefined|NaN|\[object|Invalid Date/, 'no broken values in the page')
  assert.match((await post({ action: 'logout' }, { Cookie })).headers.get('set-cookie'), /Max-Age=0/, 'sign out clears the cookie')

  // The phone app's JSON (?format=json): the same gate, and the same sections, as data.
  const api = `${home}?format=json`
  const asApp = { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'tarkova-app' }
  assert.equal((await fetch(api)).status, 401, 'no session, no JSON')
  assert.equal((await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ username: user, password: pass }) })).status, 403, 'a sign-in with neither our Origin nor the app header is refused')
  assert.equal((await fetch(api, { method: 'POST', headers: { ...asApp, Origin: 'https://evil.example' }, body: new URLSearchParams({ username: user, password: pass }) })).status, 403, 'another site cannot pose as the app')
  const appIn = await fetch(api, { method: 'POST', headers: asApp, body: new URLSearchParams({ username: user, password: pass }) })
  assert.deepEqual([appIn.status, await appIn.json()], [200, { ok: true }], 'the app signs in')
  const feed = await (await fetch(api, { headers: { Cookie: appIn.headers.get('set-cookie').split(';')[0] } })).json()
  assert.deepEqual(feed.sites.map((x) => [x.id, x.sections.map((sec) => sec.id).join(' ')]), [['tarkova', 'overview traffic blog messages ratings'], ['crowkis', 'overview traffic engagement messages ratings']])
  for (const site of feed.sites) for (const sec of site.sections) assert.deepEqual(Object.keys(sec.blocks), feed.periods.map((x) => x.key), `${site.id} ${sec.id} has every period`)
  assert.doesNotMatch(JSON.stringify(feed), /undefined|NaN|\[object|Invalid Date|<span|<small/, 'no broken values or markup in the JSON')

  // The event counter takes only our own pages' events, and stores them under Tarkova's name.
  await tidy()
  assert.equal((await fetch(`${base}/api/track/`)).status, 405, 'GET is refused')
  assert.equal((await beacon({ name: 'page_view', path: CHECK_PATH }, 'https://evil.example')).status, 403, 'another site is refused')
  assert.equal((await beacon({ name: 'page_view', path: CHECK_PATH }, null)).status, 403, 'no Origin is refused')
  assert.equal((await beacon({ name: 'arcade_play', path: CHECK_PATH })).status, 400, 'an event that is not ours is refused')
  assert.equal((await beacon({ name: 'page_view', path: 'https://evil.example/<script>' })).status, 400, 'a path that is not a path is refused')
  assert.equal((await beacon({ name: 'time', path: CHECK_PATH, meta: '99999' })).status, 400, 'a time that is not a sane number of seconds is refused')
  assert.equal((await beacon({ name: 'click', path: CHECK_PATH })).status, 400, 'a click that says nothing is refused')
  for (const [name, meta] of [['page_view'], ['click', 'Pick a\u0000 time'], ['time', '42']]) assert.equal((await beacon({ name, path: CHECK_PATH, meta })).status, 204, `${name} is accepted`)
  assert.deepEqual((await db.query(`select name, meta from events where path = $1 order by id`, [CHECK_PATH])).rows, [{ name: 'tarkova_page_view', meta: null }, { name: 'tarkova_click', meta: 'Pick a time' }, { name: 'tarkova_time', meta: '42' }], 'and each is saved once, as a Tarkova event')

  console.log(`admin and event counter: all checks passed (dashboard ${Math.round(html.length / 1024)} KB)`)
} catch (e) {
  failed = true
  console.error(`admin and event counter: FAILED\n${e.message}`)
} finally {
  await tidy()
  await db.end()
}
process.exit(failed ? 1 : 0)
