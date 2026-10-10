// Runs the app's own src/api.ts against a real server: signed-out read, wrong key, sign in, read, sign out.
// Exactly ONE sign-in attempt (the server allows five in ten minutes). Prints results, never the credentials.
//
//   node scripts/api-check.mjs [server]        default http://localhost:5174; reads ADMIN_* from ../.env
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const here = (p) => new URL(p, import.meta.url)
const env = Object.fromEntries(readFileSync(here('../../.env'), 'utf8').split('\n').map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]))
const server = process.argv[2] || 'http://localhost:5174'

// Node's fetch keeps no cookies; the iPhone does. This is the smallest jar that stands in for it.
const jar = new Map()
const plain = globalThis.fetch
globalThis.fetch = async (url, init = {}) => {
  const res = await plain(url, { ...init, headers: { ...init.headers, ...(jar.size ? { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}) } })
  for (const line of res.headers.getSetCookie()) {
    const [name, value] = line.split(';')[0].split('=')
    ;/max-age=0\b/i.test(line) ? jar.delete(name) : jar.set(name, value)
  }
  return res
}

const js = ts.transpileModule(readFileSync(here('../src/api.ts'), 'utf8'), { compilerOptions: { module: 'ESNext', target: 'ES2022' } }).outputText
const api = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const creds = api.tidy({ server: ` ${server}/ `, key: ` ${env.ADMIN_KEY} `, username: env.ADMIN_USER, password: env.ADMIN_PASSWORD })

let failed = 0
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); if (!ok) failed++ }
const fails = async (name, run, status, text) => {
  try { await run(); check(name, false, 'no error') } catch (e) { check(name, e.status === status && e.message.includes(text), `${e.status}: ${e.message}`) }
}

check('tidy() cleans the server address', creds.server === server.replace(/\/+$/, ''))
await fails('read before signing in', () => api.getFeed(creds), 401, 'Sign in first')
await fails('wrong admin key', () => api.getFeed({ ...creds, key: 'not-the-key' }), 404, 'did not recognise that admin key')
await fails('unreachable server', () => api.getFeed({ ...creds, server: 'http://127.0.0.1:9' }), 0, 'Could not reach 127.0.0.1:9')

try {
  await api.signIn(creds)
  check('sign in', jar.size === 1, 'session cookie received')
  const feed = await api.getFeed(creds)
  const blocks = feed.sites.flatMap((s) => s.sections.flatMap((x) => Object.values(x.blocks).flat()))
  const types = [...new Set(blocks.map((b) => b.type))]
  const drawn = ['hero', 'tiles', 'chart', 'list', 'posts', 'stars', 'messages', 'ratings']
  check('read the feed', feed.periods.length > 0 && feed.periods.some((p) => p.key === feed.defaultPeriod), `${feed.sites.map((s) => `${s.name}: ${s.sections.length} sections`).join(', ')}; ${blocks.length} blocks`)
  check('every block type is one the app draws', types.every((t) => drawn.includes(t)), types.join(' '))
  await api.signOut(creds)
  check('sign out', jar.size === 0, 'session cookie cleared')
  await fails('read after signing out', () => api.getFeed(creds), 401, 'Sign in first')
} catch (e) {
  check('sign in, read, sign out', false, `${e.status}: ${e.message}`)
}
process.exit(failed ? 1 : 0)
