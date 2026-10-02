// Scene "capabilities": what Crowkis is (kinetic title + comparison) → fact marquee → what it can do for you
// (a two-column ledger: one huge figure and one tiny graphic per benefit, scrubbed from zero as each row rises).
//   id                       matches data-scene on the root <section>
//   html(ctx) -> string      Node only, no DOM. ctx = { p, c, latest, esc, serif, card }
//   init(el, m)              browser only; m = { gsap, ScrollTrigger, lenis }
export const id = 'capabilities'

const FACTS = ['Drop-in', 'RESP3', 'gRPC', 'REST', 'MCP', 'Built in Rust', 'One Docker image', 'Zero external API calls', 'Free community edition']
const COLS = ['Cache', 'How it matches', 'Result']

// Title words are split server-side: each word is an outline (::before, from data-w) under a solid fill that
// a mask wipes in. The pair of spans (.m clips, .f counter-slides) keeps the reveal transform-only.
const words = (title, esc, serif) =>
  title.split(' ').map((w) => `<span class="w" data-w="${esc(w.replace(/\*/g, ''))}"><span class="m"><span class="f">${serif(w)}</span></span></span>`).join(' ')

const facts = (hidden) =>
  `<ul class="ck-cap-facts"${hidden ? ' aria-hidden="true"' : ''}>${FACTS.map((f) => `<li>${f}</li>`).join('')}</ul>`

// "What it can do for you", in c.forYou order: [figure html, label, graphic html]. Figures are first-party claims.
// [data-to] numbers count up from zero with scroll; the markup is the finished state (what reduced motion sees).
const n = (v) => `<b data-to="${v}">${v}</b>`
const fig = (vis, sr) => `<span class="ck-sr">${sr}</span><span aria-hidden="true">${vis}</span>`
const bars = (rows) => `<div class="ck-cap-bars">${rows.map(([l, w, v = '', win]) => `<p${win ? ' class="is-win"' : ''}><span>${l}</span><i><i class="fl" style="--w:${w}"></i></i><span>${v}</span></p>`).join('')}</div>`
const GATES = ['similarity', 'template', 'confidence', 'trust', 'freshness']
const BENEFITS = [
  [fig(n(1), '1'), 'model call per question',
    bars([['without Crowkis', 1, '×50'], ['with Crowkis', 0.02, '×1', 1]])],
  [fig(`${n('0.4')}<small>ms</small>`, '0.4 ms'), 'per cache hit',
    bars([['model round-trip', 1, 'seconds'], ['cache hit', 0.015, '0.4 ms', 1]])],
  [fig(n(5), '5'), 'gates, every hit, every time',
    `<ol class="ck-cap-gates">${GATES.map((g) => `<li>${g}</li>`).join('')}</ol>`],
  [fig('1', '1'), 'Docker image, every feature in',
    '<p class="ck-cap-cmd"><span aria-hidden="true">$</span> <code>docker pull crowkis/crowkis:latest</code></p>'],
  [fig('Free', 'Free'), 'Community edition, self-hosted',
    '<div class="ck-cap-switch" aria-hidden="true"><span class="th"></span><span>Community · Free</span><span>Enterprise</span></div><p class="ck-cap-tiers"><span>no licence, no sign-up</span><span class="ent">+ SSO · audit log · budgets</span></p>'],
]

export const html = ({ c, esc, serif }) => `<section class="ck-scene ck-capabilities" data-scene="capabilities" aria-labelledby="ck-cap-what">
  <div class="ck-cap-what">
    <h2 id="ck-cap-what" class="ck-cap-title">${words(c.what.title, esc, serif)}</h2>
    <p class="ck-cap-lede">${esc(c.what.text)}</p>
    <div class="ck-cap-compare" role="table" aria-label="How Crowkis compares to other caches">
      <div class="ck-cap-row ck-cap-head" role="row">${COLS.map((h) => `<span role="columnheader">${h}</span>`).join('')}</div>
      ${c.what.compare.map(([name, how, res], i, a) => `<div class="ck-cap-row${i === a.length - 1 ? ' is-us' : ''}" role="row">${i === a.length - 1 ? '<span class="ck-cap-glow" aria-hidden="true"></span>' : ''}<span class="ck-cap-name" role="rowheader">${esc(name)}</span><span role="cell">${esc(how)}</span><span role="cell">${esc(res)}</span></div>`).join('\n      ')}
    </div>
  </div>
  <div class="ck-cap-band"><div class="ck-cap-track">${facts(false)}${facts(true)}</div></div>
  <div class="ck-cap-for">
    <h2 class="ck-cap-title2">${'Less spend. Faster answers. *Safer* AI.'.split(/(?<=\.) /).map((l) => `<span>${serif(l)}</span>`).join(' ')}</h2>
    <ul class="ck-cap-list">
      ${c.forYou.map(([t, x], i) => `<li class="ck-cap-item"><span class="ck-cap-rule" aria-hidden="true"></span><p class="ck-cap-fig">${BENEFITS[i][0]}<span class="ck-cap-lbl">${BENEFITS[i][1]}</span></p><div class="ck-cap-viz">${BENEFITS[i][2]}</div><h3>${esc(t)}</h3><p>${esc(x)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>`

export function init(el, { gsap, ScrollTrigger, lenis }) {
  const $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)]
  // Refresh after the scenes above, whose pins may be created later (async inits), so our starts include their spacing.
  const st = (o) => ({ refreshPriority: -1, ...o })

  // Kinetic title: words wipe from outline to solid, one after another, scrubbed.
  const tl = gsap.timeline({ scrollTrigger: st({ trigger: $('.ck-cap-title'), start: 'top 85%', end: 'center 40%', scrub: 0.8 }) })
  $$('.ck-cap-title .w').forEach((w, i) => {
    tl.fromTo(w.querySelector('.m'), { x: 0, xPercent: -100 }, { xPercent: 0, ease: 'none', duration: 1 }, i * 0.7)
      .fromTo(w.querySelector('.f'), { x: 0, xPercent: 100 }, { xPercent: 0, ease: 'none', duration: 1 }, i * 0.7)
  })

  // Comparison: rows slide in staggered, then the two alternatives dim while the Crowkis row fills red.
  const rows = $$('.ck-cap-row:not(.ck-cap-head)')
  const us = $('.is-us')
  gsap.timeline({ scrollTrigger: st({ trigger: $('.ck-cap-compare'), start: 'top 90%', end: 'bottom 40%', scrub: 0.8 }) })
    .fromTo(rows, { xPercent: (i) => 10 + i * 8, opacity: 0.15 }, { xPercent: 0, opacity: 1, ease: 'power2.out', stagger: 0.25 })
    .to(rows.filter((r) => r !== us), { opacity: 0.32, ease: 'none', duration: 0.6 }, '+=0.1')
    .fromTo(us.querySelector('.ck-cap-glow'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, ease: 'power2.inOut', duration: 0.6 }, '<')
    .fromTo(us, { scale: 1 }, { scale: 1.025, ease: 'power2.inOut', duration: 0.6 }, '<')

  // Second title: the three sentences drift in from alternating sides.
  gsap.fromTo($$('.ck-cap-title2 > span'), { x: (i) => (i % 2 ? -1 : 1) * innerWidth * 0.14 }, {
    x: 0, ease: 'none', invalidateOnRefresh: true, scrollTrigger: st({ trigger: $('.ck-cap-title2'), start: 'top 95%', end: 'bottom 45%', scrub: 0.8 }),
  })

  // Ledger: each row is scrubbed while it rises through the lower half of the screen. The rule draws, numbers
  // count up from zero and the row's one graphic plays: bars fill at one speed (so the short one stops first),
  // gates light in step with the count, the command types, the switch slides to Enterprise.
  $$('.ck-cap-item').forEach((item) => {
    const q = (s) => item.querySelector(s), qq = (s) => [...item.querySelectorAll(s)]
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st({ trigger: item, start: 'top 85%', end: 'top 35%', scrub: 0.6 }) })
    tl.fromTo(q('.ck-cap-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.5 }, 0)
    qq('[data-to]').forEach((b) => {
      const to = +b.dataset.to, k = 10 ** (b.dataset.to.split('.')[1] || '').length, o = { v: 0 }
      b.textContent = (0).toFixed(Math.log10(k))
      tl.to(o, { v: to, duration: 1, onUpdate: () => { b.textContent = (Math.floor(o.v * k + 1e-6) / k).toFixed(Math.log10(k)) } }, 0)
    })
    qq('.fl').forEach((f) => {
      const w = parseFloat(f.style.getPropertyValue('--w'))
      tl.fromTo(f, { scaleX: 0 }, { scaleX: w, duration: Math.max(w, 0.06) }, 0)
    })
    qq('.ck-cap-gates li').forEach((g, i) => tl.fromTo(g, { opacity: 0.25 }, { opacity: 1, duration: 0.12 }, i * 0.2 + 0.08))
    if (q('code')) tl.fromTo(q('code'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'steps(34)', duration: 0.9 }, 0)
    if (q('.th')) {
      tl.fromTo(q('.th'), { xPercent: 0 }, { xPercent: 100, ease: 'power2.inOut', duration: 0.5 }, 0.3)
        .fromTo(q('.ent'), { opacity: 0.25 }, { opacity: 1, duration: 0.3 }, 0.55)
    }
  })

  // Marquee: one ticker callback, only while the band is on screen. Scroll velocity speeds it up, sets its
  // direction (down → left, up → right) and skews it; speed and skew settle back when scrolling stops.
  const track = $('.ck-cap-track')
  const setX = gsap.quickSetter(track, 'x', 'px')
  const setSkew = gsap.quickSetter(track, 'skewX', 'deg')
  let w = track.firstElementChild.offsetWidth, x = 0, dir = -1, skew = 0
  const tick = (_, dt) => {
    const v = lenis.velocity
    if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
    x = gsap.utils.wrap(-w, 0, x + dir * dt * (0.06 + Math.min(Math.abs(v), 60) * 0.03))
    skew += (gsap.utils.clamp(-10, 10, -v * 0.4) - skew) * 0.12
    setX(x); setSkew(skew)
  }
  ScrollTrigger.create(st({
    trigger: $('.ck-cap-band'), start: 'top bottom', end: 'bottom top',
    onRefresh: () => { w = track.firstElementChild.offsetWidth },
    onToggle: (s) => (s.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
  }))
}
