// Scene "hero" (BLUE): the page's only h1, one subline, two buttons, and a live decision on a paper slip:
// a support message and a typed question, the model asked in both option orders, then a probability per label
// and the typed answer as a chip. The server renders the finished decision (the no-motion page); with motion the
// slip replays it on an ambient loop while the hero is on screen. The pixel wordmark sits under it all, untouched.
// Example values are the docs' own (Content Box: 3 Use cases/ai-agents.md, the `decide` tool response).
export const id = 'hero'

const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'
const BARS = [['billing', 0.97], ['technical', 0.02], ['sales', 0.01], ['none_of_these', 0]]

export const html = ({ p, esc }) => `<section class="cv-scene cv-hero" data-scene="hero" aria-labelledby="cv-hero-h">
  <div class="cv-hero-dots" aria-hidden="true"></div>
  <div class="cv-hero-in">
    <h1 id="cv-hero-h">Typed decisions with calibrated probabilities, from any LLM.</h1>
    <p class="cv-hero-sub">Send your data and a typed question. Get back one of your labels and a probability for every option. Never free text.</p>
    <div class="cv-hero-cta">
      <a class="cv-hero-btn" href="#start">Get started</a>
      <a class="cv-hero-btn cv-hero-btn-ghost" href="${DOCS}" rel="noopener">Read the docs <span aria-hidden="true">↗</span></a>
    </div>
    <figure class="cv-hero-slip" aria-label="An example decision">
      <dl class="cv-hero-ask">
        <div><dt>state</dt><dd class="cv-hero-msg">I was charged twice, please refund me</dd></div>
        <div><dt>question</dt><dd>Which team should handle this?</dd></div>
      </dl>
      <p class="cv-hero-status" aria-hidden="true"><span>decided</span></p>
      <ol class="cv-hero-bars">${BARS.map(([l, v], i) => `
        <li style="--p:${v};--i:${i}"${i ? '' : ' class="on"'}><span class="cv-hero-lbl">${l}</span><span class="cv-hero-bar"><i></i></span><span class="cv-hero-num">${v.toFixed(2)}</span></li>`).join('')}
      </ol>
      <p class="cv-hero-chip"><code>{"choice": "billing", "confidence": <b>0.97</b>}</code></p>
      <figcaption>Example output from the docs.</figcaption>
    </figure>
    <p class="cv-hero-mark"><img src="${p.wordmark[0]}" alt="${esc(p.name)}" width="${p.wordmark[1]}" height="${p.wordmark[2]}"></p>
  </div>
</section>`

export function init(el, { gsap, ScrollTrigger }) {
  const slip = el.querySelector('.cv-hero-slip')
  const list = el.querySelector('.cv-hero-bars')
  const rows = [...list.children]
  const fills = rows.map((r) => r.querySelector('i'))
  const nums = rows.map((r) => r.querySelector('.cv-hero-num'))
  const status = el.querySelector('.cv-hero-status span')
  const msg = el.querySelector('.cv-hero-msg')
  const chip = el.querySelector('.cv-hero-chip')
  const text = msg.textContent
  const final = BARS.map(([, v]) => v)

  // One probability vector drives every bar and numeral, so they can never disagree. While the model is still
  // being asked the bars move but the numerals stay blank: only the docs' final values are ever printed.
  const pv = { a: 0, b: 0, c: 0, d: 0 }
  let exact = true
  const keys = Object.keys(pv)
  const paint = () => keys.forEach((k, i) => {
    fills[i].style.transform = `scaleX(${pv[k]})`
    nums[i].textContent = exact ? pv[k].toFixed(2) : '-.--'
  })
  const say = (s) => () => (status.textContent = s)
  const type = { n: text.length }
  const vec = (vals, dur, ease = 'power2.inOut') => ({ ...Object.fromEntries(keys.map((k, i) => [k, vals[i]])), duration: dur, ease, onUpdate: paint })
  const rowH = () => rows[1].offsetTop - rows[0].offsetTop

  // The loop: type the message, ask in the original then the reversed option order, average, decide, hold.
  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'power2.out' } })
  tl.add(say('new request'))
    .set(chip, { autoAlpha: 0, y: 10 })
    .add(() => { rows[0].classList.remove('on'); exact = false })
    .to(pv, vec([0, 0, 0, 0], 0.4))
    .fromTo(type, { n: 0 }, { n: text.length, duration: 1.1, ease: 'none', onUpdate: () => (msg.textContent = text.slice(0, Math.round(type.n))) })
    .add(say('asking, original order'))
    .to(pv, vec([0.62, 0.21, 0.09, 0.08], 0.9), '+=0.15')
    .add(say('asking, reversed order'), '+=0.25')
    .to(rows, { y: (i) => (rows.length - 1 - 2 * i) * rowH(), duration: 0.6, ease: 'power3.inOut' }, '<')
    .to(pv, vec([0.88, 0.06, 0.03, 0.03], 0.9), '<0.2')
    .to(rows, { y: 0, duration: 0.6, ease: 'power3.inOut' }, '+=0.35')
    .add(say('averaged'), '<')
    .to(pv, vec(final, 0.8, 'power3.out'), '<0.15')
    .add(() => { status.textContent = 'decided'; exact = true; paint(); rows[0].classList.add('on') })
    .to(chip, { autoAlpha: 1, y: 0, duration: 0.5 }, '<')
    .to({}, { duration: 4.2 })

  // Start from the finished slip the server rendered, and only loop while the hero is on screen.
  tl.progress(1, false).pause()
  let started = false
  const run = (on) => {
    if (!on) return tl.pause()
    if (started) return tl.play()
    started = true
    gsap.delayedCall(2.2, () => ScrollTrigger.isInViewport(el) && tl.restart())
  }
  const st = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => run(s.isActive) })
  if (st.isActive) run(true)

  // Scroll out: the halftone sinks, the slip lifts away. The wordmark never moves.
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.8 } })
    .to(el.querySelector('.cv-hero-dots'), { yPercent: 18 }, 0)
    .to(slip, { y: -70 }, 0)

  // The halftone "light" leans toward the cursor.
  if (!matchMedia('(pointer: fine)').matches) return
  const dots = el.querySelector('.cv-hero-dots')
  const dx = gsap.quickTo(dots, 'x', { duration: 1.2, ease: 'power3' })
  const dy = gsap.quickTo(dots, 'y', { duration: 1.2, ease: 'power3' })
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    dx(((e.clientX - r.left) / r.width - 0.5) * 80)
    dy(((e.clientY - r.top) / r.height - 0.5) * 50)
  })
}
