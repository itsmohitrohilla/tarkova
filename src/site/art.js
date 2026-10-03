// Generative cover art: every post gets its own banner, seeded by its slug, so 980 posts
// never share an image and nothing has to be drawn or hosted. Same slug → same art.
// Flat, print-like compositions: one ground (paper, ink or the topic colour), a halftone
// field and one crisp line motif. No blur filters, so a page of 25 covers paints cheaply.

// Accent per topic, from the brand family: Tarkova orange, Crowkis red, Curva blue.
export const ACCENT = {
  guides: '#FF4407', features: '#C41A1A', 'use cases': '#FF4407', 'vs the field': '#1800ad',
  engineering: '#1800ad', economics: '#FF4407', security: '#C41A1A', reference: '#52555A',
  operations: '#1800ad', benchmarks: '#C41A1A',
}
// Each topic draws from its own few motifs, so a topic reads as a family without repeating.
const MOTIF = {
  guides: ['waves', 'orbits', 'grid', 'stack'], features: ['rings', 'orbits', 'arcs', 'stack'], 'use cases': ['venn', 'nodes', 'arcs'],
  'vs the field': ['venn', 'slashes'], engineering: ['slashes', 'grid', 'vectors'], economics: ['bars', 'waves'],
  security: ['slashes', 'rings', 'stack'], reference: ['grid', 'vectors'], operations: ['waves', 'arcs', 'bars'], benchmarks: ['bars', 'vectors'],
}
const PAPER = '#f3f2ee', INK = '#161616'

function rng(seed) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const f = (n) => Math.round(n)

// W×H is 1200×630 (the social-card ratio); `slice` crops it to whatever box it sits in.
export function coverArt(slug, tag) {
  const r = rng(slug)
  const id = 'a' + slug.replace(/[^a-z0-9]/gi, '').slice(-10) + f(r() * 1e6)
  const accent = ACCENT[tag] || '#FF4407'
  const W = 1200, H = 630
  const fx = 300 + r() * 600, fy = 170 + r() * 290 // focal point

  // Mostly paper, some ink, a few in the topic colour: a grid of them reads varied but related.
  const g = r()
  const ground = g < 0.55 ? 'paper' : g < 0.85 ? 'ink' : 'accent'
  const cool = accent === '#1800ad' || accent === '#52555A' // too dark to read on ink
  const bg = ground === 'paper' ? PAPER : ground === 'ink' ? INK : accent
  const fg = ground === 'paper' ? INK : PAPER
  const hi = ground === 'accent' ? (cool ? '#FF4407' : INK) : ground === 'ink' && cool ? '#7d70ff' : accent
  const dots = ground === 'paper' ? accent : PAPER

  let motif = ''
  const pool = /memory/.test(slug) ? ['nodes', 'stack'] : MOTIF[tag] || ['rings']
  const m = pool[Math.floor(r() * pool.length)]
  if (m === 'orbits') {
    const tilt = f(-40 + r() * 80)
    motif = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(fx)}" cy="${f(fy)}" rx="${90 + i * 62}" ry="${34 + i * 23}" transform="rotate(${tilt} ${f(fx)} ${f(fy)})"/>`).join('') +
      `<circle cx="${f(fx + 214 * Math.cos(tilt / 57.3))}" cy="${f(fy + 214 * Math.sin(tilt / 57.3))}" r="13" fill="${hi}" stroke="none"/>`
  } else if (m === 'grid') {
    const on = new Set([Math.floor(r() * 24), Math.floor(r() * 24)])
    motif = Array.from({ length: 24 }, (_, i) => `<rect x="${f(fx - 250 + (i % 6) * 84)}" y="${f(fy - 150 + Math.floor(i / 6) * 84)}" width="56" height="56" rx="8"${on.has(i) ? ` fill="${hi}" stroke="none"` : ''}/>`).join('')
  } else if (m === 'arcs') {
    motif = Array.from({ length: 9 }, (_, i) => `<path d="M${f(fx - 60 - i * 34)} ${H + 20} A${60 + i * 34} ${60 + i * 34} 0 0 1 ${f(fx + 60 + i * 34)} ${H + 20}"/>`).join('') +
      `<circle cx="${f(fx)}" cy="${H - 6}" r="44" fill="${hi}" stroke="none"/>`
  } else if (m === 'rings') {
    motif = Array.from({ length: 8 }, (_, i) => `<circle cx="${f(fx)}" cy="${f(fy)}" r="${36 + i * 38}"/>`).join('') + `<circle cx="${f(fx)}" cy="${f(fy)}" r="18" fill="${hi}" stroke="none"/>`
  } else if (m === 'waves') {
    const amp = 30 + r() * 50, k = 0.004 + r() * 0.004, on = Math.floor(r() * 9)
    motif = Array.from({ length: 9 }, (_, i) => {
      let d = ''
      for (let x = -20; x <= W + 20; x += 40) d += `${x < 0 ? 'M' : 'L'}${x} ${f(fy - 160 + i * 40 + Math.sin(x * k + i * 0.5) * amp)}`
      return `<path d="${d}"${i === on ? ` stroke="${hi}" stroke-width="3"` : ''}/>`
    }).join('')
  } else if (m === 'bars') {
    motif = Array.from({ length: 14 }, (_, i) => {
      const h = 40 + r() * 300
      return `<rect x="${f(fx - 330 + i * 48)}" y="${f(H - 70 - h)}" width="22" height="${f(h)}"${i === 9 ? ` fill="${hi}" stroke="none"` : ''}/>`
    }).join('') + `<path d="M${f(fx - 370)} ${H - 70} H${f(fx + 370)}"/>`
  } else if (m === 'slashes') {
    // The Tarkova mark's stroke angle, repeated.
    motif = Array.from({ length: 11 }, (_, i) => {
      const x = fx - 300 + i * 56
      return `<path d="M${f(x)} ${f(fy + 170)} L${f(x + 36)} ${f(fy + 170)} L${f(x + 126)} ${f(fy - 170)} L${f(x + 90)} ${f(fy - 170)} Z"${i === 5 ? ` fill="${hi}" stroke="none"` : ''}/>`
    }).join('')
  } else if (m === 'stack') {
    // Cache layers, drawn back to front so each one hides the edge of the one below.
    motif = Array.from({ length: 5 }, (_, i) => {
      const y = fy + 120 - i * 52
      return `<path d="M${f(fx - 210)} ${f(y)} L${f(fx)} ${f(y - 76)} L${f(fx + 210)} ${f(y)} L${f(fx)} ${f(y + 76)} Z" fill="${i === 4 ? hi : bg}"${i === 4 ? ' stroke="none"' : ''}/>`
    }).join('')
  } else if (m === 'nodes') {
    // A small memory graph: each node joins its two nearest neighbours.
    const pts = Array.from({ length: 9 }, () => [fx + (r() - 0.5) * 640, fy + (r() - 0.5) * 360])
    const on = Math.floor(r() * 9), seen = new Set()
    for (const [i, a] of pts.entries())
      for (const [j] of pts.map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2]).sort((x, y) => x[1] - y[1]).slice(1, 3)) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(key)) seen.add(key), (motif += `<path d="M${f(a[0])} ${f(a[1])} L${f(pts[j][0])} ${f(pts[j][1])}"/>`)
      }
    motif += pts.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i === on ? 20 : 10}" fill="${i === on ? hi : bg}"${i === on ? ' stroke="none"' : ''}/>`).join('')
  } else if (m === 'vectors') {
    // An embedding as a dot matrix: dot size follows a smooth field, a few cells light up.
    const k = 0.2 + r() * 0.3, ph = r() * 6
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 7; j++) {
        const s = 2 + 11 * (0.5 + 0.5 * Math.sin(i * k + ph) * Math.cos(j * k * 1.4 + ph))
        motif += `<circle cx="${f(fx - 420 + i * 56)}" cy="${f(fy - 168 + j * 56)}" r="${s.toFixed(1)}" fill="${(i * 7 + j) % 23 === 5 ? hi : fg}" stroke="none"/>`
      }
  } else {
    motif = `<circle cx="${f(fx - 110)}" cy="${f(fy)}" r="170"/><circle cx="${f(fx + 110)}" cy="${f(fy)}" r="170"/><circle cx="${f(fx)}" cy="${f(fy)}" r="14" fill="${hi}" stroke="none"/>`
  }
  // Lines stay 1.5px whether the cover is a thumbnail or a banner.
  motif = motif.replace(/<(path|circle|ellipse|rect)/g, '<$1 vector-effect="non-scaling-stroke"')
  const s = (0.95 + r() * 0.5).toFixed(2)

  return `<svg class="cover-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern id="${id}d" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.1" fill="${dots}"/></pattern>
<radialGradient id="${id}m" cx="${(fx / W).toFixed(2)}" cy="${(fy / H).toFixed(2)}" r="${(0.45 + r() * 0.3).toFixed(2)}"><stop offset="0" stop-color="#fff" stop-opacity="${ground === 'paper' ? 1 : 0.45}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="${id}k"><rect width="${W}" height="${H}" fill="url(#${id}m)"/></mask>
</defs>
<rect width="${W}" height="${H}" fill="${bg}"/>
<rect width="${W}" height="${H}" fill="url(#${id}d)" mask="url(#${id}k)"/>
<g class="motif"><g fill="none" stroke="${fg}" stroke-width="1.5" transform="translate(${f(fx)} ${f(fy)}) scale(${s}) translate(${-f(fx)} ${-f(fy)})">${motif}</g></g>
</svg>`
}
