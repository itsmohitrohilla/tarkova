// Scene "pipeline": how a query flows through Crowkis, told as one scroll-scrubbed particle sequence on paper,
// with one example query ("What's the refund timeline?"):
//   01 Ask         the question, set huge.
//   02 Understand  its letters dissolve into dots that settle into a 32 × 12 embedding; one row (the intent) lights red.
//   03 Check       the embedding gathers into one candidate-answer cluster beside a five-row scorecard. Each check's bar
//                  fills and its tick lands; a few near-misses peel off and fade, the cluster tightens and turns ink → red.
//   04 Answer      after the fifth tick the cluster collapses into one red dot (same centre): 0.4 ms, served from cache.
// Motion pins one full-viewport stage; the particles are a pure function of the pin's timeline time (plus a small
// ambient drift), so scrolling back plays it in reverse. The canvas reads its geometry from the DOM (the question's
// words, the grid box, the cluster box, the dot), so CSS owns the layout at every width. Static (reduced motion) is
// the finished story: the four steps in order, with a CSS dot grid, the finished scorecard and the readout.
export const id = 'pipeline'

const LINES = [['What’s', 'the'], ['refund', 'timeline?']]
// [name, example value, bar fill, threshold]. Values are for the example query only (labelled as such).
const CHECKS = [['similarity', '0.94', 0.94], ['template', '', 1], ['confidence', '0.91 ≥ 0.88', 0.91, 0.88], ['trust', '', 1], ['freshness', '', 1]]
const COLS = 32, ROWS = 12, HOT = 5 // the embedding grid and its intent row

// Each step's art. In motion it is also the geometry the canvas reads.
const ART = [
  `<p class="ck-pl-q"><small>CGET</small>${LINES.map((l) => `<span class="ck-pl-line">${l.map((w) => `<span class="ck-pl-w">${w}</span>`).join(' ')}</span>`).join(' ')}</p>`,
  `<div class="ck-pl-embed"><span class="ck-pl-grid" aria-hidden="true"></span><p class="ck-pl-lbl">meaning + structure · <b>intent: factual</b></p></div>`,
  `<div class="ck-pl-check">
          <span class="ck-pl-cluster" aria-hidden="true"></span>
          <div class="ck-pl-card">
            <p class="ck-pl-eg">Example query <span>“What’s the refund timeline?”</span></p>
            <ol class="ck-pl-checks">${CHECKS.map(([n, v, f, min]) => `<li><span class="ck-pl-name">${n}</span><span class="ck-pl-bar"${min ? ' data-min' : ''} style="--v:${f}${min ? `;--min:${min}` : ''}" aria-hidden="true"><i></i></span><span class="ck-pl-val">${v}</span><svg class="ck-pl-tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.6 3.6L13.5 4" pathLength="1"/></svg></li>`).join('')}</ol>
            <p class="ck-pl-pass"><b>5 / 5</b> passed · reuse the cached answer</p>
            <p class="ck-pl-why"><code>crowkis why</code> walks the five checks for any query.</p>
          </div>
        </div>`,
  `<div class="ck-pl-ans">
          <i class="ck-pl-dot" aria-hidden="true"></i>
          <div class="ck-pl-read"><p class="ck-pl-ms"><b>0.4</b> <em>ms</em></p><p class="ck-pl-served">served from cache</p><p class="ck-pl-miss">→ your LLM (only on a miss)</p></div>
        </div>`,
]

// Terminal line → HTML: the command name in red, quoted strings bright, `# comments` dimmed.
// Copy reads data-copy (the exact c.code.body), so this markup never changes what's copied.
const termLine = (line, esc) => {
  const [cmd, ...rest] = esc(line).split(' ')
  return `<b>${cmd}</b> ${rest.join(' ').replace(/(&quot;.*?&quot;)/g, '<q>$1</q>').replace(/(# .*)$/, '<i>$1</i>')}`
}

// What each line of the sample does, in plain words (order matches c.code.body).
const TRY = [
  ['CSET', 'Stored once'],
  ['CGET', 'Different words · still a hit'],
  ['CSIM', 'How close two questions are'],
]

export const html = ({ c, esc, serif }) => `<section class="ck-scene ck-pipeline" id="how" data-scene="pipeline">
  <header class="ck-pl-head">
    <h2>${serif('From question to answer in *four* steps.')}</h2>
  </header>
  <div class="ck-pl-stage">
    <div class="ck-pl-count" aria-hidden="true"><span class="ck-pl-roll"><span>${c.how.map((_, i) => `<b>0${i + 1}</b>`).join('')}</span></span><small>/ 0${c.how.length}</small></div>
    <ol class="ck-pl-steps">
      ${c.how.map(([title, text], i) => `<li class="ck-pl-step">
        <div class="ck-pl-copy"><span class="ck-pl-num">0${i + 1}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
        ${ART[i]}
      </li>`).join('\n      ')}
    </ol>
    <canvas class="ck-pl-cv" aria-hidden="true"></canvas>
  </div>
  <div class="ck-pl-code">
    <div class="ck-pl-try">
      <div><h3>${serif('Three commands. *That’s the idea.*')}</h3></div>
      <p>Store an answer once. Ask it again in different words, and it still comes back from cache.</p>
    </div>
    <figure class="ck-pl-term">
      <figcaption><span class="ck-pl-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(c.code.title)}</span><button type="button" class="copy" data-copy="${esc(c.code.body)}">Copy</button></figcaption>
      <ol class="ck-pl-rows" role="list">${c.code.body.split('\n').map((line, i) => `<li class="ck-pl-row"><code>${termLine(line, esc)}</code><span class="ck-pl-note">${esc(TRY[i]?.[1] || '')}</span></li>`).join('')}</ol>
      <span class="ck-pl-caret" aria-hidden="true"></span>
    </figure>
  </div>
</section>`

// Timeline beats (timeline seconds; the pin maps scroll onto 0 → END).
// flow: the check step starts (grid → cluster over `band`); check k's tick lands at `checks[k]`; then `collapse` into the dot.
const B = { dissolve: 1.25, fly: [1.45, 3.5], row: 3.8, flow: 4.7, band: 0.9, checks: [5.95, 6.35, 6.75, 7.15, 7.55], collapse: [7.8, 8.5], fade: 8.6, END: 10 }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2) // cubic in-out
// Staggered local progress: particle with stagger s (0..1) runs its own slice of [t0, t1].
const lp = (T, t0, t1, s, spread) => clamp01((T - t0 - s * spread) / (t1 - t0 - spread))
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x) }

export async function init(el, { gsap, ScrollTrigger }) {
  const { SplitText } = await import('gsap/SplitText')
  gsap.registerPlugin(SplitText)
  const $ = (s, r = el) => r.querySelector(s)
  const $$ = (s, r = el) => [...r.querySelectorAll(s)]

  // Title: words rise out of their masks, scrubbed as the scene comes up.
  SplitText.create($('.ck-pl-head h2'), {
    type: 'words', mask: 'words', autoSplit: true,
    onSplit: (self) => gsap.from(self.words, {
      yPercent: 110, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.ck-pl-head', start: 'top 88%', end: 'top 40%', scrub: 0.8 },
    }),
  })

  // ---------- The pinned stage ----------
  const stage = $('.ck-pl-stage'), cv = $('.ck-pl-cv'), ctx = cv.getContext('2d')
  const copies = $$('.ck-pl-copy'), rows = $$('.ck-pl-checks li'), fills = $$('.ck-pl-bar i'), vals = $$('.ck-pl-val'), ticks = $$('.ck-pl-tick path')
  const card = [$('.ck-pl-eg'), ...rows, $('.ck-pl-pass'), $('.ck-pl-why')]
  const mobile = () => innerWidth <= 900
  let on = false // the pin is active

  gsap.set(copies.slice(1), { autoAlpha: 0, y: 24 })
  gsap.set([$('.ck-pl-lbl'), $('.ck-pl-read'), ...card, ...vals], { autoAlpha: 0 })
  gsap.set(fills, { scaleX: 0 })
  gsap.set(ticks, { strokeDashoffset: 1 })
  gsap.set($('.ck-pl-dot'), { scale: 0 })
  gsap.set($('.ck-pl-read'), { y: 30 })

  const seq = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: stage, start: 'top top', end: () => `+=${innerHeight * (mobile() ? 3.4 : 4.2)}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
      onToggle: (self) => { on = self.isActive } }, // draw only while pinned (and while the scrub settles, below)
  })
  const roll = $('.ck-pl-roll > span')
  const swap = (i, at) => seq
    .to(copies[i - 1], { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' }, at)
    .to(copies[i], { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, at + 0.35)
    .to(roll, { yPercent: -25 * i, duration: 0.7, ease: 'power3.inOut' }, at + 0.1)

  seq.to($('.ck-pl-q'), { autoAlpha: 0, duration: 0.35 }, B.dissolve + 0.05) // the letters hand over to their dots
  swap(1, 1.9)
  seq.to($('.ck-pl-lbl'), { autoAlpha: 1, duration: 0.4 }, B.row + 0.1)
    .to($('.ck-pl-lbl'), { autoAlpha: 0, duration: 0.3 }, B.flow - 0.2)
  swap(2, 4.6)
  // Scorecard: label + rows come up while the cluster gathers; then each check scores in turn (bar fills, value
  // shows, tick draws), the verdict line after the fifth, and the card clears as the dot takes over.
  seq.fromTo(card.slice(0, 6), { y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }, B.flow + 0.62) // once the gather has mostly landed
    .to(card[7], { autoAlpha: 1, duration: 0.4 }, B.flow + 1.1)
  B.checks.forEach((t, k) => seq
    .to(fills[k], { scaleX: 1, duration: 0.38, ease: 'power2.inOut' }, t - 0.4)
    .to(vals[k], { autoAlpha: 1, duration: 0.2 }, t - 0.12)
    .to(ticks[k], { strokeDashoffset: 0, duration: 0.18, ease: 'power2.out' }, t))
  seq.to(card[6], { autoAlpha: 1, duration: 0.3 }, B.checks[4] + 0.12)
  swap(3, 7.9)
  seq.to(card, { autoAlpha: 0, duration: 0.4, stagger: 0.03 }, 8.0)
    .to($('.ck-pl-dot'), { scale: 1, duration: 0.35, ease: 'power3.out' }, B.fade)
    .to($('.ck-pl-read'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 8.8)
    .to({}, { duration: B.END - 9.3 }, 9.3) // hold the finished frame before the pin releases

  // ---------- Particles ----------
  // Geometry comes from the DOM, relative to the stage: the question's words (sampled into a point cloud), the grid
  // box, the cluster box (centre + radius) and the dot. Re-read on every refresh (resize, font swap, breakpoint).
  let N = 0, W = 0, H = 0, dpr = 1
  let ax, ay, bx, by, br, hot, col, sc, ph, ux, uy, gq, sg, cx = 0, cy = 0, R = 1, dx = 0, dy = 0, dr = 1, rt = 1, rb = 1.9
  let px, py, pr, bk, FILL = []
  const rel = (e) => { const s = stage.getBoundingClientRect(), r = e.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height } }

  // Sample the question's glyphs on a regular grid, so the dots read as the letters they came from.
  const sample = (target) => {
    const q = rel($('.ck-pl-q')), off = document.createElement('canvas')
    off.width = Math.ceil(q.w) + 4; off.height = Math.ceil(q.h) + 4
    const o = off.getContext('2d')
    $$('.ck-pl-w').forEach((w) => {
      const cs = getComputedStyle(w), r = rel(w)
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing
      const m = o.measureText(w.textContent)
      o.fillText(w.textContent, r.x - q.x, r.y - q.y + m.fontBoundingBoxAscent)
    })
    const d = o.getImageData(0, 0, off.width, off.height).data
    let ink = 0
    for (let i = 3; i < d.length; i += 8) if (d[i] > 128) ink++
    const g = Math.max(2, Math.sqrt((ink * 2) / target)), pts = []
    for (let y = g / 2; y < off.height; y += g)
      for (let x = g / 2; x < off.width; x += g)
        if (d[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 128) pts.push([q.x + x, q.y + y])
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]) // left to right: rank decides grid column and stagger
    // Before fonts/layout settle the question can measure 0×0 and sample no ink; start every dot at its centre
    // rather than crash. The next refresh/resize re-measures with real glyphs.
    if (!pts.length) pts.push([q.x + q.w / 2, q.y + q.h / 2])
    return { pts, g }
  }

  const measure = () => {
    W = stage.clientWidth; H = stage.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    const { pts, g } = sample(mobile() ? 900 : 1700)
    N = Math.max(pts.length, COLS * ROWS) // ponytail: a tiny layout repeats points so every grid cell gets a dot
    rt = Math.max(1, g * 0.32)
    const grid = rel($('.ck-pl-grid')), cw = grid.w / COLS, ch = grid.h / ROWS
    const cl = rel($('.ck-pl-cluster')), dotEl = $('.ck-pl-dot'), dot = rel(dotEl)
    cx = cl.x + cl.w / 2; cy = cl.y + cl.h / 2; R = cl.w / 2; rb = mobile() ? 1.5 : 1.9
    dx = dot.x + dot.w / 2; dy = dot.y + dot.h / 2; dr = dotEl.offsetWidth / 2 // offsetWidth: the dot is scaled to 0 until step 04
    // Brand colours from the tokens: ink → red in five steps (one per passed check). ponytail: assumes rgb() computed values.
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number), ink = rgb(getComputedStyle(el).color), red = rgb(getComputedStyle(dotEl).backgroundColor)
    FILL = [0, 1, 2, 3, 4, 5].map((l) => `rgb(${ink.map((v, c) => Math.round(v + ((red[c] - v) * l) / 5)).join(',')})`)
    const F = (n) => new Float32Array(n)
    ;[ax, ay, bx, by, br, sc, ph, ux, uy, gq, px, py, pr] = Array.from({ length: 13 }, () => F(N))
    hot = new Uint8Array(N); col = F(N); sg = new Int8Array(N); bk = new Int8Array(N)
    const gcx = grid.x + grid.w / 2, gcy = grid.y + grid.h / 2, d2 = F(N)
    for (let i = 0; i < N; i++) {
      const p = pts[i % pts.length], c = Math.floor((i * COLS) / N), r = i % ROWS, cell = c * ROWS + r
      const v = rnd(cell, 7) ** 1.6
      ax[i] = p[0]; ay[i] = p[1]
      bx[i] = grid.x + (c + 0.5) * cw; by[i] = grid.y + (r + 0.5) * ch
      hot[i] = r === HOT; col[i] = c / COLS
      br[i] = Math.min(cw, ch) * (r === HOT ? 0.24 : 0.06 + 0.17 * v)
      ph[i] = rnd(cell, 3) * 6.283 // shared by every dot in a cell, so a cell stays one crisp dot
      sc[i] = (i / N) * 0.75 + rnd(i, 1) * 0.25 // stagger: a left-to-right wave
      d2[i] = (bx[i] - gcx) ** 2 + (by[i] - gcy) ** 2 + rnd(i, 10) // + jitter breaks ties between dots of one cell
    }
    // The cluster is an even sunflower disc. Rank by distance from the grid's centre, so the middle of the embedding
    // lands in the middle of the cluster and its ends become the rim.
    const ord = Array.from({ length: N }, (_, i) => i).sort((a, b) => d2[a] - d2[b])
    ord.forEach((i, q) => {
      const u = Math.sqrt((q + 0.5) / N), a = q * 2.39996
      ux[i] = u * Math.cos(a); uy[i] = u * Math.sin(a)
      gq[i] = 0.7 * (q / N) + 0.3 * rnd(i, 12) // gather stagger: centre first
      sg[i] = u > 0.62 && rnd(i, 8) < 0.24 ? Math.floor(rnd(i, 9) * 5) : -1 // a near-miss on the rim: the check it fails
    })
  }

  let blank = true, lastT = -1
  const lit = [0, 0, 0, 0, 0]
  const mark = (k, v) => { if (lit[k] !== v) { lit[k] = v; rows[k].classList.toggle('is-on', !!v) } } // a passed check: name ink, bar red
  // Fill buckets: 0–5 = checks passed (ink → red, FILL from measure), 6–8 = a near-miss fading as it peels away (ink).
  const FADE = [0.85, 0.55, 0.25]

  const frame = () => {
    const T = seq.time()
    if (!N || (!on && T === lastT)) return
    lastT = T
    const now = performance.now() / 1000
    const alpha = clamp01((T - B.dissolve) / 0.25) * (1 - clamp01((T - B.fade) / 0.25))
    const flow = T >= B.flow
    let n = 0, s = 0 // checks passed: whole (colour) and smooth (tightening)
    B.checks.forEach((t, k) => { mark(k, T >= t ? 1 : 0); if (T >= t) n++; s += clamp01((T - t) / 0.35) })
    if (alpha <= 0) { if (!blank) { ctx.clearRect(0, 0, cv.width, cv.height); blank = true } return }
    blank = false
    const tight = R * (1 - 0.05 * s)
    for (let i = 0; i < N; i++) {
      let x, y, r, j, b
      if (!flow) { // letters → embedding, on a curved flight
        const k = ease(lp(T, B.fly[0], B.fly[1], sc[i], 0.9)), arc = Math.sin(Math.PI * k)
        x = ax[i] + (bx[i] - ax[i]) * k + arc * Math.cos(ph[i] + i) * 90
        y = ay[i] + (by[i] - ay[i]) * k + arc * Math.sin(ph[i] + i) * 90
        r = rt + (br[i] - rt) * k
        j = clamp01((T - B.dissolve) / 0.3) * 1.2 + arc * 3 + (k === 1 ? 0.4 : 0)
        b = hot[i] && T > B.row + col[i] * 0.5 ? 5 : 0
      } else { // grid gathers into the cluster, which tightens and reddens as checks pass, then collapses into the dot
        const m = ease(lp(T, B.flow, B.flow + B.band, gq[i], 0.35)), g = sg[i]
        let cx1 = cx + ux[i] * tight, cy1 = cy + uy[i] * tight
        r = br[i] + (rb - br[i]) * m; j = 0.35 + 0.5 * (1 - m)
        b = Math.max(n, hot[i] ? Math.round(5 * (1 - m)) : 0) // the intent row hands its red back as it joins
        if (g >= 0 && T > B.checks[g]) { // near-miss: peels outward and sinks, fading, never taking the red
          const f = clamp01((T - B.checks[g] - 0.15 * sc[i]) / 0.6)
          cx1 += ux[i] * R * 0.6 * f; cy1 += uy[i] * R * 0.6 * f + f * f * R * 0.4
          r *= 1 - 0.4 * f; b = f >= 1 ? -1 : 6 + Math.min(2, Math.floor(f * 3))
        } else {
          const c = ease(lp(T, B.collapse[0], B.collapse[1], gq[i], 0.3))
          cx1 += (dx + ux[i] * dr * 0.7 - cx1) * c; cy1 += (dy + uy[i] * dr * 0.7 - cy1) * c
          r += (Math.max(1.3, rb * 0.8) - r) * c; j *= 1 - c
        }
        x = bx[i] + (cx1 - bx[i]) * m; y = by[i] + (cy1 - by[i]) * m
      }
      px[i] = x + j * Math.sin(now * 0.8 + ph[i]); py[i] = y + j * Math.cos(now * 0.65 + ph[i] * 1.7)
      pr[i] = r; bk[i] = b
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    for (let b = 0; b < 9; b++) {
      let any = false
      ctx.beginPath()
      for (let i = 0; i < N; i++) if (bk[i] === b) { ctx.moveTo(px[i] + pr[i], py[i]); ctx.arc(px[i], py[i], pr[i], 0, 6.283); any = true }
      if (!any) continue
      ctx.globalAlpha = alpha * (b < 6 ? 1 : FADE[b - 6]); ctx.fillStyle = FILL[b < 6 ? b : 0]; ctx.fill()
    }
  }

  await document.fonts.ready
  measure()
  ScrollTrigger.addEventListener('refresh', measure)
  gsap.ticker.add(frame)

  // Code: the block rises and each line wipes in left to right. Created after the pin so its positions include
  // the pin spacing.
  // Try-it panel: the terminal rises, then each row types in (clip wipe) with its note sliding in beside it.
  const code = { trigger: '.ck-pl-code', scrub: 0.8 }
  gsap.from('.ck-pl-term', { y: 60, ease: 'power2.out', scrollTrigger: { ...code, start: 'top bottom', end: 'top 55%' } })
  const tl = gsap.timeline({ scrollTrigger: { ...code, start: 'top 80%', end: 'top 30%' } })
  el.querySelectorAll('.ck-pl-row').forEach((row, i) => {
    tl.fromTo(row.querySelector('code'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', duration: 1 }, i)
      .fromTo(row.querySelector('.ck-pl-note'), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.5 }, i + 0.6)
  })

  ScrollTrigger.refresh()
}
