// End-to-end check of the contact form's endpoint (api/contact.js) against the local dev server.
//   npm run dev                      (in another terminal)
//   node --env-file=.env scripts/contact-check.mjs [http://localhost:5173]
// It posts as made-up visitors (documentation-only IP addresses), reads the result back from the database,
// then deletes every row it created. Local only: on Vercel the platform overwrites x-forwarded-for.
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import pg from 'pg'

const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '')
const dbUrl = process.env.SUPABASE_DB_URL
const EMAIL = 'contact-check@tarkova.invalid'
const ips = ['203.0.113.11', '203.0.113.12', '203.0.113.13', '203.0.113.14']
const key = (ip) => createHmac('sha256', dbUrl).update(ip).digest('hex')
const good = { name: 'Contact check', email: EMAIL, message: 'hello' }

const post = (body, { ip = ips[0], origin = base, type = 'application/json' } = {}) =>
  fetch(`${base}/api/contact/`, {
    method: 'POST',
    headers: { 'Content-Type': type, 'X-Forwarded-For': ip, ...(origin ? { Origin: origin } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const db = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await db.connect()
const tidy = async () => {
  await db.query('delete from feedback where email = $1', [EMAIL])
  await db.query('delete from contact_rate where key = any($1)', [ips.map(key)])
}
const saved = async () => (await db.query(`select name, message, source from feedback where email = $1 order by id`, [EMAIL])).rows
let failed = false
try {
  await tidy()

  // Requests that must never reach the database.
  assert.equal((await fetch(`${base}/api/contact/`)).status, 405, 'GET is refused')
  assert.equal((await post('name=x', { type: 'application/x-www-form-urlencoded' })).status, 415, 'a plain HTML form post is refused')
  assert.equal((await post(good, { origin: null })).status, 403, 'no Origin is refused')
  assert.equal((await post(good, { origin: 'https://evil.example' })).status, 403, 'another site is refused')
  assert.equal((await post({ ...good, message: 'x'.repeat(9000) })).status, 413, 'an oversized body is refused')
  assert.equal((await post('{oops')).status, 400, 'broken JSON is refused')
  assert.equal((await post([good])).status, 400, 'a non-object body is refused')
  assert.equal((await post({ ...good, email: 'nope' })).status, 400, 'a bad email is refused')
  assert.equal((await post({ ...good, name: { $ne: null } })).status, 400, 'a non-string field is refused')
  assert.equal((await post({ ...good, company: 'Acme' })).status, 200, 'the honeypot answers 200')
  assert.equal((await saved()).length, 0, 'and none of the above saved anything')

  // A real message is saved as text: SQL stays inert, control characters go, the message keeps its line breaks.
  const nasty = { name: "Robert'); drop table feedback;--\r\nBcc: x@y.z", email: EMAIL, message: 'line one\nline two\u0000<script>alert(1)</script>' }
  assert.equal((await post(nasty)).status, 200, 'a valid message is accepted')
  assert.deepEqual(await saved(), [{ name: "Robert'); drop table feedback;--Bcc: x@y.z", message: 'line one\nline two<script>alert(1)</script>', source: 'tarkova' }])

  // Rate limits.
  const again = await post(good)
  assert.equal(again.status, 429, 'a second message within a minute is refused')
  assert.equal(again.headers.get('retry-after'), '60')
  assert.equal((await post(good, { ip: ips[1] })).status, 200, 'another visitor is not affected')
  const burst = await Promise.all(Array.from({ length: 6 }, () => post(good, { ip: ips[2] })))
  assert.deepEqual(burst.map((r) => r.status).sort(), [200, 429, 429, 429, 429, 429], 'of six at once from one visitor, one gets through')
  await db.query(`insert into contact_rate (key, created_at) select $1, now() - interval '2 hours' from generate_series(1, 5)`, [key(ips[3])])
  const sixth = await post(good, { ip: ips[3] })
  assert.equal(sixth.status, 429, 'a sixth message in a day is refused')
  assert.equal(sixth.headers.get('retry-after'), '86400')
  assert.equal((await saved()).length, 3, 'three messages saved in all')

  console.log('contact endpoint: all checks passed')
} catch (e) {
  failed = true
  console.error(`contact endpoint: FAILED\n${e.message}`)
} finally {
  await tidy()
  await db.end()
}
process.exit(failed ? 1 : 0)
