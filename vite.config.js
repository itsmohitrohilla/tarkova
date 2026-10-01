import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'

// Tarkova mark (tarkova-assets/Logo/SVG/Logo_Mark/Artboard_37.svg) scaled from its
// 1000-unit artboard into the 24-unit box ThreeUI's outline study samples.
const TARKOVA_MARK =
  'M11.64 18.31L7.44 18.31L12.36 5.69L16.56 5.69Z' +
  'M18.31 12C17.63 13.74 15.66 15.15 13.92 15.15L16.38 8.85C18.13 8.85 18.99 10.26 18.31 12Z' +
  'M10.08 8.85L7.62 15.15C5.87 15.15 5.01 13.74 5.69 12C6.37 10.26 8.34 8.85 10.08 8.85Z'

// ponytail: string swap on the package's bundled source; re-check if @designcodeio/threeui is upgraded.
const tarkovaOutline = {
  name: 'tarkova-outline-typeflow',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('text-path-studies/sources/text-on-a-path-ii.html')) return
    const out = code
      .replace(/var D_OPENAI\s*=\s*"[^"]*";/, `var D_OPENAI = "${TARKOVA_MARK}";`)
      .replace('var PHRASE = "codexreadsthepathandwritesitbackagain";', 'var PHRASE = "tarkova";')
      // See-through ground so the hero photo shows behind the letters. The wrapper
      // injects its own !important backgrounds, so these win on specificity.
      .replace('</head>', '<style>html body, html body .frame { background: transparent !important; }</style></head>')
    if (!out.includes(TARKOVA_MARK) || !out.includes('var PHRASE = "tarkova";')) this.error('ThreeUI outline path or phrase not found; the package source changed')
    return out
  },
}

// Same idea for the particle wordmark: its adapter injects ThreeUI's wordmark (`he`);
// src/tarkova-wordmark.svg is Wordmark/Artboard_42.svg cropped to the letters.
const WORDMARK_FILE = new URL('./src/tarkova-wordmark.svg', import.meta.url)
const tarkovaWordmark = {
  name: 'tarkova-particle-wordmark',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('neuform-isolated/NeuformIsolatedEffects')) return
    // Read per transform and watch it, so swapping the SVG shows up without a server restart.
    this.addWatchFile(WORDMARK_FILE.pathname)
    const TARKOVA_WORDMARK = readFileSync(WORDMARK_FILE, 'utf8').trim()
    const out = code
      .replace(/\bhe = `<svg[\s\S]*?<\/svg>`/, () => `he = ${JSON.stringify(TARKOVA_WORDMARK)}`)
      // #0c0c0d is only used as this effect's ground; clear it so the page background shows through.
      .replaceAll('"#0c0c0d"', '"transparent"')
      // Edge-to-edge: drop the adapter's 48px gutter and size the box to the letters (1600×257).
      .replace(
        'width: min(calc(100vw - 48px), 1180px) !important; max-width: calc(100vw - 48px) !important; height: auto !important; max-height: none !important; aspect-ratio: 16 / 3 !important;',
        'width: 100vw !important; max-width: none !important; height: auto !important; max-height: none !important; aspect-ratio: 1600 / 257 !important;',
      )
    if (!out.includes(JSON.stringify(TARKOVA_WORDMARK)) || out.includes('"#0c0c0d"') || !out.includes('aspect-ratio: 1600 / 257'))
      this.error('ThreeUI particle wordmark not found; the package source changed')
    return out
  },
}

// Blog, products, legal and 404 pages rendered to plain HTML from the posts table, so
// crawlers get full content without running JS. Dev renders on request; build writes files.
// SUPABASE_DB_URL is only read here in Node — nothing without a VITE_ prefix reaches the browser.
function tarkovaSite(env) {
  const SHELL = new URL('./shell.html', import.meta.url)
  const site = (env.SITE_URL || 'https://www.tarkova.com').replace(/\/$/, '')
  const FRESH_MS = 60_000 // dev re-reads Supabase at most once a minute, so edits there show up on refresh

  async function load() {
    const pg = (await import('pg')).default
    pg.types.setTypeParser(1082, (v) => v) // keep `date` as 'YYYY-MM-DD'; a JS Date would shift by timezone
    if (!env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is missing from .env')
    // ponytail: encrypted but unverified; pin Supabase's CA cert here to verify the server too.
    const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
    // A dropped connection (pooler restart, network blip) emits 'error' on the client; unhandled, it kills
    // the whole dev server. The failing query still rejects, and refresh() logs and keeps the last posts.
    db.on('error', (e) => console.warn(`tarkova-site: database connection lost: ${e.message}`))
    await db.connect()
    try {
      const { rows } = await db.query(
        `select slug, title, summary, tag, body, keywords, read_minutes, published_at, updated_at
           from posts where status = 'published' order by published_at desc, id desc`,
      )
      const { buildSite } = await import('./src/site/pages.js')
      return { ...buildSite(rows, { site }), count: rows.length }
    } finally {
      await db.end()
    }
  }

  const TYPES = { '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' }
  let outDir

  return {
    name: 'tarkova-site',
    config: () => ({ build: { rollupOptions: { input: { main: 'index.html', shell: 'shell.html' } } } }),
    configureServer(server) {
      const log = server.config.logger
      let built, loadedAt = 0, loading = null
      // One fetch at a time; the pages already built keep serving while a refresh runs.
      const refresh = () =>
        (loading ??= load()
          .then((s) => {
            built = s
            loadedAt = Date.now()
            log.info(`  tarkova-site: ${s.count} posts loaded from Supabase`, { timestamp: true })
          })
          .catch((e) => log.error(`  tarkova-site: could not load posts from Supabase: ${e.message}`, { timestamp: true }))
          .finally(() => (loading = null)))
      refresh() // warm up at startup, so the first visit to /blog/ doesn't wait on the database

      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url, 'http://x').pathname
        if (/^\/(@|src\/|node_modules\/|__)/.test(path) || path === '/' || path === '/shell.html') return next()
        try {
          if (!built) await refresh()
          else if (Date.now() - loadedAt > FRESH_MS) refresh()
          if (!built) throw new Error('Blog posts could not be loaded from Supabase — check SUPABASE_DB_URL in .env and the terminal log.')
          const { pages, files } = built
          const file = files.get(path)
          if (file) return res.setHeader('Content-Type', TYPES[extname(path)]).end(file)
          if (extname(path)) return next() // public/ assets
          if (!path.endsWith('/') && pages.has(path + '/')) return res.writeHead(301, { Location: path + '/' }).end()
          const { fillShell } = await import('./src/site/pages.js')
          const page = pages.get(path)
          const html = await server.transformIndexHtml(req.url, fillShell(readFileSync(SHELL, 'utf8'), page || pages.get('/404.html')))
          res.statusCode = page ? 200 : 404
          res.setHeader('Content-Type', 'text/html').end(html)
        } catch (e) {
          next(e)
        }
      })
    },
    writeBundle(opts) {
      outDir = opts.dir
    },
    async closeBundle() {
      if (!outDir) return
      const shellFile = join(outDir, 'shell.html')
      const shell = readFileSync(shellFile, 'utf8') // built copy: carries the hashed CSS/JS tags
      const { pages, files } = await load()
      const { fillShell } = await import('./src/site/pages.js')
      const write = (path, content) => {
        const to = join(outDir, path.endsWith('/') ? path + 'index.html' : path)
        mkdirSync(dirname(to), { recursive: true })
        writeFileSync(to, content)
      }
      for (const [path, page] of pages) write(path, fillShell(shell, page))
      for (const [path, content] of files) write(path, content)
      rmSync(shellFile)
      this.info?.(`tarkova-site: wrote ${pages.size} pages and ${files.size} feeds`)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [tarkovaOutline, tarkovaWordmark, react(), tarkovaSite(loadEnv(mode, process.cwd(), ''))],
  // Pre-bundling would bypass the transform above.
  optimizeDeps: { exclude: ['@designcodeio/threeui'] },
}))
