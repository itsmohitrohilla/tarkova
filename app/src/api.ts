// The admin feed (api/admin.js, appData) and the three calls the app makes. Nothing here imports React Native,
// so scripts/api-check.mjs can run this exact file under Node against a real server.

export type Creds = { server: string; key: string; username: string; password: string }

export type Tile = { label: string; value: string; note?: string; symbol: string; color: string; change?: { up: boolean; percent: number } | null; trend?: number[] }
export type Block =
  | { type: 'hero'; greeting: string; title: string; line: string }
  | { type: 'tiles'; tiles: Tile[] }
  | { type: 'chart'; title: string; one: string; many: string; plain: boolean; points: { tick: string; tip: string; n: number }[] }
  | { type: 'list'; title: string; empty: string; rows: { label: string; n: number; value?: string }[] }
  | { type: 'posts'; title: string; rows: { title: string; line: string }[] }
  | { type: 'stars'; title: string; rows: { stars: number; n: number; percent: number }[] }
  | { type: 'messages'; title: string }
  | { type: 'ratings'; title: string }
export type Section = { id: string; title: string; symbol: string; blocks: Record<string, Block[]> }
export type Site = { id: string; name: string; color: string; sections: Section[] }
export type Message = { id: number; name: string | null; email: string | null; body: string; from: string; at: string; when: string }
export type Rating = { id: number; stars: number; comment: string | null; at: string; when: string }
export type Feed = {
  loaded: string
  periods: { key: string; label: string; name: string }[]
  defaultPeriod: string
  sites: Site[]
  messages: Message[]
  ratings: Rating[]
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

// "www.tarkova.com/ " -> "https://www.tarkova.com"; the key loses stray spaces and slashes from a copy and paste.
export const tidy = (c: Creds): Creds => ({
  server: (/^https?:\/\//i.test(c.server.trim()) ? c.server.trim() : `https://${c.server.trim()}`).replace(/\/+$/, ''),
  key: c.key.trim().replace(/^\/+|\/+$/g, ''),
  username: c.username.trim(),
  password: c.password,
})

const field = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

async function call(c: Creds, form?: Record<string, string>): Promise<any> {
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), 20000)
  let res: Response
  try {
    res = await fetch(`${c.server}/admin/${encodeURIComponent(c.key)}/?format=json`, {
      method: form ? 'POST' : 'GET',
      credentials: 'include', // the session is an HttpOnly cookie; iOS keeps and resends it
      headers: form ? { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'tarkova-app' } : undefined,
      body: form && field(form),
      signal: stop.signal,
    })
  } catch {
    throw new ApiError(0, `Could not reach ${c.server.replace(/^https?:\/\//i, '')}. Check the server address and your connection.`)
  } finally {
    clearTimeout(timer)
  }
  const body = await res.json().catch(() => null)
  if (res.ok && body && typeof body === 'object') return body
  if (body?.error) throw new ApiError(res.status, String(body.error))
  // No JSON: a wrong key is a plain 404, and a server without the dashboard answers with some web page.
  throw new ApiError(res.status, res.status === 404
    ? 'The server did not recognise that admin key. Check the key and the server address.'
    : `That server did not answer like the Tarkova dashboard (${res.status}). Check the server address.`)
}

export const signIn = (c: Creds): Promise<void> => call(c, { username: c.username, password: c.password })
export const signOut = (c: Creds): Promise<void> => call(c, { action: 'logout' })
export async function getFeed(c: Creds): Promise<Feed> {
  const feed = await call(c)
  if (!Array.isArray(feed.sites) || !feed.sites.length || !Array.isArray(feed.periods)) throw new ApiError(200, 'The server sent a dashboard this app cannot read.')
  return feed
}
