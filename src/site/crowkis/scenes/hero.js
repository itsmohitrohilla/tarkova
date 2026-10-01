// Scene "hero": the red stage. Wordmark (the page's only h1), crow, tagline, lede, CTAs and facts, over a live
// halftone dot field that flows, swells under the cursor like a lens and ripples on click. Scrolling out, the red
// stage closes into a rounded card on the next scene's ink, the dots zoom out of focus and the copy layers drift
// at different depths. The one-time intro is CSS (hero.css), so it plays even if this module never runs.
// The logos never move: no transform ever touches the wordmark or the crow.
export const id = 'hero'

export const html = ({ p, c, esc }) => {
  // Tagline words are masked individually for the intro; the text itself stays plain for crawlers.
  const tag = esc(p.tagline).split(' ').map((w, i) => `<span class="ck-hero-w"><span style="--i:${i}">${w}</span></span>`).join(' ')
  return `<section class="ck-scene ck-hero" data-scene="hero">
  <div class="ck-hero-plate" aria-hidden="true"><canvas></canvas></div>
  <div class="ck-hero-in">
    <h1><img src="${p.wordmark[0]}" alt="${esc(p.name)}" width="${p.wordmark[1]}" height="${p.wordmark[2]}"></h1>
    <img class="ck-hero-crow" src="${p.mark[0]}" alt="${esc(p.logoAlt)}" width="${p.mark[1]}" height="${p.mark[2]}">
    <p class="ck-hero-tag">${tag}</p>
    <div class="ck-hero-act">
      <p class="ck-hero-lede">${esc(c.hero)}</p>
      <div class="ck-hero-cta">
        <a class="ck-hero-btn" href="#how" data-cursor="Explore"><span>See how it works <span aria-hidden="true">↓</span></span></a>
        <a class="ck-hero-btn ck-hero-btn-ghost" href="${p.url}" rel="noopener" data-cursor="Visit"><span>Visit crowkis.com <span aria-hidden="true">↗</span></span></a>
      </div>
    </div>
    <dl class="ck-hero-facts">${p.facts.map(([v, l], i) => `<div style="--i:${i}"><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div>
</section>`
}

export function init(el, { gsap, ScrollTrigger }) {
  const plate = el.querySelector('.ck-hero-plate')
  const field = dotField(plate.firstChild, el)
  const fine = matchMedia('(pointer: fine)').matches

  // The field only runs while the hero is on screen.
  const st = ScrollTrigger.create({
    trigger: el, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => (s.isActive ? gsap.ticker.add(field.draw) : gsap.ticker.remove(field.draw)),
  })
  if (st.isActive) gsap.ticker.add(field.draw)
  gsap.from(field.canvas, { opacity: 0, duration: 1.4, ease: 'power2.out' }) // the live field fades in, never pops
  ScrollTrigger.addEventListener('refresh', field.measure)

  // Facts count up once, in step with the CSS intro. The server text is the final value.
  for (const dd of el.querySelectorAll('.ck-hero-facts dd')) {
    const [, num, rest] = dd.textContent.match(/^([\d.]+)(.*)$/) || []
    if (!num) continue
    const dec = (num.split('.')[1] || '').length, o = { v: 0 }
    gsap.to(o, { v: +num, duration: 0.9, delay: 0.25, ease: 'power2.out', onUpdate: () => (dd.textContent = o.v.toFixed(dec) + rest) })
  }

  // Scroll out: the stage becomes a card, the field zooms and dissolves, copy drifts in depth (big screens only).
  const mm = gsap.matchMedia()
  mm.add({ big: '(min-width: 601px) and (pointer: fine)', small: '(max-width: 600px), (pointer: coarse)' }, ({ conditions }) => {
    const inset = conditions.big ? 40 : 12, round = conditions.big ? 56 : 28
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    tl.fromTo(plate, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: `inset(0px ${inset}px ${inset}px ${inset}px round ${round}px)`, ease: 'power1.in' }, 0)
      .to(field, { zoom: 1.6, alpha: 0, ease: 'power1.in' }, 0)
    if (conditions.big)
      tl.to(el.querySelector('.ck-hero-tag'), { y: 60 }, 0)
        .to(el.querySelector('.ck-hero-act'), { y: 110 }, 0)
        .to(el.querySelector('.ck-hero-facts'), { y: 40 }, 0)
  })

  if (!fine) return
  // Tactile CTAs: the pill leans toward the cursor, its label a little further.
  for (const a of el.querySelectorAll('.ck-hero-btn')) {
    const to = (t, p) => gsap.quickTo(t, p, { duration: 0.6, ease: 'power3' })
    const ax = to(a, 'x'), ay = to(a, 'y'), lx = to(a.firstChild, 'x'), ly = to(a.firstChild, 'y')
    a.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2
      ax(dx * 0.25); ay(dy * 0.35); lx(dx * 0.12); ly(dy * 0.18)
    })
    a.addEventListener('pointerleave', () => { ax(0); ay(0); lx(0); ly(0) })
  }
  el.addEventListener('pointermove', (e) => field.point(e.clientX, e.clientY))
  el.addEventListener('pointerleave', () => field.point(null))
  el.addEventListener('pointerdown', (e) => !e.target.closest('a') && field.ripple(e.clientX, e.clientY))
}

// Two-tone halftone: a hex grid of dots whose size follows a slow interference "noise"; dots near the zero band
// vanish, so the field reads as drifting contours. The cursor is a lens (dots swell and bulge outward) and a click
// sends a ring through the grid. `zoom`/`alpha` are scrubbed from outside.
function dotField(canvas, el) {
  const g = canvas.getContext('2d')
  const TAU = Math.PI * 2
  let w = 0, h = 0, dpr = 1, top = 0
  let px = 0, py = 0, mx = 0, my = 0, lens = 0, lensTo = 0
  const ripples = []
  const f = {
    canvas, zoom: 1, alpha: 1,
    measure() {
      dpr = Math.min(devicePixelRatio || 1, 2)
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      top = el.getBoundingClientRect().top + scrollY
    },
    point(x, y) {
      lensTo = x == null ? 0 : 1
      if (x == null) return
      px = x; py = y + scrollY - top
      if (!lens) { mx = px; my = py } // first contact: no sweep in from the corner
    },
    ripple(x, y) {
      ripples.push({ x, y: y + scrollY - top, t: performance.now() / 1000 })
      if (ripples.length > 3) ripples.shift()
    },
    draw() {
      const t = performance.now() / 1000
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      if (f.alpha < 0.01) return
      g.globalAlpha = f.alpha

      mx += (px - mx) * 0.12; my += (py - my) * 0.12
      lens += (lensTo - lens) * 0.06
      while (ripples.length && t - ripples[0].t > 1.6) ripples.shift()

      // Zoom about the middle of whatever part of the hero is on screen; only visible rows are drawn.
      const z = f.zoom, vy = scrollY - top, cx = w / 2, cy = Math.min(h, Math.max(0, vy + innerHeight / 2))
      const pitch = w < 600 ? 13 : 17, R = pitch * 0.5
      const y0 = cy + (Math.max(0, vy) - cy) / z - pitch, y1 = cy + (Math.min(h, vy + innerHeight) - cy) / z + pitch
      const x0 = cx - cx / z - pitch, x1 = cx + cx / z + pitch
      const light = new Path2D(), deep = new Path2D()

      for (let j = Math.floor(y0 / pitch); j * pitch < y1; j++) {
        const y = j * pitch
        for (let i = Math.floor(x0 / pitch); i * pitch < x1; i++) {
          const x = i * pitch + (j & 1) * R
          const n = Math.sin(x * 0.0105 + t * 0.35) * Math.cos(y * 0.0125 - t * 0.28) * 0.6 + Math.sin((x - y) * 0.0062 + t * 0.22) * 0.4
          let r = R * Math.max(0, Math.abs(n) - 0.14) * 1.15

          const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy
          let k = lens * Math.exp(-d2 / 16000)
          for (const rp of ripples) {
            const age = t - rp.t, e = Math.hypot(x - rp.x, y - rp.y) - age * 560
            k += Math.exp(-(e * e) / 1400) * (1 - age / 1.6) * 0.8
          }
          let sx = x, sy = y
          if (k > 0.01) {
            r += (R * 0.92 - r) * Math.min(k, 1)
            const d = Math.sqrt(d2) || 1
            sx += (dx / d) * k * 12; sy += (dy / d) * k * 12
          }
          const s = r * z
          if (s < 0.35) continue
          const X = cx + (sx - cx) * z, Y = cy + (sy - cy) * z
          const p = n > 0 || k > 0.35 ? light : deep
          p.moveTo(X + s, Y); p.arc(X, Y, s, 0, TAU)
        }
      }
      g.fillStyle = 'rgba(255, 88, 64, 0.5)'; g.fill(light)
      g.fillStyle = 'rgba(120, 0, 0, 0.45)'; g.fill(deep)
    },
  }
  f.measure()
  new ResizeObserver(f.measure).observe(canvas)
  return f
}
