// Scene "voice": the voice-agent feature, told as three beats on red.
//   1. Caller 1 asks; the question travels to your model; the answer comes back; Crowkis keeps only its SHAPE
//      ({order_id}, {date}) and the caller's values drop away, never stored.
//   2. Caller 2 asks in other words; the shape is served and filled with Caller 2's own values; the model is
//      never called; the agent speaks the reply.
//   3. The realtime turn gate: on a one-second spoken-turn budget the cached reply lands at the very start and the
//      model's respond event is skipped (no inference, no synthesis billed).
// ≥1024px pins the three rows and scrubs them in order; below that each beat scrubs as it scrolls through.
// Static (reduced motion) is the finished story. Waveforms are ambient and only run while the scene is on screen.
export const id = 'voice'

// Waveform bars: a fixed, deterministic silhouette (so the static page shows a real waveform).
const BARS = 34
const wave = (key, seed) => `<span class="ckv-wave" data-wave="${key}" aria-hidden="true">${Array.from({ length: BARS }, (_, i) =>
  `<i style="--h:${(0.16 + 0.84 * Math.abs(Math.sin(i * 1.93 + seed) * Math.cos(i * 0.41 + seed * 2))).toFixed(2)}"></i>`).join('')}</span>`
const who = (label, cls = '') => `<span class="ckv-who${cls}"><i></i>${label}</span>`
const stamp = (t, cls = '') => `<em class="ckv-stamp${cls}">${t}</em>`
const slot = (ph, val) => val
  ? `<span class="ckv-slot is-fill"><span aria-hidden="true">${ph}</span><span>${val}</span></span>`
  : `<span class="ckv-slot">${ph}</span>`

const BEATS = [
  ['The first caller asks. Your model answers once.',
    'Crowkis keeps the shape of the answer. The caller’s details are never stored.'],
  ['The next caller gets their own answer.',
    'Same shape, this caller’s details. No model call.'],
  ['The reply lands before the model would speak.',
    'On a hit, the model’s respond event is skipped. Works with any realtime voice API.'],
]

const FIGS = [
  `<figure class="ckv-fig ckv-f1" data-cursor="Asked once" aria-label="Caller 1 asks where their order is. The model answers once. Crowkis keeps the answer's shape with empty slots; Caller 1's values are not stored.">
        <div class="ckv-row">
          <div class="ckv-lane">${who('Caller 1')}${wave('c1', 1)}<span class="ckv-q">“Where’s my order?”</span></div>
          <span class="ckv-wire"><i></i></span>
          <span class="ckv-model"><span class="ckv-think" aria-hidden="true"><b></b><b></b><b></b></span>Your model</span>
        </div>
        <div class="ckv-row ckv-back">
          <span class="ckv-ans"><span class="ckv-from">Answer</span>“Your order <b>#1182</b> arrives <b>Tuesday</b>.”</span>
          <span class="ckv-wire is-back"><i></i></span>
        </div>
        <div class="ckv-row">
          <div class="ckv-shape">
            <span class="ckv-tag">Crowkis keeps the shape</span>
            <span class="ckv-shape-t">Your order ${slot('{order_id}')} arrives ${slot('{date}')}.</span>
          </div>
          <span class="ckv-drop"><s>#1182</s><s>Tuesday</s>${stamp('not stored')}</span>
        </div>
      </figure>`,
  `<figure class="ckv-fig ckv-f2" data-cursor="Cache hit" aria-label="Caller 2 asks when their order will get here. Crowkis serves the same shape filled with Caller 2's values. The model is never called.">
        <div class="ckv-row">
          <div class="ckv-lane">${who('Caller 2')}${wave('c2', 4)}<span class="ckv-q">“When will my order get here?”</span></div>
          <span class="ckv-wire is-off"></span>
          <span class="ckv-model is-off">Your model${stamp('never called', ' is-ink')}</span>
        </div>
        <div class="ckv-row">
          <div class="ckv-shape is-filled">
            <span class="ckv-tag">Same shape · Caller 2’s own values</span>
            <span class="ckv-shape-t">Your order ${slot('{order_id}', '#4471')} arrives ${slot('{date}', 'Thursday')}.</span>
          </div>
          ${stamp('0.34 ms', ' ckv-ms')}
        </div>
        <div class="ckv-row">
          <div class="ckv-lane is-agent">${who('Agent says', ' is-agent')}${wave('say', 7)}<span class="ckv-q">“Your order #4471 arrives Thursday.”</span></div>
        </div>
      </figure>`,
  `<figure class="ckv-fig ckv-f3" data-cursor="Turn gate" aria-label="One spoken turn with a budget of about 1,000 ms. The cached reply lands at 0.34 ms (p50), 63.96 ms at p99. The model's respond event is skipped.">
        <div class="ckv-turn-head"><span>One spoken turn</span><span>budget ≈ 1,000 ms</span></div>
        <div class="ckv-bar">
          <span class="ckv-seg"><span class="ckv-seg-fill"></span><span class="ckv-strike"></span><em>respond event · skipped</em></span>
          <span class="ckv-hit"></span>
          <span class="ckv-mark is-p50"><b>0.34 ms</b> p50 · reply lands</span>
          <span class="ckv-mark is-p99"><b>63.96 ms</b> p99</span>
        </div>
        <div class="ckv-ticks" aria-hidden="true"><span>0</span><span>250</span><span>500</span><span>750</span><span>1,000 ms</span></div>
        <ol class="ckv-flow">
          <li>Transcript <small>free</small></li>
          <li>Ask Crowkis</li>
          <li>Hit: inject reply</li>
          <li><s>Respond event</s> skipped</li>
        </ol>
        <p class="ckv-bill">${stamp('No inference billed', ' is-ink')}${stamp('No synthesis billed', ' is-ink')}</p>
      </figure>`,
]

const PROOF = [
  ['0.34', 'ms', 'p50 per spoken turn'],
  ['63.96', 'ms', 'p99 of a ~1,000 ms turn'],
]

export const html = ({ serif }) => `<section class="ck-scene ck-voice" id="voice" data-scene="voice" aria-labelledby="ckv-title">
  <header class="ckv-head">
    <h2 class="ckv-title" id="ckv-title">${serif('Voice agents that answer *instantly*.')}</h2>
    <p class="ckv-intro">Crowkis answers repeat voice questions from cache, with each caller’s own details. Your model never hears the repeat.</p>
  </header>
  <div class="ckv-stage">
    <ol class="ckv-beats">
      ${BEATS.map(([h, p], i) => `<li class="ckv-beat">
        <div class="ckv-copy"><span class="ckv-num">0${i + 1}</span><h3>${h}</h3><p>${p}</p></div>
        ${FIGS[i]}
      </li>`).join('\n      ')}
    </ol>
  </div>
  <div class="ckv-promise">
    <p class="ckv-promise-t">${serif('Nothing caller‑specific *ever* enters the cache.')}</p>
    <p class="ckv-promise-s">If an answer can’t be de‑personalised, it isn’t cached.</p>
  </div>
  <ul class="ckv-proof">
    ${PROOF.map(([n, u, l]) => `<li><span class="ckv-big"><span>${n}<small> ${u}</small></span></span><span class="ckv-lbl">${l}</span></li>`).join('\n    ')}
  </ul>
  <p class="ckv-note">Measured in our tests on the live voice path, single-threaded.</p>
</section>`

export async function init(el, { gsap, ScrollTrigger }) {
  const $ = (s, r = el) => r.querySelector(s)
  const $$ = (s, r = el) => [...r.querySelectorAll(s)]
  const copies = $$('.ckv-copy'), figs = $$('.ckv-fig')
  const [f1, f2, f3] = figs

  // Ambient waveforms: each bar breathes with two sines scaled by its lane's loudness. Scrubbed tweens raise a
  // lane's loudness while that caller (or the agent) is speaking. The loop runs only while the scene is on screen.
  const amp = { c1: 0.3, c2: 0.3, say: 0.3 }
  const waves = $$('.ckv-wave').map((w) => {
    const bars = [...w.children]
    return { key: w.dataset.wave, bars, base: bars.map((b) => +b.style.getPropertyValue('--h')) }
  })
  const draw = (t) => {
    for (const w of waves) {
      const a = amp[w.key]
      for (let i = 0; i < w.bars.length; i++) {
        const n = 0.5 + 0.5 * Math.sin(t * 8.5 + i * 0.9) * Math.sin(t * 4.7 + i * 0.37)
        w.bars[i].style.transform = `scaleY(${(0.08 + a * w.base[i] * (0.35 + 0.65 * n)).toFixed(3)})`
      }
    }
  }
  ScrollTrigger.create({
    trigger: el, start: 'top bottom', end: 'bottom top',
    onToggle: ({ isActive }) => { el.classList.toggle('is-live', isActive); isActive ? gsap.ticker.add(draw) : gsap.ticker.remove(draw) },
  })

  const speak = (tl, key, at, len) => tl.to(amp, { [key]: 1, duration: 0.3 }, at).to(amp, { [key]: 0.3, duration: 0.3 }, at + len)
  const wipe = (tl, e, at, dur = 0.9, fromRight = false) =>
    tl.fromTo(e, { clipPath: fromRight ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0%)', duration: dur }, at)
  const press = (tl, e, at) => tl.fromTo(e, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power4.in' }, at)

  // Beat builders: add a beat to `tl` starting at `t`. Shared by the desktop pin and the per-beat mobile scrub.
  const beat1 = (tl, t) => {
    speak(tl, 'c1', t, 0.9)
    wipe(tl, $('.ckv-q', f1), t + 0.05)
    tl.fromTo($('.ckv-wire i', f1), { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, t + 0.9)
    const model = $('.ckv-model', f1), think = $('.ckv-think', f1), ink = getComputedStyle(el).getPropertyValue('--ck-ink').trim()
    tl.to(model, { backgroundColor: '#ffffff', color: ink, duration: 0.3 }, t + 1.6)
      .fromTo(think, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t + 1.6)
      .to(think, { opacity: 0, duration: 0.2 }, t + 2.3)
      .to(model, { backgroundColor: 'rgba(255,255,255,0)', color: '#ffffff', duration: 0.4 }, t + 2.4)
      .fromTo($('.ckv-back .ckv-wire i', f1), { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, t + 2.1)
    wipe(tl, $('.ckv-ans', f1), t + 2.5, 0.8, true)
    tl.fromTo($('.ckv-shape', f1), { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, t + 3.2)
      .fromTo($$('.ckv-slot', f1), { scale: 0.6 }, { scale: 1, duration: 0.4, stagger: 0.15, ease: 'back.out(3)' }, t + 3.5)
      .fromTo($$('.ckv-drop s', f1), { y: '-1.2em', opacity: 1, '--k': '0%' }, { y: 0, opacity: 0.55, '--k': '100%', duration: 0.6, stagger: 0.12, ease: 'power2.in' }, t + 3.7)
      .fromTo($$('.ckv-ans b', f1), { '--k': '0%' }, { '--k': '100%', duration: 0.4 }, t + 3.7)
    press(tl, $('.ckv-drop .ckv-stamp', f1), t + 4.3)
  }
  const beat2 = (tl, t) => {
    speak(tl, 'c2', t, 1)
    wipe(tl, $('.ckv-q', f2), t + 0.05, 1)
    tl.fromTo($('.ckv-shape', f2), { yPercent: -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, t + 1)
      .fromTo($$('.ckv-slot > :first-child', f2), { yPercent: 0 }, { yPercent: -110, duration: 0.5, stagger: 0.2, ease: 'power2.inOut' }, t + 1.7)
      .fromTo($$('.ckv-slot > :last-child', f2), { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.2, ease: 'power2.inOut' }, t + 1.7)
    press(tl, $('.ckv-model .ckv-stamp', f2), t + 1.4)
    press(tl, $('.ckv-ms', f2), t + 2.4)
    speak(tl, 'say', t + 2.6, 1.1)
    wipe(tl, $('.ckv-lane.is-agent .ckv-q', f2), t + 2.6, 1.1)
  }
  const beat3 = (tl, t) => {
    tl.fromTo($$('.ckv-flow li', f3), { opacity: 0.3 }, { opacity: 1, duration: 0.3, stagger: 0.35 }, t)
      .fromTo($('.ckv-seg-fill', f3), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.8 }, t + 0.1)
      .fromTo($('.ckv-hit', f3), { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'back.out(3)' }, t + 0.8)
      .fromTo($('.is-p50', f3), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, t + 0.85)
      .to($('.ckv-seg-fill', f3), { opacity: 0, duration: 0.5 }, t + 1.2)
      .fromTo($('.ckv-strike', f3), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, t + 1.2)
      .fromTo($('.ckv-seg em', f3), { opacity: 0 }, { opacity: 1, duration: 0.4 }, t + 1.5)
      .fromTo($('.is-p99', f3), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, t + 1.7)
    $$('.ckv-bill > em', f3).forEach((s, i) => press(tl, s, t + 2 + i * 0.3))
  }

  const mm = gsap.matchMedia(el)
  mm.add('(min-width: 1024px)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: $('.ckv-stage'), start: 'top top', end: '+=360%', pin: true, scrub: 0.8, invalidateOnRefresh: true },
    })
    // Rows not yet reached wait dimmed; the current one is full; finished ones settle back. The last frame
    // brings every row up, so the pin releases on the whole story (the same as the static page).
    const focus = (i, at) => {
      tl.fromTo([copies[i], figs[i]], { opacity: 0.2 }, { opacity: 1, duration: 0.5 }, at)
      if (i) tl.to([copies[i - 1], figs[i - 1]], { opacity: 0.45, duration: 0.5 }, at)
    }
    focus(0, 0)
    beat1(tl, 0.2)
    focus(1, 4.9)
    beat2(tl, 5.2)
    focus(2, 9.2)
    beat3(tl, 9.5)
    tl.to([...copies, ...figs], { opacity: 1, duration: 0.6 }, 13).to({}, { duration: 0.8 })
  })
  mm.add('(max-width: 1023px)', () => {
    ;[beat1, beat2, beat3].forEach((b, i) => {
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: figs[i], start: 'top 82%', end: 'bottom 62%', scrub: 0.6 } })
      b(tl, 0)
    })
  })

  // Proof: numbers rise out of their masks; the promise line drifts up. Both scrubbed.
  gsap.fromTo($$('.ckv-big > span'), { yPercent: 105 }, { yPercent: 0, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: $('.ckv-proof'), start: 'top 92%', end: 'top 62%', scrub: 0.8 } })
  gsap.fromTo($('.ckv-promise'), { y: 60, opacity: 0.2 }, { y: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: $('.ckv-promise'), start: 'top 95%', end: 'top 60%', scrub: 0.8 } })

  // Title: words rise out of their masks, scrubbed (non-pinning, so fine after the await).
  const { SplitText } = await import('gsap/SplitText')
  gsap.registerPlugin(SplitText)
  SplitText.create($('.ckv-title'), {
    type: 'words', mask: 'words', autoSplit: true,
    onSplit: (self) => gsap.from(self.words, { yPercent: 110, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: $('.ckv-head'), start: 'top 88%', end: 'top 40%', scrub: 0.8 } }),
  })
}
