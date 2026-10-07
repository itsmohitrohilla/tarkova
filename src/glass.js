// Menu bar glass: the look is plain CSS (global.css). This adds the one thing CSS cannot: adaptive tone, dark
// text over light content and white text over dark content, from what is underneath the bar.

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
}
