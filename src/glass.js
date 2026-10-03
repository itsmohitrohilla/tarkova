// Liquid Glass menu bar (after Apple's WWDC25 "Meet Liquid Glass"): three behaviours on top of the CSS glass.
// 1. Lensing: the backdrop bends near the pill's edges, through an SVG displacement map shaped to the pill.
//    Only Chromium applies SVG filters in backdrop-filter; other browsers keep the plain frosted glass.
// 2. Adaptive tone: dark text over light content, white text over dark content, from what is underneath.
// 3. Specular: a soft highlight that follows the pointer across the glass.

// Displacement map for a pill: near the rim, pixels are pulled inward along the edge normal (R = x, G = y).
function lensMap(w, h, rim = 14) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), r = h / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = Math.min(Math.max(x, r), w - r), vx = x - cx, vy = y - r // vector from the pill's spine
      const len = Math.hypot(vx, vy) || 1, edge = r - len // distance in from the rim
      const k = edge < rim ? (1 - Math.max(edge, 0) / rim) ** 2 : 0
      const i = (y * w + x) * 4
      img.data[i] = 128 - (vx / len) * k * 127
      img.data[i + 1] = 128 - (vy / len) * k * 127
      img.data[i + 2] = 128; img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

const isChromium = !!navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand))

// Relative luminance of the first painted background under a point, ignoring the pill itself.
function toneAt(x, y, pill) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (pill.contains(el)) continue
    if (/^(IMG|VIDEO|CANVAS|svg)$/.test(el.tagName)) return 0.3 // imagery: treat as dark, keep white text
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)
    if (m && (m[3] === undefined || +m[3] > 0.5)) {
      const [r, g, b] = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
  }
  return 1
}

export function mountGlass(pill) {
  if (!pill || pill.dataset.glass) return
  pill.dataset.glass = 'on'

  if (isChromium) {
    const { width, height } = pill.getBoundingClientRect()
    const w = Math.round(width), h = Math.round(height), id = 'lg-lens'
    document.getElementById(id)?.closest('svg').remove()
    document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage href="${lensMap(w, h)}" x="0" y="0" width="${w}" height="${h}" result="map"/><feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`)
    pill.classList.add('lg-lens')
  }

  let queued = false
  const tone = () => {
    queued = false
    const r = pill.getBoundingClientRect(), y = r.top + r.height / 2
    const lum = [0.2, 0.5, 0.8].map((f) => toneAt(r.left + r.width * f, y, pill)).reduce((a, b) => a + b) / 3
    pill.dataset.tone = lum > 0.45 ? 'light' : 'dark'
  }
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(tone) } }
  addEventListener('scroll', ask, { passive: true })
  addEventListener('resize', ask)
  setTimeout(ask, 0); setTimeout(ask, 800) // after fonts and hero layout settle

  pill.addEventListener('pointermove', (e) => {
    const r = pill.getBoundingClientRect()
    pill.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
  })
  pill.addEventListener('pointerleave', () => pill.style.removeProperty('--mx'))
}
