// Moving pictures in the galaxy's dot grid, drawn on a canvas. Plain JS, so the React home page (Why.jsx)
// and the plain HTML pages (site/book.js) run the same scenes.
const GAP = 10 // grid pitch, CSS px (as in Galaxy.jsx)
const PALETTE = ['255,255,255', '226,232,240', '191,205,225', '205,210,255']
const REACH = 130 // pointer glow radius, CSS px
const BAR = 4 // a bar is three dots wide, then a one-dot gap
const DIM = 0.08 // an unlit dot: the grid stays faintly there
const SLOT = 7 // a time slot is six dots tall, then a one-dot gap

// A scene turns a dot's place in the grid into its light, 0 to 1.
// `prep` runs once per dot when the grid is built, `light` once per dot per frame.
const SCENES = {
  // Headline backdrop (index.html's .lede): streamlines flowing across the grid, light running along them.
  flow: {
    prep: (c, g) => { c.v = c.y / g.h; c.big = false },
    light: (c, sec) => {
      const s = c.v * 4 + 0.3 * Math.sin(c.x * 0.008 - sec * 0.5) + 0.12 * Math.sin(c.x * 0.021 + sec * 0.3)
      const line = Math.pow(0.5 + 0.5 * Math.cos(s * 6.283), 8)
      const run = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(c.x * 0.006 - sec * 1.1 + c.v * 9), 2)
      return DIM + 0.75 * line * run
    },
  },
  // Vision: light leaves one point and keeps going until it has reached every dot. The larger dots are the
  // teams it reaches; each flares as a ring passes over it.
  reach: {
    prep: (c, g) => { c.r = Math.hypot(c.x - g.w / 2, c.y - g.h / 2) / (g.h / 2) },
    light: (c, sec) => {
      const ring = Math.pow(0.5 + 0.5 * Math.cos((c.r * 1.5 - sec * 0.28) * 6.283), 4) / (1 + c.r * 0.25)
      return Math.max(Math.exp(-c.r / 0.14), c.big ? 0.35 + ring : DIM + 0.92 * ring)
    },
  },
  // Mission: the same grid doing more. Bars climb from left to right, and a slow wave keeps them growing.
  more: {
    prep: (c, g) => {
      const bars = Math.ceil(g.cols / BAR)
      c.bar = Math.floor(c.i / BAR)
      c.gap = c.i % BAR === BAR - 1
      c.top = 0.1 + 0.82 * Math.pow((c.bar + 1) / bars, 1.3) // how tall this dot's bar stands, as a share of the height
      c.up = 1 - (c.j + 0.5) / g.rows // how high this dot sits
      c.big = false
    },
    light: (c, sec, g) => {
      if (c.gap) return DIM
      const top = c.top * (0.88 + 0.12 * Math.sin(sec * 1.1 - c.bar * 0.55))
      const d = (top - c.up) * g.rows // dots between this one and the top of its bar
      const cap = Math.max(0, 1 - Math.abs(d - 0.5)) // the bar's top dot, brightest; fades in and out as the bar moves
      const body = d > 0 ? Math.min(1, d) * (0.3 + 0.45 * c.up / top) : 0
      return Math.max(DIM, body, cap)
    },
  },
  // Book a demo (Book.jsx): the grid as a week of time slots, seven across. One slot after another fills with
  // light, as if being booked, then fades as the next is taken. The slot under the pointer lights up too.
  week: {
    prep: (c, g) => {
      const tw = Math.floor(g.cols / 7), i = c.i - ((g.cols - tw * 7) >> 1) // slot width in dots; the week sits centred
      const col = Math.floor(i / tw), a = i % tw, b = c.j % SLOT
      g.sw = tw * GAP; g.ox = (c.i - i) * GAP; g.slots = 7 * Math.ceil(g.rows / SLOT); g.k = null
      c.gap = col < 0 || col > 6 || a === tw - 1 || b === SLOT - 1 // a slot's last column and row stay dark
      c.slot = Math.floor(c.j / SLOT) * 7 + col
      c.rim = a === 0 || a === tw - 2 || b === 0 || b === SLOT - 2
      c.u = a / tw // how far across its slot this dot sits: the fill wipes in from the left
      c.big = false
    },
    light: (c, sec, g, mx, my) => {
      if (c.gap) return 0
      const k = Math.floor(sec / 2.4), f = sec / 2.4 - k
      // The last six bookings, newest first; worked out once per booking, not per dot.
      if (g.k !== k) { g.k = k; g.taken = [0, 1, 2, 3, 4, 5].map((n) => Math.floor((Math.abs(Math.sin((k - n) * 12.9898) * 43758.5453) % 1) * g.slots)) }
      const n = g.taken.indexOf(c.slot)
      const taken = n < 0 ? 0 : n === 0 ? Math.min(1, Math.max(0, (f * 3 - c.u) * 5)) : 0.9 * (1 - (n - 1 + f) / 5)
      const px = Math.floor((mx - g.ox) / g.sw)
      const hot = px >= 0 && px < 7 && px + 7 * Math.floor(my / (SLOT * GAP)) === c.slot ? 0.55 : 0
      return Math.max(c.rim ? 0.36 : DIM, taken, hot)
    },
  },
}

// Runs `scene` on `canvas` until the returned function is called.
export function runDots(canvas, scene) {
  const ctx = canvas.getContext('2d'), { prep, light } = SCENES[scene]
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  let cells = [], g = {}, raf = 0, mx = -1e4, my = -1e4

  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    g = { w, h, cols: Math.floor(w / GAP), rows: Math.floor(h / GAP) }
    cells = []
    for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) {
      const c = {
        i, j, x: i * GAP + GAP / 2, y: j * GAP + GAP / 2,
        big: Math.random() < 0.02,
        color: PALETTE[Math.random() < 0.12 ? 3 : (Math.random() * 3) | 0],
        speed: 0.6 + Math.random() * 2.4, phase: Math.random() * 7,
      }
      prep(c, g)
      cells.push(c)
    }
  }

  const draw = (t) => {
    const sec = still ? 3 : t / 1000
    ctx.clearRect(0, 0, g.w, g.h)
    for (const c of cells) {
      const near = Math.max(0, 1 - Math.hypot(c.x - mx, c.y - my) / REACH)
      const l = light(c, sec, g, mx, my)
      const a = Math.min(1, l * (still ? 1 : 0.8 + 0.2 * Math.sin(sec * c.speed + c.phase)) + near * 0.5)
      const size = 2.2 + Math.min(1, l) * 2.4 + near // the glyphs' dot sizes: 2.2 unlit, 4.6 lit
      ctx.fillStyle = `rgba(${c.color},${a})`
      ctx.beginPath(); ctx.arc(c.x, c.y, size / 2, 0, 7); ctx.fill()
    }
  }

  const loop = (t) => { draw(t); raf = requestAnimationFrame(loop) }
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (still) draw(0) }
  const onLeave = () => { mx = my = -1e4; if (still) draw(0) }

  build(); draw(0)
  // ponytail: only animates while on screen
  const io = new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf)
    if (e.isIntersecting && !still) raf = requestAnimationFrame(loop)
  })
  io.observe(canvas)
  const ro = new ResizeObserver(() => { build(); draw(performance.now()) })
  ro.observe(canvas)
  canvas.addEventListener('pointermove', onMove, { passive: true })
  canvas.addEventListener('pointerleave', onLeave)
  return () => {
    io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf)
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave)
  }
}
