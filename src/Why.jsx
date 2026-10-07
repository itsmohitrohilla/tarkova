import { useEffect, useRef } from 'react'

// Why we exist: the vision and the mission, each beside a moving picture drawn in the galaxy's dot grid.
const GAP = 10 // grid pitch, CSS px (as in Galaxy.jsx)
const PALETTE = ['255,255,255', '226,232,240', '191,205,225', '205,210,255']
const REACH = 130 // pointer glow radius, CSS px
const BAR = 4 // a bar is three dots wide, then a one-dot gap
const DIM = 0.08 // an unlit dot: the grid stays faintly there

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
}

export function DotScene({ scene }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d'), { prep, light } = SCENES[scene]
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
        const l = light(c, sec, g)
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
  }, [scene])

  return <canvas ref={ref} className={`why-art ${scene}`} aria-hidden="true" />
}

const WHY = [
  { title: 'Vision', scene: 'reach', lead: "Great AI shouldn't be a luxury.", line: "We want every team to build with AI that's affordable, reliable, and worth what it costs." },
  { title: 'Mission', scene: 'more', lead: 'Make the AI you already use do more, for less.', line: 'We build simple products that work with any model and fit into the stack you already have.' },
]

export default function Why() {
  return (
    <section className="why" aria-label="Why we exist">
      <ul>
        {WHY.map((w) => (
          <li key={w.title}>
            <div>
              <h3>{w.title}</h3>
              <p className="why-lead">{w.lead}</p>
              <p>{w.line}</p>
            </div>
            <DotScene scene={w.scene} />
          </li>
        ))}
      </ul>
    </section>
  )
}
