// The home page after the Tarkova mark: what we make, each with a glyph in the galaxy's dot grid.

// Glyphs: which cells of a 15 × 15 dot grid are lit, from a shape test on u, v in [-1, 1].
const seg = (u, v, [ax, ay, bx, by]) => {
  const dx = bx - ax, dy = by - ay, k = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(u - ax - k * dx, v - ay - k * dy)
}
const CODE = [[-0.5, -0.5, -0.95, 0], [-0.95, 0, -0.5, 0.5], [0.5, -0.5, 0.95, 0], [0.95, 0, 0.5, 0.5], [0.2, -0.65, -0.2, 0.65]]
const SHAPES = {
  spark: (u, v) => Math.abs(u) ** 0.55 + Math.abs(v) ** 0.55 <= 1.12, // the four-point AI sparkle
  code: (u, v) => Math.min(...CODE.map((s) => seg(u, v, s))) < 0.11, // </>
  craft: (u, v) => { const r = Math.hypot(u, v); return r < 0.14 || Math.abs(r - 0.48) < 0.09 || Math.abs(r - 0.86) < 0.08 }, // rings, drawn to the centre
}
const N = 15
function Glyph({ shape }) {
  const dots = []
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const on = SHAPES[shape]((i / (N - 1)) * 2 - 1, (j / (N - 1)) * 2 - 1)
    // Fixed pseudo-random twinkle delay per dot, so server and client agree.
    const delay = -((i * 7 + j * 13 + i * j) % 23) / 5
    dots.push(<circle key={`${i}-${j}`} cx={i * 10 + 5} cy={j * 10 + 5} r={on ? 2.3 : 1.1} className={on ? 'on' : ''} style={on ? { animationDelay: `${delay}s` } : undefined} />)
  }
  return <svg className="glyph" viewBox={`0 0 ${N * 10} ${N * 10}`} aria-hidden="true">{dots}</svg>
}

const MAKE = [
  { shape: 'spark', title: 'AI products', line: 'Tools that put AI to work in the real world.' },
  { shape: 'code', title: 'Software solutions', line: 'Built around the problem, not the trend.' },
  { shape: 'craft', title: 'Craft', line: 'Every detail considered, from the first line of code to the last pixel.' },
]

export default function Sections() {
  return (
    <section className="make" aria-labelledby="make-h">
      <h2 id="make-h">What we make.</h2>
      <ul>
        {MAKE.map((m) => (
          <li key={m.title}>
            <Glyph shape={m.shape} />
            <h3>{m.title}</h3>
            <p>{m.line}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
