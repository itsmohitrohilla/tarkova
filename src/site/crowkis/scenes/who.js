// Scene "who": who it's for. The title's words rise out of masks, then five big editorial rows, one per use
// case: a small built demo (no photos) beside the title, the pitch and a one-line before → after example.
// Each demo reads left to right, what users send → what Crowkis answers, and plays scrubbed as its row rises.
export const id = 'who'

// One concrete before → after per use case, in the same order as c.who.items.
const EXAMPLES = [
  ['“When do you close?” asked 50 ways a day', '1 model call, 49 instant answers'],
  ['“How do I rotate an API key?” asked by 20 engineers', 'answered once, reused by all'],
  ['The same policy question over the same docs', 'the finished answer back in under a millisecond'],
  ['A task the agent has solved before', 'its reasoning is reused, not rebuilt'],
  ['A one-second voice budget', 'cached replies start in 0.34 ms'],
]

const DEVS = 'AK JM SR LT PN EB OW DK MC RV TS HA YL GF NB CQ UI ZD VP KE'.split(' ')
const WAVE = [3, 5, 8, 12, 7, 15, 20, 13, 9, 18, 24, 16, 11, 21, 14, 8, 17, 10, 6, 12, 19, 9, 5, 8, 4, 6, 3, 2]

// Each demo: [context label, what users send (.ckw-in items), what comes back (.ckw-out items), extra below].
const DEMOS = [
  ['support chat',
    ['When do you close?', 'What time do you shut?', 'Closing time?', 'Open late tonight?'].map((q) => `<li class="ckw-q">${q}</li>`).join(''),
    `<p class="ckw-a">We close at 9&nbsp;pm.</p>
          <p class="ckw-stamp">1 model call · 0.4&nbsp;ms from cache</p>`],
  ['team copilot',
    `<li class="ckw-q">How do I rotate an API key?</li>
          <li class="ckw-devs" aria-hidden="true">${DEVS.map((d) => `<span>${d}</span>`).join('')}</li>
          <li class="ckw-cap">asked by 20 engineers</li>`,
    `<p class="ckw-a">Create a new key, deploy it, then revoke the old one.</p>
          <p class="ckw-stamp">answered once · reused ×<b class="ckw-n">20</b></p>`],
  ['docs search',
    `<li class="ckw-doc"><span class="ckw-doc-ico" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>refund-policy.pdf<small>38 chunks</small></span></li>
          <li class="ckw-q">What’s the refund policy?</li>`,
    `<p class="ckw-tag">answer cached, not chunks</p>
          <p class="ckw-a">Full refund within 30 days of purchase.</p>
          <p class="ckw-stamp">0.4&nbsp;ms · no model call</p>`],
  ['agent memory',
    `<li class="ckw-sess">session 1 · monday</li>
          <li class="ckw-q">I prefer email updates.</li>`,
    `<p class="ckw-tag">remembered · prefers email</p>
          <p class="ckw-sess">session 2 · friday</p>
          <p class="ckw-a">Sure, I’ll email you the summary.</p>
          <div class="ckw-steps"><span>reasoning reused</span><ol><li>plan</li><li>look up</li><li>reply</li></ol></div>`],
  ['voice assistant',
    `<li class="ckw-wave" aria-hidden="true">${WAVE.map((h) => `<i style="--h:${h}"></i>`).join('')}</li>
          <li class="ckw-q">Set a timer for ten minutes.</li>`,
    `<p class="ckw-a">Timer set. Ten minutes.</p>
          <p class="ckw-stamp">0.34&nbsp;ms of 1000&nbsp;ms</p>`,
    `<div class="ckw-budget">
          <p><span>one-second voice budget</span><span>1000 ms</span></p>
          <div class="ckw-track" aria-hidden="true"><i class="ckw-fill"></i><i class="ckw-hit"></i></div>
          <p class="ckw-hitl">↑ the cached reply lands here · 0.34 ms median</p>
        </div>`],
]

const demo = ([label, ins, outs, extra = ''], i) => `<figure class="ckw-demo" data-demo="${i}">
        <p class="ckw-bar"><span>${label}</span><span class="ckw-hitdot">cache hit</span></p>
        <div class="ckw-flow">
          <ul class="ckw-in">
          ${ins}
          </ul>
          <span class="ckw-link" aria-hidden="true"></span>
          <div class="ckw-out">
          ${outs}
          </div>
        </div>
        ${extra}
      </figure>`

export const html = ({ c, esc, serif }) => {
  const w = c.who, n = String(w.items.length).padStart(2, '0')
  return `<section class="ck-scene ck-who" data-scene="who" aria-labelledby="ckw-title">
  <header class="ckw-head">
    <p class="ckw-kicker">Who it’s for</p>
    <h2 class="ckw-title" id="ckw-title">${serif(w.title)}</h2>
    <p class="ckw-intro">${esc(w.intro)}</p>
  </header>
  <ol class="ckw-rows">
    ${w.items.map(([t, d], i) => `<li class="ckw-row">
      ${demo(DEMOS[i], i)}
      <div class="ckw-txt">
        <p class="ckw-num" aria-hidden="true">0${i + 1}<span>/${n}</span></p>
        <h3>${esc(t)}</h3>
        <p class="ckw-d">${esc(d)}</p>
        <p class="ckw-ex"><span class="ckw-ex-a">${esc(EXAMPLES[i][0])}</span> <span class="ckw-ex-to">→</span> <span class="ckw-ex-b">${esc(EXAMPLES[i][1])}</span></p>${i === 4 ? `
        <a class="ckw-more" href="#voice">See how voice works ↓</a>` : ''}
      </div>
    </li>`).join('\n    ')}
  </ol>
</section>`
}

export async function init(el, { gsap }) {
  const rows = [...el.querySelectorAll('.ckw-row')]
  const mm = gsap.matchMedia(el)

  mm.add({ desk: '(min-width: 601px)', mob: '(max-width: 600px)' }, ({ conditions: { desk } }) => {
    rows.forEach((row) => {
      const d = row.querySelector('.ckw-demo'), q = (s) => [...d.querySelectorAll(s)]
      const across = { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true }
      // The text column travels a little faster than the demo.
      gsap.fromTo(row.querySelector('.ckw-txt'), { y: desk ? 110 : 36 }, { y: desk ? -70 : 0, ease: 'none', scrollTrigger: across })
      // The payoff underline draws as the row reaches the middle.
      gsap.fromTo(row.querySelector('.ckw-ex-b'), { '--u': 0 }, { '--u': 1, ease: 'none', scrollTrigger: { trigger: row, start: 'top 75%', end: 'center 50%', scrub: true } })

      // The demo: what users send arrives, the arrow draws, the answer lands, the stamp settles. Finished by the
      // time the demo's centre reaches mid-screen, so it rests complete while you read.
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: d, start: 'top 88%', end: desk ? 'center 52%' : 'center 58%', scrub: 0.6 } })
      tl.from(q('.ckw-in > li'), { y: 24, opacity: 0, stagger: 0.14, duration: 0.5 })
      if (d.dataset.demo === '4') tl.from(q('.ckw-wave i'), { scaleY: 0.15, stagger: { each: 0.015, from: 'center' }, duration: 0.3 }, 0.1)
      if (d.dataset.demo === '1') tl.from(q('.ckw-devs span'), { opacity: 0, scale: 0.6, stagger: 0.02, duration: 0.2 }, 0.2)
      tl.fromTo(q('.ckw-link'), { '--k': 0 }, { '--k': 1, duration: 0.35, ease: 'none' })
      // Support: the four phrasings fold toward the one answer and step back.
      if (d.dataset.demo === '0') tl.to(q('.ckw-q'), { opacity: 0.42, x: 10, stagger: 0.04, duration: 0.4 }, '<')
      tl.from(q('.ckw-out > *'), { y: 18, opacity: 0, stagger: 0.14, duration: 0.45 }, '-=0.1')
        .from(q('.ckw-hitdot'), { opacity: 0, x: 8, duration: 0.3 }, '<')
      // Copilots: the one answer is reused by the whole team, counted up.
      if (d.dataset.demo === '1') {
        const n = d.querySelector('.ckw-n'), o = { v: 1 }
        tl.fromTo(q('.ckw-devs span'), { color: '#9a9ea7', borderColor: 'rgba(255,255,255,0.16)' }, { color: '#fff', borderColor: '#d50000', stagger: 0.02, duration: 0.2 }, '-=0.3')
          .fromTo(o, { v: 1 }, { v: 20, duration: 0.4, ease: 'none', onUpdate: () => { n.textContent = Math.round(o.v) } }, '<')
      }
      if (d.dataset.demo === '3') tl.from(q('.ckw-steps li'), { opacity: 0, x: -10, stagger: 0.1, duration: 0.25 }, '-=0.2')
      // Voice: the one-second budget runs out along the track; the cached reply already landed at its very start.
      if (d.dataset.demo === '4') tl.fromTo(q('.ckw-fill'), { '--f': 0 }, { '--f': 1, ease: 'none', duration: tl.duration() }, 0)
    })
  })

  // Title words and intro lines rise out of masks, scrubbed. Non-pinning, so fine after the await.
  const { SplitText } = await import('gsap/SplitText')
  gsap.registerPlugin(SplitText)
  for (const [sel, type, start, end] of [['.ckw-title', 'words', 'top 92%', 'top 35%'], ['.ckw-intro', 'lines', 'top 95%', 'top 60%']]) {
    SplitText.create(el.querySelector(sel), {
      type, mask: type, wordsClass: 'ckw-w', linesClass: 'ckw-l', autoSplit: true,
      onSplit: (s) => gsap.from(s[type], { yPercent: 115, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: s.elements[0], start, end, scrub: true } }),
    })
  }
}
