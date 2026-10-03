import { useEffect, useRef } from 'react'

// A spiral galaxy drawn as the footer wordmark's dot grid. The grid never moves; the galaxy turns slowly
// through it, so stars fade in and out as the arms sweep past. Stars twinkle, brighten near the pointer,
// and now and then a shooting star runs across the grid.
const GAP = 10 // grid pitch, CSS px
const PALETTE = ['255,255,255', '226,232,240', '191,205,225', '205,210,255']
const SPIN = 0.035 // galaxy rotation, radians per second
const REACH = 150 // pointer glow radius, CSS px

// Tarkova's products as named stars over the galaxy, joined like a constellation.
// Positions are % of the section: x/y on wide screens, mx/my on phones. A new product gets a new row here.
const STARS = [
  { name: 'Crowkis', line: 'A semantic cache and memory layer for AI apps.', href: '/crowkis/', x: 26, y: 62, mx: 10, my: 50 },
  { name: 'Curva', line: 'Typed decisions with calibrated probabilities, from any LLM.', href: '/curva/', x: 56, y: 45, mx: 30, my: 64 },
]

export default function Galaxy() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let cells = [], raf = 0, visible = false, w = 0, h = 0
    let mx = -1e4, my = -1e4, glow = 0 // pointer position, and how lit its halo is (eases in and out)
    let comet = null, nextComet = 2500

    // Per cell, everything that doesn't change over time, so a frame costs one cos() per cell.
    const build = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const s = Math.min(w, h), tilt = 0.5 // squash the disc so it reads as seen at an angle
      cells = []
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) {
        const px = (x - w / 2) / s, py = (y - h / 2) / s
        const u = px * Math.cos(tilt) + py * Math.sin(tilt), v = (-px * Math.sin(tilt) + py * Math.cos(tilt)) * 2.1
        const r = Math.hypot(u, v)
        cells.push({
          x, y, big: Math.random() < 0.05, square: Math.random() < 0.2,
          spiral: Math.atan2(v, u) - 2.6 * Math.log(r + 0.05),
          core: 1.8 * Math.exp(-r / 0.2) + 0.14, arm: 1.3 * Math.exp(-r / 0.9),
          seed: Math.random(), // the star shows where the galaxy's density beats this
          bright: Math.pow(Math.random(), 1.2),
          color: PALETTE[Math.random() < 0.12 ? 3 : (Math.random() * 3) | 0],
          speed: 0.6 + Math.random() * 2.4, phase: Math.random() * 7,
        })
      }
    }

    const draw = (t) => {
      const sec = t / 1000, turn = still ? 0 : sec * SPIN
      ctx.clearRect(0, 0, w, h)
      for (const c of cells) {
        const d = Math.min(1, c.core + c.arm * Math.pow(Math.max(0, Math.cos(2 * (c.spiral + turn))), 1.2))
        const near = glow * Math.max(0, 1 - Math.hypot(c.x - mx, c.y - my) / REACH)
        let a = Math.min(1, (d - c.seed) * 4) // fades in as an arm arrives instead of popping
        if (a <= 0 && near <= 0) continue
        a = Math.max(0, a) * (0.3 + 0.7 * d * c.bright + (c.big ? 0.4 : 0)) + near * 0.55
        if (!still) a *= 0.55 + 0.45 * Math.sin(sec * c.speed + c.phase)
        const size = (c.big ? 2.6 : 1 + d * 1.2) + near * 1.4
        ctx.fillStyle = `rgba(${c.color},${Math.min(1, a)})`
        if (c.square || size < 1.6) ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size)
        else { ctx.beginPath(); ctx.arc(c.x, c.y, size / 2, 0, 7); ctx.fill() }
      }
      if (comet) drawComet(t)
    }

    // A shooting star: a short run of grid dots, brightest at the head, crossing the sky.
    const drawComet = (t) => {
      const k = (t - comet.t0) / comet.life
      if (k >= 1) { comet = null; return }
      const hx = comet.x + comet.dx * k * comet.len, hy = comet.y + comet.dy * k * comet.len
      const fade = Math.sin(Math.PI * k)
      for (let i = 0; i < 16; i++) {
        const gx = Math.floor((hx - comet.dx * i * GAP) / GAP) * GAP + GAP / 2
        const gy = Math.floor((hy - comet.dy * i * GAP) / GAP) * GAP + GAP / 2
        const size = i === 0 ? 2.6 : 1.8
        ctx.fillStyle = `rgba(255,255,255,${fade * (1 - i / 16)})`
        ctx.fillRect(gx - size / 2, gy - size / 2, size, size)
      }
    }

    const loop = (t) => {
      glow += ((mx > -1e3 ? 1 : 0) - glow) * 0.06
      if (!comet && t > nextComet) {
        const ang = 0.35 + Math.random() * 0.35
        comet = { x: Math.random() * w * 0.7, y: h * (0.25 + Math.random() * 0.25), dx: Math.cos(ang), dy: Math.sin(ang), len: Math.min(w, h) * 0.6, life: 1300, t0: t }
        nextComet = t + 5000 + Math.random() * 6000
      }
      draw(t)
      if (visible) raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top }
    const onLeave = () => { mx = my = -1e4 }

    build(); draw(0)
    // ponytail: only animates while on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible && !still) raf = requestAnimationFrame(loop)
    })
    io.observe(canvas)
    const ro = new ResizeObserver(() => { build(); draw(performance.now()) })
    ro.observe(canvas)
    if (!still) { addEventListener('pointermove', onMove, { passive: true }); document.addEventListener('pointerleave', onLeave) }
    return () => {
      io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="galaxy" aria-labelledby="galaxy-h">
      <canvas ref={ref} aria-hidden="true" />
      <div className="galaxy-copy">
        <h2 id="galaxy-h">A growing universe of innovation.</h2>
        <p>Each one starts as a problem worth solving. Crowkis and Curva are the first. More are forming.</p>
      </div>
      {/* Lines can't move with CSS, so one constellation per layout; CSS shows the one that fits. */}
      {[['x', 'y', 'wide'], ['mx', 'my', 'phone']].map(([kx, ky, fit]) => (
        <svg key={fit} className={`constellation ${fit}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {STARS.slice(1).map((s, i) => (
            <line key={s.name} x1={STARS[i][kx]} y1={STARS[i][ky]} x2={s[kx]} y2={s[ky]} />
          ))}
        </svg>
      ))}
      <ul className="stars">
        {STARS.map((s) => (
          <li key={s.name} style={{ '--x': `${s.x}%`, '--y': `${s.y}%`, '--mx': `${s.mx}%`, '--my': `${s.my}%` }}>
            <a className="star" href={s.href}>
              <i aria-hidden="true" />
              <strong>{s.name}</strong>
              <span>{s.line}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
