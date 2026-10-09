import { useEffect, useRef } from 'react'
import { runDots } from './dots.js'

// Why we exist: the vision and the mission, each beside a moving picture drawn in the galaxy's dot grid
// (the scenes live in dots.js).
export function DotScene({ scene }) {
  const ref = useRef(null)
  useEffect(() => runDots(ref.current, scene), [scene])
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
