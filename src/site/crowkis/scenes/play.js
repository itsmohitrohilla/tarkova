// Scene "play": a pocket version of crowkis.com's "The Murder" shooter, on ink, right before the finale.
// Sprites, palette and scoring follow the original game (16×12 pixel crows, red crow = 5×, combos). The
// canvas idles in an attract mode while on screen and sleeps offscreen. Without the motion engine (reduced
// motion) init never runs: the stage stays a static sky with the card linking to the full game.
//   id                       matches data-scene on the root <section>
//   html(ctx) -> string      Node only, no DOM. ctx = { p, c, latest, esc, serif, card }
//   init(el, m)              browser only; m = { gsap, ScrollTrigger, lenis }
export const id = 'play'

// The original game's crow: [x, y, w, h, fill?] on a 16×12 grid; the wing alternates between two frames.
const INK = '#16130e', WING = '#37322a', RED = '#d62221', CREAM = '#fffdf9'
const BODY = [[10, 0, 4, 4], [14, 1, 2, 1], [9, 3, 2, 2], [3, 4, 8, 4], [0, 4, 2, 1], [0, 5, 3, 2]]
const FLAP = [[[4, 0, 5, 2, WING], [5, 2, 4, 2, WING]], [[5, 8, 4, 2, WING], [4, 6, 5, 2, WING]]]
const ROUND = 60 // seconds
const BEST_KEY = 'ck-play-best'

const crowRects = (red, frame) => [...BODY, ...FLAP[frame]].map(([x, y, w, h, f]) => [x, y, w, h, f || (red ? RED : INK)])
  .concat([[12, 1, 1, 1, red ? CREAM : RED]]) // the eye

// Card emblem (server SVG): the murder in miniature, red one in the middle.
const emblem = () => `<svg class="ck-play-emblem" viewBox="0 0 56 12" width="168" height="36" shape-rendering="crispEdges" aria-hidden="true">${
  [0, 1, 0].map((red, i) => crowRects(red, i % 2).map(([x, y, w, h, f]) => `<rect x="${x + i * 20}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('')).join('')}</svg>`

export const html = ({ c, esc, serif }) => `<section class="ck-scene ck-play" data-scene="play" aria-labelledby="ck-play-h">
  <header class="ck-play-head">
    <p class="ck-play-kicker">A group of crows is called a murder</p>
    <h2 id="ck-play-h">${serif('Take five. *Shoot the murder.*')}</h2>
    <div class="ck-play-copy">
      <p>Certified brain rot. Crows fly across the screen, you click them out of the sky, combos stack, the clock runs. One minute. One high score. No crows are harmed, they respawn out of spite.</p>
      <p class="ck-play-rules">red crows = 5× · chain kills for a combo multiplier · esc to leave</p>
    </div>
  </header>
  <div class="ck-play-stage" data-state="idle" data-cursor="Shoot" tabindex="-1">
    <canvas aria-hidden="true"></canvas>
    <div class="ck-play-hud" hidden>
      <p class="ck-play-box"><span>score</span><b data-hud="score">0</b></p>
      <p class="ck-play-box"><span>best</span><b data-hud="best">0</b></p>
      <p class="ck-play-box is-combo" hidden><span>combo</span><b data-hud="combo">×2</b></p>
      <p class="ck-play-box is-time"><span>time</span><b data-hud="time">${ROUND}</b></p>
    </div>
    <div class="ck-play-card">
      ${emblem()}
      <p class="ck-play-eyebrow">${ROUND} seconds · one high score</p>
      <p class="ck-play-result" aria-live="polite"></p>
      <button type="button" class="ck-play-start" hidden>Start shooting</button>
      <p class="ck-play-keys" hidden>space to start · esc to exit</p>
      <a class="ck-play-full" href="${esc(c.play.url)}" target="_blank" rel="noopener">Play the full game on crowkis.com <span aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>`

// Backdrop, after the full game: trees (60×100 box) and bushes (40×18 box) along a water line.
const TREES = [[1, 150], [9, 116, 1], [17, 170], [25, 104, 1], [34, 158], [43, 120, 1], [52, 148], [61, 110, 1], [69, 166], [78, 118, 1], [86, 156], [94, 108, 1]]
const BUSHES = [[6, 60], [21, 48], [31, 60], [47, 44], [58, 60], [74, 50], [90, 60]]
const G1 = '#6f9e5c', G2 = '#547d44', G3 = '#93bd79'
const CLOUDS = [[0.12, 0.16, 90], [0.58, 0.1, 120], [0.38, 0.26, 70], [0.76, 0.2, 84]]

export function init(el, { gsap }) {
  const stage = el.querySelector('.ck-play-stage')
  const canvas = stage.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const card = stage.querySelector('.ck-play-card')
  const btn = card.querySelector('.ck-play-start')
  const eyebrow = card.querySelector('.ck-play-eyebrow')
  const result = card.querySelector('.ck-play-result')
  const hud = Object.fromEntries([...stage.querySelectorAll('[data-hud]')].map((b) => [b.dataset.hud, b]))
  const comboBox = hud.combo.parentElement
  // The game chrome only exists once the game does (the static page keeps just the link).
  btn.hidden = card.querySelector('.ck-play-keys').hidden = stage.querySelector('.ck-play-hud').hidden = false

  let best = 0
  try { best = +localStorage.getItem(BEST_KEY) || 0 } catch {}

  // Sprites pre-rendered at 1px per cell ([red][frame]); drawn scaled with smoothing off.
  const sprites = [0, 1].map((red) => [0, 1].map((frame) => {
    const c = document.createElement('canvas')
    c.width = 16; c.height = 12
    const g = c.getContext('2d')
    for (const [x, y, w, h, f] of crowRects(red, frame)) { g.fillStyle = f; g.fillRect(x, y, w, h) }
    return c
  }))

  // Size: CSS px W×H, device ratio capped at 2; the static backdrop is baked once per resize.
  let W = 0, H = 0, dpr = 1, cell = 4, waterY = 0
  const bg = document.createElement('canvas')
  const resize = () => {
    W = stage.clientWidth; H = stage.clientHeight // layout size: ignores the scroll-scrub scale
    dpr = Math.min(2, devicePixelRatio || 1)
    cell = W >= 720 ? 4 : 3
    waterY = H - (H < 480 ? 44 : 60)
    for (const c of [canvas, bg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
    paintBackdrop(bg.getContext('2d'))
    if (!raf) draw() // keep the frame current while asleep
  }

  function paintBackdrop(g) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const sky = g.createLinearGradient(0, 0, 0, waterY)
    sky.addColorStop(0, '#bfe0ef'); sky.addColorStop(1, '#eaf5ee')
    g.fillStyle = sky; g.fillRect(0, 0, W, H)
    // Sun with a soft halo.
    const sx = W * 0.84, sy = H * 0.2, sr = W < 600 ? 22 : 32
    const halo = g.createRadialGradient(sx, sy, sr, sx, sy, sr * 2.4)
    halo.addColorStop(0, 'rgba(253, 230, 138, 0.75)'); halo.addColorStop(1, 'rgba(253, 230, 138, 0)')
    g.fillStyle = halo; g.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6)
    g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fillStyle = '#fcd34d'; g.fill()
    g.lineWidth = 2; g.strokeStyle = INK; g.stroke()
    // Box helper in the current (scaled) space: fill, then an ink outline.
    const box = (x, y, w, h, fill, lw) => { g.fillStyle = fill; g.fillRect(x, y, w, h); if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.strokeRect(x, y, w, h) } }
    const k = Math.min(1, H / 620, 0.4 + W / 1400) // narrow stages get shorter trees…
    for (const [at, h0, flip] of W < 600 ? TREES.filter((tr) => !tr[2]) : TREES) { // …and half as many
      const h = h0 * k, s = h / 100
      g.save(); g.translate(W * at / 100 + (flip ? 60 * s : 0), waterY - h + 4); g.scale(flip ? -s : s, s)
      box(26, 42, 8, 58, INK); box(18, 50, 10, 5, INK); box(34, 38, 14, 5, INK)
      box(8, 8, 44, 36, G1, 2.5); box(2, 24, 20, 18, G2, 2.5); box(38, 20, 20, 18, G3, 2.5); box(16, 2, 24, 14, G3, 2.5)
      for (const [x, y] of [[14, 16], [40, 26], [27, 30]]) box(x, y, 5, 5, RED, 1.5)
      g.restore()
    }
    for (const [at, w0] of BUSHES) {
      const s = (w0 * k) / 40
      g.save(); g.translate(W * at / 100, waterY - 18 * s + 2); g.scale(s, s)
      box(2, 6, 16, 12, G2, 2); box(12, 2, 18, 16, G1, 2); box(26, 8, 12, 10, G3, 2)
      g.restore()
    }
    g.fillStyle = G2; g.fillRect(0, waterY - 10, W, 10)
    g.fillStyle = '#5fa8c9'; g.fillRect(0, waterY, W, H - waterY)
    g.fillStyle = INK; g.fillRect(0, waterY, W, 2)
  }

  // ---- Game state -------------------------------------------------------------------------------------
  let state = 'idle' // idle (attract) | play | over (attract again, card shows the result)
  let t = 0, left = ROUND, score = 0, chain = 0, lastHit = -9, spawnIn = 0, shake = 0, nextId = 0
  let crows = [], bits = [], pops = []
  const mult = () => Math.min(5, 1 + Math.floor(chain / 3))
  const speedK = () => Math.max(0.55, Math.min(1, W / 1100)) // narrow stages get slower crows

  function spawn() {
    const play = state === 'play', el = ROUND - left
    const fromLeft = Math.random() < 0.5, red = Math.random() < 0.12
    const u = (play ? 130 + 9 * el + 90 * Math.random() : 45 + 35 * Math.random()) * speedK() * (red ? 1.7 : 1)
    const w = 16 * cell
    crows.push({
      id: nextId++, red, w, h: 12 * cell,
      x: fromLeft ? -w : W, y: H * (0.12 + 0.5 * Math.random()),
      vx: fromLeft ? u : -u, vy: (Math.random() - 0.5) * 40 * speedK(), phase: Math.random() * 6,
    })
  }
  // Where a crow is drawn this frame (the bob is part of its position, so hits match what you see).
  const pos = (c) => [c.x, c.y + Math.sin(t * 4 + c.phase) * 5]

  function step(dt) {
    t += dt
    if (state === 'play') {
      left = Math.max(0, left - dt)
      if (!left) end()
    }
    spawnIn -= dt
    if (spawnIn <= 0) {
      const play = state === 'play', el = ROUND - left
      if (play || crows.length < 5) spawn()
      if (play && el > 12 && Math.random() < 0.4) spawn()
      spawnIn = play ? Math.max(0.42, 1.1 - 0.022 * el) : 1.7
    }
    for (const c of crows) {
      c.x += c.vx * dt; c.y += c.vy * dt
      if ((c.y < H * 0.08 && c.vy < 0) || (c.y > H * 0.62 && c.vy > 0)) c.vy *= -1
    }
    crows = crows.filter((c) => c.x > -c.w * 2 && c.x < W + c.w)
    for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 520 * dt; b.life -= dt }
    bits = bits.filter((b) => b.life > 0)
    for (const p of pops) p.age += dt
    pops = pops.filter((p) => p.age < 0.9)
    shake = Math.max(0, shake - dt)
    if (chain && t - lastHit > 1.2) setChain(0) // the chain window lapsed
    const secs = Math.ceil(left)
    if (hud.time.textContent != secs) { hud.time.textContent = secs; stage.classList.toggle('is-late', state === 'play' && secs <= 5) }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    if (shake) ctx.translate(Math.round((Math.random() - 0.5) * 8 * shake / 0.18), Math.round((Math.random() - 0.5) * 8 * shake / 0.18))
    ctx.drawImage(bg, 0, 0, W, H)
    // Drifting clouds.
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(22, 19, 14, 0.22)'; ctx.fillStyle = 'rgba(255, 253, 249, 0.72)'
    for (const [cx, cy, cw] of CLOUDS) {
      const w = cw * speedK(), x = ((cx * W + t * 9) % (W + w)) - w
      ctx.beginPath(); ctx.roundRect(Math.round(x), Math.round(cy * H), w, 22 * speedK(), 11); ctx.fill(); ctx.stroke()
    }
    // Water: rows of highlight dashes sliding at different speeds.
    ctx.fillStyle = 'rgba(159, 208, 227, 0.8)'
    for (let row = 0; row < 3; row++) {
      const y = waterY + 10 + row * ((H - waterY - 14) / 3), off = (t * (14 + row * 9)) % 32
      for (let x = -32 + off + row * 11; x < W; x += 32) ctx.fillRect(Math.round(x), Math.round(y), 10 + row * 2, 3)
    }
    for (const c of crows) {
      const [x, y] = pos(c)
      const img = sprites[+c.red][Math.floor((t + c.phase) / (c.red ? 0.08 : 0.12)) % 2]
      ctx.save(); ctx.translate(Math.round(x) + (c.vx < 0 ? c.w : 0), Math.round(y)); ctx.scale(c.vx < 0 ? -1 : 1, 1)
      ctx.drawImage(img, 0, 0, c.w, c.h)
      ctx.restore()
    }
    for (const b of bits) {
      ctx.globalAlpha = Math.min(1, b.life / 0.3); ctx.fillStyle = b.color
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h)
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, (0.9 - p.age) / 0.3)
      ctx.font = `700 ${p.size}px 'Funnel Sans', system-ui, sans-serif`
      const y = Math.round(p.y - p.age * 40)
      ctx.lineWidth = 4; ctx.strokeStyle = CREAM; ctx.strokeText(p.text, p.x, y)
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, y)
    }
    ctx.globalAlpha = 1
  }

  // ---- Loop: runs only while the stage is on screen and the tab visible (a round pauses meanwhile). -----
  let raf = 0, last = 0, onScreen = false
  const frame = (now) => {
    raf = 0
    if (!onScreen || document.hidden) return
    step(Math.min(0.05, (now - last) / 1000)); last = now
    draw()
    raf = requestAnimationFrame(frame)
  }
  const wake = () => { if (!raf && onScreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame) } }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; wake() }, { rootMargin: '80px' }).observe(stage)
  document.addEventListener('visibilitychange', wake)
  new ResizeObserver(resize).observe(stage)

  // ---- Rounds -----------------------------------------------------------------------------------------
  const setState = (s) => { state = s; stage.dataset.state = s }
  const setChain = (n) => {
    chain = n
    comboBox.hidden = mult() < 2
    hud.combo.textContent = `×${mult()}`
  }
  const setScore = (n) => { score = n; hud.score.textContent = n }
  hud.best.textContent = best

  function start() {
    setState('play')
    left = ROUND; spawnIn = 0; crows = []; bits = []; pops = []
    setScore(0); setChain(0)
    result.textContent = ''
    stage.focus({ preventScroll: true })
    wake()
  }
  function end() {
    const isBest = score > best
    if (isBest) {
      best = score; hud.best.textContent = best
      try { localStorage.setItem(BEST_KEY, best) } catch {}
    }
    setState('over'); setChain(0)
    eyebrow.textContent = 'Round over'
    result.innerHTML = `<span class="ck-play-sr">Final score: </span><b>${score}</b><span>${isBest && score ? 'New best!' : `Best ${best}`}</span>`
    btn.textContent = 'Play again'
    btn.focus({ preventScroll: true })
  }
  function abort() { // Esc: back to the attract screen, nothing recorded
    setState('idle'); setChain(0); left = ROUND
    btn.focus({ preventScroll: true })
  }
  btn.addEventListener('click', start)

  // ---- Shooting: mouse fires on press; touch/pen on release, so a swipe still scrolls the page. ---------
  function shoot(e) {
    if (state !== 'play') return
    const r = canvas.getBoundingClientRect()
    const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height)
    let hit = null, bestD = Infinity
    for (const c of crows) {
      const [cx, cy] = pos(c), pad = Math.max(12, c.w * 0.3)
      if (x < cx - pad || x > cx + c.w + pad || y < cy - pad || y > cy + c.h + pad) continue
      const d = Math.hypot(x - cx - c.w / 2, y - cy - c.h / 2)
      if (d < bestD) { bestD = d; hit = c }
    }
    if (!hit) { // a miss: a puff of dust and the combo is gone
      setChain(0)
      for (let i = 0; i < 5; i++) bits.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 60, w: 2, h: 2, life: 0.3, color: CREAM })
      return
    }
    crows = crows.filter((c) => c !== hit)
    setChain(t - lastHit < 1.2 ? chain + 1 : 1); lastHit = t
    const pts = (hit.red ? 5 : 1) * mult()
    setScore(score + pts)
    const [cx, cy] = pos(hit), mx = Math.max(40, Math.min(W - 40, cx + hit.w / 2)), my = cy + hit.h / 2
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, v = 70 + Math.random() * 110
      bits.push({ x: mx, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, w: cell * 2, h: cell, life: 0.55 + Math.random() * 0.25, color: i % 3 ? (i % 2 ? WING : INK) : RED })
    }
    pops.push({ x: mx, y: cy - 6, text: `+${pts}`, color: hit.red ? RED : INK, size: hit.red ? 26 : 20, age: 0 })
    if (mult() > 1) pops.push({ x: mx, y: cy + 16, text: `×${mult()} combo`, color: RED, size: 15, age: 0 })
    if (hit.red) shake = 0.18
  }
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) shoot(e) })
  canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') shoot(e) })

  // Space starts (when the stage is on screen and focus isn't on a control), Esc leaves a round.
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'play') abort()
    if (e.code !== 'Space' || !onScreen || e.target.closest?.('a, button, input, textarea, select, [contenteditable]')) return
    e.preventDefault() // no page jump while aiming
    if (state !== 'play') start()
  })

  // Scroll polish: the stage settles from slightly small as it arrives (scrubbed, never a pop-in).
  gsap.fromTo(stage, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top 45%', scrub: 1, refreshPriority: -1 } })
}
