// Scene "pipeline": how a query flows through Crowkis, told as one scroll-scrubbed particle sequence on paper,
// with one example query ("What's the refund timeline?"):
//   01 Ask         the question, set huge.
//   02 Understand  its letters dissolve into dots that settle into a 32 × 12 embedding; one row (the intent) lights red.
//   03 Check       the embedding squeezes into a band and flows left → right through five thin gates; at each gate a few
//                  near-misses stop and drop away, the rest pass and redden. A gate turns red once most of the stream is through.
//   04 Answer      the survivors converge into one red dot just past the last gate: 0.4 ms, served from cache.
// Motion pins one full-viewport stage; the particles are a pure function of the pin's timeline time (plus a small
// ambient drift), so scrolling back plays it in reverse. The canvas reads its geometry from the DOM (the question's
// words, the grid box, the gates, the dot), so CSS owns the layout at every width. Static (reduced motion) is the
// finished story: the four steps in order, with a CSS dot grid, the gates and the readout.
export const id = 'pipeline'

const LINES = [['What’s', 'the'], ['refund', 'timeline?']]
const GATES = ['similarity', 'template', 'confidence', 'trust', 'freshness']
const COLS = 32, ROWS = 12, HOT = 5 // the embedding grid and its intent row

// Each step's art. In motion it is also the geometry the canvas reads.
const ART = [
  `<p class="ck-pl-q"><small>CGET</small>${LINES.map((l) => `<span class="ck-pl-line">${l.map((w) => `<span class="ck-pl-w">${w}</span>`).join(' ')}</span>`).join(' ')}</p>`,
  `<div class="ck-pl-embed"><span class="ck-pl-grid" aria-hidden="true"></span><p class="ck-pl-lbl">meaning + structure · <b>intent: factual</b></p></div>`,
  `<div class="ck-pl-check">
          <ol class="ck-pl-gates">${GATES.map((g) => `<li><i aria-hidden="true"></i><span>${g}</span></li>`).join('')}</ol>
          <p class="ck-pl-why"><code>crowkis why</code> walks the five gates for any query.</p>
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
    <p class="ck-pl-kicker">How it works</p>
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
      <div><p class="ck-pl-kicker">Try it</p><h3>${serif('Three commands. *That’s the idea.*')}</h3></div>
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
// flow: the check step (grid → band over `band`, then the band travels from `go` until everything reaches the dot).
const B = { dissolve: 1.25, fly: [1.45, 3.5], row: 3.8, flow: [4.7, 8.5], band: 0.8, go: 5.1, fade: 8.6, END: 10 }
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
  gsap.from($('.ck-pl-head .ck-pl-kicker'), { x: -40, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: '.ck-pl-head', start: 'top 92%', end: 'top 60%', scrub: 0.8 } })

  // ---------- The pinned stage ----------
  const stage = $('.ck-pl-stage'), cv = $('.ck-pl-cv'), ctx = cv.getContext('2d')
  const copies = $$('.ck-pl-copy'), gates = $$('.ck-pl-gates li'), bars = $$('.ck-pl-gates i'), names = $$('.ck-pl-gates span')
  const mobile = () => innerWidth <= 900
  let on = false // the pin is active

  gsap.set(copies.slice(1), { autoAlpha: 0, y: 24 })
  gsap.set([$('.ck-pl-lbl'), $('.ck-pl-why'), $('.ck-pl-read'), ...names], { autoAlpha: 0 })
  gsap.set(bars, { scaleY: 0 })
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
    .to($('.ck-pl-lbl'), { autoAlpha: 0, duration: 0.3 }, B.flow[0] - 0.2)
  swap(2, 4.6)
  seq.to(bars, { scaleY: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, B.flow[0])
    .to(names, { autoAlpha: 1, duration: 0.4, stagger: 0.1 }, B.flow[0] + 0.2)
    .to($('.ck-pl-why'), { autoAlpha: 1, duration: 0.4 }, 5.4)
  swap(3, 7.9)
  seq.to([...gates, $('.ck-pl-why')], { autoAlpha: 0, duration: 0.5, stagger: -0.04 }, 8.1)
    .to($('.ck-pl-dot'), { scale: 1, duration: 0.35, ease: 'power3.out' }, B.fade)
    .to($('.ck-pl-read'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 8.8)
    .to({}, { duration: B.END - 9.3 }, 9.3) // hold the finished frame before the pin releases

  // ---------- Particles ----------
  // Geometry comes from the DOM, relative to the stage: the question's words (sampled into a point cloud), the grid
  // box, the gates (their x, the row's centre line and height), and the dot. Re-read on every refresh (resize, font
  // swap, breakpoint).
  let N = 0, W = 0, H = 0, dpr = 1
  let ax, ay, bx, by, br, hot, col, sc, ph, x0, y0, D, xe, sg, gx = [], gy = 0, gh = 0, bh = 1, sp = 1, dx = 0, dy = 0, dr = 1, rt = 1, rb = 1.9
  let px, py, pr, bk
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
    return { pts, g }
  }

  const measure = () => {
    W = stage.clientWidth; H = stage.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2)
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    const { pts, g } = sample(mobile() ? 900 : 1700)
    N = Math.max(pts.length, COLS * ROWS) // ponytail: a tiny layout repeats points so every grid cell gets a dot
    rt = Math.max(1, g * 0.32)
    const grid = rel($('.ck-pl-grid')), cw = grid.w / COLS, ch = grid.h / ROWS
    const row = rel($('.ck-pl-gates')), dot = rel($('.ck-pl-dot'))
    gx = gates.map((g) => { const r = rel(g); return r.x + r.w / 2 })
    gy = row.y + row.h / 2; gh = row.h; bh = gh * 0.36; rb = mobile() ? 1.5 : 1.9; sp = gx[1] - gx[0]
    dx = dot.x + dot.w / 2; dy = dot.y + dot.h / 2; dr = dot.w / 2
    const xB = gx[0] - 0.7 * sp, xA = Math.max(rel(copies[0]).x, gx[0] - 2.6 * sp) // the band waits left of the first gate, inside the gutter
    const F = (n) => new Float32Array(n)
    ;[ax, ay, bx, by, br, sc, ph, x0, y0, D, xe, px, py, pr] = Array.from({ length: 14 }, () => F(N))
    hot = new Uint8Array(N); col = F(N); sg = new Int8Array(N); bk = new Int8Array(N)
    for (let i = 0; i < N; i++) {
      const p = pts[i % pts.length], c = Math.floor((i * COLS) / N), r = i % ROWS, cell = c * ROWS + r
      const v = rnd(cell, 7) ** 1.6
      ax[i] = p[0]; ay[i] = p[1]
      bx[i] = grid.x + (c + 0.5) * cw; by[i] = grid.y + (r + 0.5) * ch
      hot[i] = r === HOT; col[i] = c / COLS
      br[i] = Math.min(cw, ch) * (r === HOT ? 0.24 : 0.06 + 0.17 * v)
      ph[i] = rnd(cell, 3) * 6.283 // shared by every dot in a cell, so a cell stays one crisp dot
      sc[i] = (i / N) * 0.75 + rnd(i, 1) * 0.25 // stagger: a left-to-right wave
      // The band keeps the grid's order (columns → x, rows → y), so the squeeze reads as the same embedding.
      x0[i] = xA + ((xB - xA) * (c + rnd(i, 10))) / COLS
      y0[i] = gy + ((r + rnd(i, 11)) / ROWS - 0.5) * bh
      D[i] = (dx - xA) * (1 + 0.12 * rnd(i, 12)) // enough travel for the band's tail to reach the dot
      xe[i] = dx + (rnd(i, 13) - 0.5) * 1.2 * dr // where it settles inside the dot
      sg[i] = rnd(i, 8) < 0.18 ? Math.floor(rnd(i, 9) * 5) : -1 // a near-miss: the gate that vetoes it
    }
  }

  let blank = true, lastT = -1
  const lit = [0, 0, 0, 0, 0], passed = [0, 0, 0, 0, 0]
  const light = (k, v) => { if (lit[k] !== v) { lit[k] = v; gates[k].classList.toggle('is-on', !!v) } }
  // Fill buckets: 0–5 = gates passed (ink → red in five steps), 6–8 = a vetoed dot fading as it drops (ink).
  const FILL = [0, 1, 2, 3, 4, 5].map((l) => `rgb(${Math.round(17 + (196 * l) / 5)},${Math.round(17 - (17 * l) / 5)},${Math.round(17 - (17 * l) / 5)})`)
  const FADE = [0.85, 0.55, 0.25]

  const frame = () => {
    const T = seq.time()
    if (!N || (!on && T === lastT)) return
    lastT = T
    const now = performance.now() / 1000
    const alpha = clamp01((T - B.dissolve) / 0.25) * (1 - clamp01((T - B.fade) / 0.25))
    const flow = T >= B.flow[0]
    if (!flow) gates.forEach((_, k) => light(k, 0))
    if (alpha <= 0) { if (!blank) { ctx.clearRect(0, 0, cv.width, cv.height); blank = true } return }
    blank = false
    passed.fill(0)
    const u = clamp01((T - B.go) / (B.flow[1] - B.go)), tr = 0.5 * u + 0.5 * u * u * (3 - 2 * u) // travel: steady, soft at both ends
    for (let i = 0; i < N; i++) {
      let x, y, r, j, b
      if (!flow) { // letters → embedding, on a curved flight
        const k = ease(lp(T, B.fly[0], B.fly[1], sc[i], 0.9)), arc = Math.sin(Math.PI * k)
        x = ax[i] + (bx[i] - ax[i]) * k + arc * Math.cos(ph[i] + i) * 90
        y = ay[i] + (by[i] - ay[i]) * k + arc * Math.sin(ph[i] + i) * 90
        r = rt + (br[i] - rt) * k
        j = clamp01((T - B.dissolve) / 0.3) * 1.2 + arc * 3 + (k === 1 ? 0.4 : 0)
        b = hot[i] && T > B.row + col[i] * 0.5 ? 5 : 0
      } else { // grid squeezes into a band, then the band runs the gates; the gate logic uses the path position `a`
        const m = ease(lp(T, B.flow[0], B.flow[0] + B.band, col[i], 0.35)), g = sg[i]
        let a = x0[i] + D[i] * tr, yy = y0[i], fall = -1
        if (g >= 0 && a > gx[g] - 3) { fall = clamp01((a - gx[g] + 3 - 0.35 * sp) / (1.5 * sp)); a = gx[g] - 3 } // vetoed: stops at its gate, holds, then drops
        let n = 0
        for (let k = 0; k < 5; k++) if (a > gx[k]) { n++; passed[k]++ }
        if (a > gx[4]) { // past the last gate: funnel into the dot
          a = Math.min(a, xe[i])
          yy += (dy + ((y0[i] - gy) * 1.6 * dr) / bh - yy) * ease(clamp01((a - gx[4]) / (xe[i] - gx[4])))
        }
        x = bx[i] + (a - bx[i]) * m; y = by[i] + (yy - by[i]) * m
        r = br[i] + (rb - br[i]) * m; j = 0.35 + 0.5 * (1 - m)
        if (fall >= 0) { y += fall * fall * gh * 0.45; r *= 1 - 0.3 * fall; b = fall >= 1 ? -1 : fall > 0 ? 6 + Math.min(2, Math.floor(fall * 3)) : 0 }
        else b = Math.max(n, hot[i] ? Math.round(5 * (1 - m)) : 0) // the intent row hands its red back as it joins the band
      }
      px[i] = x + j * Math.sin(now * 0.8 + ph[i]); py[i] = y + j * Math.cos(now * 0.65 + ph[i] * 1.7)
      pr[i] = r; bk[i] = b
    }
    if (flow) for (let k = 0; k < 5; k++) light(k, passed[k] > N * 0.5 ? 1 : 0) // a gate turns red once most of the stream is through it

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
