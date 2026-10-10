// A stand-in for the admin API, for looking at the app in a desktop browser (which cannot call the real one:
// it sends no CORS headers, on purpose). Serves the web build and a fake /admin/ from one origin, so the app
// runs its real sign-in and loading code. No data lives here: pass a saved feed (keep that file out of git).
//
//   npx expo export --platform web --output-dir dist
//   node scripts/preview.mjs path/to/feed.json            then open http://localhost:8099
//
// Admin key "preview", username "demo", password "demo". Key "down" signs in and then answers 503.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const [feedPath, dir = 'dist', port = '8099'] = process.argv.slice(2)
if (!feedPath) { console.error('usage: node scripts/preview.mjs <feed.json> [web-build-dir] [port]'); process.exit(1) }
const feed = readFileSync(feedPath)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' }

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const json = (status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)) }
  const key = url.pathname.match(/^\/admin\/([^/]+)\/?$/)?.[1]

  if (key !== undefined) {
    if (key !== 'preview' && key !== 'down') { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('Not found') }
    if (req.method === 'POST') {
      let body = ''
      for await (const chunk of req) body += chunk
      const form = new URLSearchParams(body)
      if (form.get('action') === 'logout') return json(200, { ok: true }, { 'Set-Cookie': 'preview=; Path=/admin; HttpOnly; Max-Age=0' })
      if (form.get('username') !== 'demo' || form.get('password') !== 'demo') return json(401, { error: 'Wrong username or password.' })
      return json(200, { ok: true }, { 'Set-Cookie': 'preview=1; Path=/admin; HttpOnly' })
    }
    if (!/\bpreview=1\b/.test(req.headers.cookie || '')) return json(401, { error: 'Sign in first.' })
    if (key === 'down') return json(503, { error: 'The numbers could not be loaded. Try again in a minute.' })
    return json(200, feed)
  }

  const file = normalize(url.pathname).replace(/^(\.\.[/\\])+/, '')
  for (const path of [join(dir, file), join(dir, 'index.html')]) {
    try {
      const data = readFileSync(path)
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' })
      return res.end(data)
    } catch {}
  }
  res.writeHead(404).end('Not found')
}).listen(Number(port), '127.0.0.1', () => console.log(`preview on http://localhost:${port}`))
