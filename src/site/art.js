// Generative cover art: every post gets its own banner, seeded by its slug, so 980 posts
// never share an image and nothing has to be drawn or hosted. Same slug → same art.

// Accent per topic, from the brand family: Tarkova orange, Crowkis red, Curva blue.
const ACCENT = {
  guides: '#FF4407', features: '#d50000', 'use cases': '#FF4407', 'vs the field': '#1800ad',
  engineering: '#1800ad', economics: '#FF4407', security: '#d50000', reference: '#52555A',
  operations: '#1800ad', benchmarks: '#d50000',
}
// Each topic draws from its own few motifs, so a topic reads as a family without repeating.
const MOTIF = {
  guides: ['waves', 'orbits', 'grid'], features: ['rings', 'orbits', 'arcs'], 'use cases': ['venn', 'grid', 'arcs'],
  'vs the field': ['venn', 'slashes'], engineering: ['slashes', 'grid', 'arcs'], economics: ['bars', 'waves'],
  security: ['slashes', 'rings'], reference: ['grid', 'rings'], operations: ['waves', 'arcs'], benchmarks: ['bars', 'orbits'],
}

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

// W×H is 1200×630 (the social-card ratio); CSS crops it per slot with object-fit style sizing.
export function coverArt(slug, tag, { label = '' } = {}) {
  const r = rng(slug)
  const id = 'a' + slug.replace(/[^a-z0-9]/gi, '').slice(-10) + f(r() * 1e6)
  const accent = ACCENT[tag] || '#FF4407'
  const W = 1200, H = 630
  const fx = 300 + r() * 600, fy = 180 + r() * 270 // focal point

  const blobs = Array.from({ length: 4 }, (_, i) => {
    const tone = ['#9A9EA7', '#52555A', '#D8D8D6', '#ffffff'][i]
    return `<ellipse class="blob b${i}" cx="${f(r() * W)}" cy="${f(r() * H)}" rx="${f(160 + r() * 260)}" ry="${f(120 + r() * 200)}" fill="${tone}" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`
  }).join('')

  let motif = ''
  const pool = MOTIF[tag] || ['rings']
  const m = pool[Math.floor(r() * pool.length)]
  if (m === 'orbits') {
    const tilt = f(-40 + r() * 80)
    motif = Array.from({ length: 5 }, (_, i) => `<ellipse cx="${f(fx)}" cy="${f(fy)}" rx="${90 + i * 60}" ry="${34 + i * 22}" transform="rotate(${tilt} ${f(fx)} ${f(fy)})"/>`).join('') +
      `<circle cx="${f(fx + 150 * Math.cos(tilt / 57.3))}" cy="${f(fy + 150 * Math.sin(tilt / 57.3))}" r="8" fill="${accent}" stroke="none"/>`
  } else if (m === 'grid') {
    const on = Math.floor(r() * 24)
    motif = Array.from({ length: 24 }, (_, i) => `<rect x="${f(fx - 250 + (i % 6) * 84)}" y="${f(fy - 150 + Math.floor(i / 6) * 84)}" width="56" height="56" rx="10"${i === on ? ` fill="${accent}" stroke="none"` : ''}/>`).join('')
  } else if (m === 'arcs') {
    motif = Array.from({ length: 8 }, (_, i) => `<path d="M${f(fx - 60 - i * 34)} ${H + 20} A${60 + i * 34} ${60 + i * 34} 0 0 1 ${f(fx + 60 + i * 34)} ${H + 20}"/>`).join('')
  } else if (m === 'rings') {
    motif = Array.from({ length: 7 }, (_, i) => `<circle cx="${f(fx)}" cy="${f(fy)}" r="${40 + i * 38}" opacity="${(1 - i / 8).toFixed(2)}"/>`).join('')
  } else if (m === 'waves') {
    const amp = 30 + r() * 50, k = 0.004 + r() * 0.004
    motif = Array.from({ length: 9 }, (_, i) => {
      let d = ''
      for (let x = -20; x <= W + 20; x += 40) d += `${x < 0 ? 'M' : 'L'}${x} ${f(fy - 160 + i * 40 + Math.sin(x * k + i * 0.5) * amp)}`
      return `<path d="${d}" opacity="${(0.25 + i / 12).toFixed(2)}"/>`
    }).join('')
  } else if (m === 'bars') {
    motif = Array.from({ length: 14 }, (_, i) => {
      const h = 40 + r() * 300
      return `<rect x="${f(fx - 330 + i * 48)}" y="${f(H - 70 - h)}" width="20" height="${f(h)}" rx="4"${i === 9 ? ` fill="${accent}" stroke="none"` : ''}/>`
    }).join('')
  } else if (m === 'slashes') {
    // The Tarkova mark's stroke angle, repeated.
    motif = Array.from({ length: 11 }, (_, i) => {
      const x = fx - 300 + i * 56
      return `<path d="M${f(x)} ${f(fy + 170)} L${f(x + 36)} ${f(fy + 170)} L${f(x + 126)} ${f(fy - 170)} L${f(x + 90)} ${f(fy - 170)} Z"${i === 5 ? ` fill="${accent}" stroke="none"` : ''}/>`
    }).join('')
  } else {
    motif = `<circle cx="${f(fx - 110)}" cy="${f(fy)}" r="170"/><circle cx="${f(fx + 110)}" cy="${f(fy)}" r="170"/><circle cx="${f(fx)}" cy="${f(fy)}" r="9" fill="${accent}" stroke="none"/>`
  }

  return `<svg class="cover-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f1"/><stop offset="1" stop-color="#dcdcd8"/></linearGradient>
<radialGradient id="${id}h"><stop offset="0" stop-color="${accent}" stop-opacity=".95"/><stop offset=".45" stop-color="${accent}" stop-opacity=".35"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="46"/></filter>
<pattern id="${id}d" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.4" fill="#161616"/></pattern>
<radialGradient id="${id}m" cx="${(fx / W).toFixed(2)}" cy="${(fy / H).toFixed(2)}" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="${id}k"><rect width="${W}" height="${H}" fill="url(#${id}m)"/></mask>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}g)"/>
<g filter="url(#${id}b)">${blobs}<circle class="blob hot" cx="${f(fx)}" cy="${f(fy)}" r="${f(150 + r() * 90)}" fill="url(#${id}h)"/></g>
<rect width="${W}" height="${H}" fill="url(#${id}d)" mask="url(#${id}k)"/>
<g class="motif" fill="none" stroke="#161616" stroke-width="1.6">${motif}</g>
${label ? `<text x="220" y="112" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" letter-spacing="3" fill="#161616" opacity=".7">${label}</text>` : ''}
</svg>`
}
