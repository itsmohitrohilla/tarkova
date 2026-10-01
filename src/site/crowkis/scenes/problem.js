// Scene "problem": the déjà-vu bill. Three beats:
//   1. head: the title and intro rise line by line out of masks, scrubbed as they scroll in.
//   2. echo (pinned): one support bot's day. Rephrasings of the same question stream in while a meter bills
//      every one, then they all collapse into a single red dot: one meaning. The verdict rises under it.
//   3. rail: the five problems. Desktop pins a horizontal track (numerals fill red as they reach the middle);
//      ≤768px stacks them and fills each numeral as it scrolls through.
export const id = 'problem'

// The founder's support-bot story: one question, asked all day. [time, question, x%, y%, depth]
// x/y place each question in the desktop cloud (left edge, top edge); depth scales size and cursor parallax.
const ASKS = [
  ['09:02', 'When do you close?', 3, 4, 1.3],
  ['09:47', 'What time do you shut?', 56, 0, 1.1],
  ['10:15', 'closing time?', 46, 58, 0.85],
  ['10:58', 'Are you open late tonight?', 23, 43, 1],
  ['11:40', 'Till what time are you open?', 66, 44, 0.95],
  ['12:26', 'hours today?', 31, 17, 0.8],
  ['13:08', 'How late are you open?', 4, 86, 1.05],
  ['13:55', 'What’s your closing time?', 7, 29, 0.9],
  ['14:31', 'u open till when', 79, 16, 0.8],
  ['15:12', 'When are you closing tonight?', 49, 86, 1],
  ['16:04', 'Still open at 8?', 53, 29, 0.85],
  ['16:48', 'what time do you close today', 2, 60, 0.85],
  ['17:20', 'When do you shut tonight?', 72, 70, 0.95],
  ['18:02', 'open late?', 25, 73, 0.8],
]
// Meter rates (illustrative): cost and latency of one uncached model call, and calls per day.
const PER_CALL = 0.014
const WAIT_S = 2.6
const CALLS = 50
const money = (n, dp = 2) => `$${(n * PER_CALL).toFixed(dp)}`
const wait = (n) => { const s = Math.round(n * WAIT_S); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` }

export const html = ({ c, esc, serif }) => {
  const pr = c.problem
  return `<section class="ck-scene ck-problem" data-scene="problem" aria-labelledby="ckp-title">
  <header class="ckp-head">
    <p class="ckp-kicker">The problem</p>
    <h2 class="ckp-title" id="ckp-title">${serif(pr.title)}</h2>
    <p class="ckp-intro">${esc(pr.intro)}</p>
  </header>
  <div class="ckp-echo">
    <div class="ckp-story">
      <p class="ckp-label">Example: a support bot, one day</p>
      <p class="ckp-lede">“When do you close?” “What time do you shut?” It hears some version of it fifty times a day.</p>
    </div>
    <div class="ckp-cloud" data-cursor="déjà vu">
      <ul class="ckp-asks">
        ${ASKS.map(([t, q, x, y, d]) => `<li class="ckp-ask" style="--x:${x}%;--y:${y}%;--d:${d}"><span class="ckp-ask-in"><span class="ckp-ask-meta">${t} · new call · ${money(1, 3)}</span>${esc(q)}</span></li>`).join('\n        ')}
      </ul>
      <span class="ckp-dot" aria-hidden="true"></span>
      <p class="ckp-verdict"><span class="ckp-v"><span>That’s not fifty new questions. It’s <em>one question</em>, asked fifty times.</span></span><span class="ckp-v ckp-v-sub"><span>But the AI treats it as new every time. Full cost, full wait.</span></span></p>
    </div>
    <dl class="ckp-meter">
      <div><dt>Model calls</dt><dd data-m="calls">×${CALLS}</dd></div>
      <div><dt>Billed</dt><dd data-m="cost">${money(CALLS)}</dd></div>
      <div><dt>User wait</dt><dd data-m="wait">${wait(CALLS)}</dd></div>
      <div><dt>Cache hits</dt><dd class="ckp-zero">0</dd></div>
    </dl>
  </div>
  <div class="ckp-rail">
    <p class="ckp-rail-cap">Five ways the same question keeps <em>costing you</em>.</p>
    <ol class="ckp-track">
      ${pr.items.map(([t, d], i) => `<li class="ckp-panel"><span class="ckp-num" data-n="0${i + 1}" aria-hidden="true">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ol>
    <div class="ckp-bar" aria-hidden="true"><span></span></div>
  </div>
</section>`
}

export async function init(el, { gsap }) {
  const $ = (s) => el.querySelector(s)
  const $$ = (s) => [...el.querySelectorAll(s)]
  const echo = $('.ckp-echo'), cloud = $('.ckp-cloud'), dot = $('.ckp-dot'), asks = $$('.ckp-ask')
  const rail = $('.ckp-rail'), track = $('.ckp-track'), panels = $$('.ckp-panel')
  const meter = { calls: $('[data-m=calls]'), cost: $('[data-m=cost]'), wait: $('[data-m=wait]') }

  // Pinned triggers are created synchronously (before any await) so they register in page order.
  const mm = gsap.matchMedia()
  mm.add({ desk: '(min-width: 769px)', mob: '(max-width: 768px)', fine: '(pointer: fine)' }, ({ conditions: { desk, fine } }) => {
    // --- Beat 2: the echo. Timeline units: 0–6 stream, 6.4–8 collapse, 8–10 verdict, then a short hold.
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: echo, pin: true, start: 'top top', end: desk ? '+=260%' : '+=200%', scrub: true, invalidateOnRefresh: true },
    })
    // The first ask is already on stage when the pin lands; the rest stream in after it.
    const step = 5.2 / asks.length
    asks.forEach((a, i) => {
      if (i) tl.fromTo(a, { autoAlpha: 0, yPercent: 60, scale: 0.9 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.8, ease: 'power2.out' }, i * step)
      tl.to(a, { opacity: 0.32, duration: 1 }, i * step + 1.1) // older asks fade back like memories
    })
    // Meter: calls tick 0 → 50 across the stream; cost and wait derive from calls.
    const m = { n: 0 }
    let shown = -1
    tl.to(m, {
      n: CALLS, duration: 6,
      onUpdate() {
        const n = Math.round(m.n)
        if (n === shown) return
        shown = n
        meter.calls.textContent = `×${n}`
        meter.cost.textContent = money(n)
        meter.wait.textContent = wait(n)
      },
    }, 0)
    // Collapse: every ask flies to the dot and vanishes into it.
    const center = (e) => [e.offsetLeft + e.offsetWidth / 2, e.offsetTop + e.offsetHeight / 2]
    tl.to(asks, {
      x: (i, a) => center(dot)[0] - center(a)[0],
      y: (i, a) => center(dot)[1] - center(a)[1],
      scale: 0.08, opacity: 0, duration: 1.3, ease: 'power3.in', stagger: { each: 0.025, from: 'random' },
    }, 6.4)
      .fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 7.4)
      .fromTo($$('.ckp-v > span'), { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1, stagger: 0.5, ease: 'power2.out' }, 8)
      .to({}, { duration: 0.8 })

    // Cursor parallax: the cloud drifts against the pointer, nearer (deeper) asks drift more.
    let cleanup
    if (desk && fine) {
      const mx = gsap.quickTo(cloud, '--mx', { duration: 0.9, ease: 'power3' })
      const my = gsap.quickTo(cloud, '--my', { duration: 0.9, ease: 'power3' })
      const move = (e) => { mx((e.clientX / innerWidth - 0.5) * -28); my((e.clientY / innerHeight - 0.5) * -20) }
      addEventListener('pointermove', move)
      cleanup = () => removeEventListener('pointermove', move)
    }

    // --- Beat 3: the five problems.
    if (desk) {
      rail.classList.add('is-h')
      const dist = () => track.scrollWidth - rail.clientWidth
      const bar = $('.ckp-bar span')
      const move = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: rail, pin: true, start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true,
          onUpdate: (st) => gsap.set(bar, { scaleX: st.progress }),
        },
      })
      // Per panel: the numeral drifts across its panel (parallax) and fills as the panel slides in
      // (done by 'left 55%', so the last panel, which parks on the right, still fills).
      panels.forEach((p) => {
        const num = p.querySelector('.ckp-num'), ca = { trigger: p, containerAnimation: move, scrub: true }
        gsap.fromTo(num, { xPercent: 14 }, { xPercent: -14, ease: 'none', scrollTrigger: { ...ca, start: 'left right', end: 'right left' } })
        gsap.fromTo(num, { '--f': 0 }, { '--f': 1, ease: 'none', scrollTrigger: { ...ca, start: 'left 90%', end: 'left 55%' } })
      })
    } else {
      panels.forEach((p) => {
        gsap.fromTo(p.querySelector('.ckp-num'), { '--f': 0 }, { '--f': 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 40%', scrub: true } })
      })
    }
    return () => { cleanup?.(); rail.classList.remove('is-h') }
  })

  // --- Beat 1: head lines rise out of masks, scrubbed. Non-pinning, so it's fine to create after the await.
  const { SplitText } = await import('gsap/SplitText')
  gsap.registerPlugin(SplitText)
  for (const [sel, start, end] of [['.ckp-title', 'top 92%', 'top 30%'], ['.ckp-intro', 'top 95%', 'top 55%']]) {
    SplitText.create($(sel), {
      type: 'lines', mask: 'lines', linesClass: 'ckp-line', autoSplit: true,
      onSplit: (s) => gsap.from(s.lines, { yPercent: 110, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: s.elements[0], start, end, scrub: true } }),
    })
  }
}
