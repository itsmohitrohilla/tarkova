// Scene "curve" (INK, #how): the meaning of the name. One pinned, scroll-scrubbed sequence in four panels:
//   1 asked twice      the second ask flips the options; both probability vectors fill
//   2 every label      their average rises as three columns, numerals riding the tops
//   3 corrections      true labels tick in and the counter climbs to 30
//   4 the curve        an over-confident reliability curve slides onto the diagonal; ECE 0.404 -> 0.149
// Copy is one line per step. Each panel has draw(k), k in 0..1. Desktop pins one viewport and maps scroll onto the panels; mobile scrubs
// each stacked panel on its own. Static (reduced motion) is every panel at k = 1, which is the server markup.
// Example values (the ticket, its probabilities, the curve's points) are illustrative; the ECE pair is measured.
export const id = 'curve'

const OPTS = ['billing', 'technical', 'account']
const AVG = [0.74, 0.16, 0.1]
const ROWS = [
  ['As asked', OPTS, [0.78, 0.14, 0.08]],
  ['Reversed', [...OPTS].reverse(), [0.12, 0.18, 0.7]],
] // averaged, they become AVG: panel 2
const WRONG = new Set([4, 9, 13, 19, 24, 27]) // feedback labels that corrected the model (illustrative)

// Reliability diagram: per bin, how often right (ACC) against stated confidence, raw then calibrated.
// Calibration moves confidence, not accuracy, so the over-confident bins slide sideways onto the diagonal.
const ACC = [0.12, 0.24, 0.35, 0.47, 0.58, 0.69, 0.8, 0.9]
const RAW = [0.03, 0.09, 0.19, 0.45, 0.73, 0.87, 0.95, 0.99]
const CAL = [0.13, 0.23, 0.36, 0.46, 0.59, 0.68, 0.81, 0.9]
const SIZE = [6, 6.5, 7, 8, 9, 10, 11.5, 13]
const ECE = [0.404, 0.149] // @gemini/gemini-flash-lite-latest, AITA, n = 100, held-out, 2026-10-01 (benchmarks.md)

const X = (x) => 44 + x * 356
const Y = (y) => 30 + (1 - y) * 356
const f1 = (n) => n.toFixed(1)
const pts = (k) => ACC.map((y, i) => [X(RAW[i] + (CAL[i] - RAW[i]) * k), Y(y)])
// Catmull-Rom through the bins, as cubic Béziers.
const smooth = (p) => p.map((c, i) => {
  if (!i) return `M${f1(c[0])} ${f1(c[1])}`
  const a = p[i - 2] || p[i - 1], b = p[i - 1], d = p[i + 1] || c
  return `C${f1(b[0] + (c[0] - a[0]) / 6)} ${f1(b[1] + (c[1] - a[1]) / 6)} ${f1(c[0] - (d[0] - b[0]) / 6)} ${f1(c[1] - (d[1] - b[1]) / 6)} ${f1(c[0])} ${f1(c[1])}`
}).join('')
// The miscalibration gap: the curve, then back along the diagonal under the same confidences.
const gap = (p) => `${smooth(p)}${[...p].reverse().map(([x]) => `L${f1(x)} ${f1(Y((x - 44) / 356))}`).join('')}Z`

const STEPS = [
  ['It asks twice.', 'Options in one order, then reversed, and averaged. The order of options can no longer sway the answer.'],
  ['A score for every option.', 'Read from the model itself, so you see how sure it is of each one.'],
  ['You send corrections.', 'Tell Curva the right answer. After 30, it tunes its confidence, and keeps the change only if it helps.'],
  ['Then 90% sure means right about 90% of the time on your data.', 'That is calibration: confidence that matches how often it is right. Curva is named after the curve that checks it.'],
]

const bar = (v) => `<span class="cv-cu-bar" aria-hidden="true"><i style="--v:${v}"></i></span>`

const ART = [
  `<div class="cv-cu-art cv-cu-twice">
        <p class="cv-cu-q">“I was charged twice, please refund me.” <span>Which team?</span></p>
        ${ROWS.map(([name, opts, ps], r) => `<div class="cv-cu-row" data-row="${r}"><span class="cv-cu-rname">${name}</span><ol class="cv-cu-vec">${opts.map((o, j) => `<li class="cv-cu-cell" data-d="${OPTS.indexOf(o) - j}"><b class="cv-cu-chip">${o}</b>${bar(ps[j])}<span class="cv-cu-num" data-v="${ps[j]}">${ps[j].toFixed(2)}</span></li>`).join('')}</ol></div>`).join('\n        ')}
      </div>`,
  `<div class="cv-cu-art cv-cu-probs">
        <ol class="cv-cu-cols">${OPTS.map((o, j) => `<li class="cv-cu-col${j ? '' : ' is-top'}" style="--v:${AVG[j]}"><span class="cv-cu-colbar" aria-hidden="true"><i></i></span><span class="cv-cu-num" data-v="${AVG[j]}">${AVG[j].toFixed(2)}</span><b class="cv-cu-chip">${o}</b></li>`).join('')}</ol>
      </div>`,
  `<div class="cv-cu-art cv-cu-feed">
        <ol class="cv-cu-cells" aria-hidden="true">${Array.from({ length: 30 }, (_, i) => `<li class="on${WRONG.has(i) ? ' x' : ''}"></li>`).join('')}</ol>
        <p class="cv-cu-count"><b>30</b><span>/ 30 labels</span></p>
      </div>`,
  `<div class="cv-cu-art cv-cu-rel">
        <figure class="cv-cu-plot">
          <svg viewBox="0 0 420 444" role="img" aria-label="Reliability diagram. Before calibration the curve sits far from the diagonal: stated confidence is higher than how often the answer is right. After calibration it lies on the diagonal.">
            <defs>
              <pattern id="cv-cu-ht" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.25" /></pattern>
              <pattern id="cv-cu-ht2" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" /></pattern>
            </defs>
            <rect class="cv-cu-frame" x="${X(0)}" y="${Y(1)}" width="356" height="356" />
            ${[0.25, 0.5, 0.75].map((t) => `<path class="cv-cu-gridl" d="M${X(t)} ${Y(0)}V${Y(1)}M${X(0)} ${Y(t)}H${X(1)}" />`).join('')}
            <path class="cv-cu-diag" d="M${X(0)} ${Y(0)}L${X(1)} ${Y(1)}" />
            <path class="cv-cu-gap" d="${gap(pts(1))}" fill="url(#cv-cu-ht)" fill-rule="evenodd" />
            <path class="cv-cu-ghost" d="${smooth(pts(0))}" />
            <g class="cv-cu-mark"><path d="M${X(0.9)} ${Y(0)}V${f1(Y(0.9))}H${X(0)}" /><text x="${X(0) + 8}" y="${f1(Y(0.9) - 8)}">90%</text><text x="${X(0.9) - 8}" y="${Y(0) - 10}" text-anchor="end">90%</text></g>
            <path class="cv-cu-line" d="${smooth(pts(1))}" />
            ${pts(1).map(([x, y], i) => `<circle class="cv-cu-dot" cx="${f1(x)}" cy="${f1(y)}" r="${SIZE[i]}" fill="url(#cv-cu-ht2)" />`).join('')}
            ${[0, 0.5, 1].map((t) => `<text class="cv-cu-tick" x="${X(t)}" y="${Y(0) + 22}" text-anchor="middle">${t}</text><text class="cv-cu-tick" x="${X(0) - 10}" y="${Y(t) + 5}" text-anchor="end">${t}</text>`).join('')}
            <text class="cv-cu-axis" x="${X(0.5)}" y="${Y(0) + 48}" text-anchor="middle">confidence</text>
            <text class="cv-cu-axis" x="${X(0)}" y="${Y(1) - 12}">how often right</text>
          </svg>
        </figure>
        <div class="cv-cu-ece">
          <p class="cv-cu-ecev"><b>${ECE[1].toFixed(3)}</b></p>
          <p>Calibration error: how far confidence is from reality, lower is better. Before tuning: ${ECE[0].toFixed(3)}.</p>
          <p class="cv-cu-src">Gemini flash-lite, AITA, n = 100, tested on rows it did not learn from, 2026-10-01. Curve illustrative.</p>
        </div>
      </div>`,
]

export const html = () => `<section class="cv-scene cv-curve" id="how" data-scene="curve" aria-labelledby="cv-cu-title">
  <div class="cv-cu-pin">
    <h2 class="cv-cu-title" id="cv-cu-title">How Curva works: confidence scores you can trust.</h2>
    <ol class="cv-cu-steps">
      ${STEPS.map(([t, p], i) => `<li class="cv-cu-step${i === 3 ? ' is-last' : ''}">
        <div class="cv-cu-copy"><h3>${t}</h3><p>${p}</p></div>
        ${ART[i]}
      </li>`).join('\n      ')}
    </ol>
    <div class="cv-cu-rail" aria-hidden="true">${STEPS.map((_, i) => `<span>${i + 1}</span>`).join('')}<i></i></div>
  </div>
</section>`

// ---------- browser ----------
const clamp = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const seg = (k, a, b) => clamp((k - a) / (b - a))
const ease = (t) => t * t * (3 - 2 * t)
const nums = (s) => [...s.querySelectorAll('.cv-cu-num')].map((n) => ({ n, v: +n.dataset.v }))

const drawTwice = (s) => {
  const rows = [...s.querySelectorAll('.cv-cu-row')].map((r) => ({ r, cells: [...r.querySelectorAll('.cv-cu-cell')].map((c) => ({ c, i: c.querySelector('i'), d: +c.dataset.d, ...nums(c)[0] })) }))
  const win = [[0.04, 0.4], [0.62, 0.96]]
  return (k) => rows.forEach(({ r, cells }, ri) => {
    const g = ease(seg(k, ...win[ri]))
    const flip = ri === 1 ? ease(seg(k, 0.3, 0.6)) : 1
    r.style.opacity = (0.3 + 0.7 * seg(k, win[ri][0] - 0.12, win[ri][0])).toFixed(3)
    cells.forEach(({ c, i, d, n, v }) => {
      // the outer options swap like cards: one arcs over, the other under
      if (d) c.style.transform = `translate(calc(${(d * (1 - flip)).toFixed(3)} * (100% + var(--cu-gap))), ${(Math.sign(d) * Math.sin(Math.PI * flip) * 30).toFixed(1)}px)`
      i.style.transform = `scaleX(${(v * g).toFixed(4)})`
      n.textContent = (v * g).toFixed(2)
    })
  })
}

const drawProbs = (s) => {
  const cols = [...s.querySelectorAll('.cv-cu-col')].map((c) => ({ c, ...nums(c)[0] }))
  return (k) => {
    const g = ease(seg(k, 0.04, 0.8))
    cols.forEach(({ c, n, v }) => { c.style.setProperty('--f', (v * g).toFixed(4)); n.textContent = (v * g).toFixed(2) })
  }
}

const drawFeed = (s) => {
  const cells = [...s.querySelectorAll('.cv-cu-cells li')]
  const count = s.querySelector('.cv-cu-count b')
  return (k) => {
    const n = Math.round(seg(k, 0.04, 0.9) * 30)
    cells.forEach((c, i) => c.classList.toggle('on', i < n))
    count.textContent = String(n).padStart(2, '0')
  }
}

const drawRel = (s) => {
  const line = s.querySelector('.cv-cu-line'), area = s.querySelector('.cv-cu-gap'), mark = s.querySelector('.cv-cu-mark')
  const dots = [...s.querySelectorAll('.cv-cu-dot')]
  const ece = s.querySelector('.cv-cu-ecev b')
  return (k) => {
    const g = ease(seg(k, 0.06, 0.78))
    const p = pts(g)
    line.setAttribute('d', smooth(p))
    area.setAttribute('d', gap(p))
    dots.forEach((d, i) => { d.setAttribute('cx', f1(p[i][0])) })
    ece.textContent = (ECE[0] + (ECE[1] - ECE[0]) * g).toFixed(3)
    mark.style.opacity = seg(k, 0.74, 0.92).toFixed(3)
  }
}

export function init(el, { gsap }) {
  const steps = [...el.querySelectorAll('.cv-cu-step')]
  const draws = [drawTwice, drawProbs, drawFeed, drawRel].map((d, i) => d(steps[i]))
  const rail = [...el.querySelectorAll('.cv-cu-rail span')]
  const fill = el.querySelector('.cv-cu-rail i')
  const mm = gsap.matchMedia()

  // Desktop: one pinned viewport; scroll walks the four panels, crossfading at the seams.
  mm.add('(min-width: 601px)', () => {
    const st = { p: 0 }, W = 0.1
    const render = () => {
      const f = st.p * 4
      steps.forEach((s, i) => {
        const fin = i ? clamp((f - i + W) / (2 * W)) : 1
        const fout = i < 3 ? clamp((i + 1 + W - f) / (2 * W)) : 1
        const o = Math.min(fin, fout)
        s.style.opacity = o.toFixed(3)
        s.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        s.style.transform = `translateY(${(fin < 1 ? (1 - fin) * 28 : (fout - 1) * 28).toFixed(1)}px)`
        draws[i](clamp((f - i - W) / (1 - 3 * W)))
      })
      rail.forEach((r, i) => r.classList.toggle('on', i === Math.min(3, Math.floor(f))))
      fill.style.transform = `scaleX(${st.p.toFixed(4)})`
    }
    gsap.to(st, {
      p: 1, ease: 'none', onUpdate: render,
      scrollTrigger: { trigger: el.querySelector('.cv-cu-pin'), pin: true, start: 'top top', end: () => `+=${innerHeight * 3.4}`, scrub: 0.8, refreshPriority: -2, invalidateOnRefresh: true },
    })
    render()
    return () => { steps.forEach((s) => { s.style.cssText = '' }); draws.forEach((d) => d(1)) }
  })

  // Mobile: panels stay stacked; each one scrubs through its own story as it crosses the viewport.
  mm.add('(max-width: 600px)', () => {
    steps.forEach((s, i) => {
      const st = { k: 0 }
      gsap.to(st, { k: 1, ease: 'none', onUpdate: () => draws[i](st.k), scrollTrigger: { trigger: s.querySelector('.cv-cu-art'), start: 'top 88%', end: 'bottom 55%', scrub: 0.6, refreshPriority: -2 } })
      draws[i](0)
    })
    return () => draws.forEach((d) => d(1))
  })
}
