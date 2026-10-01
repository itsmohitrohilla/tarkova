// Scene "explain" (Explained): the plain-language deep dive. One-sentence statement → eight-tile feature bento →
// what it deliberately doesn't do → editions (Community vs Enterprise comparison). White ground. All copy is
// first-party (crowkis.com). The static layout is the finished state: every tile's micro-visual renders finished,
// init only loops it while on screen, and the edition marks only get a scroll-scrubbed entrance.
//   id                       matches data-scene on the root <section>
//   html(ctx) -> string      Node only, no DOM. ctx = { p, c, latest, esc, serif, card }
//   init(el, m)              browser only; m = { gsap, ScrollTrigger, lenis }
export const id = 'explain'

// [group] marks the word groups that turn red as you scroll.
const SENTENCE = 'A [drop-in] cache, written in [Rust], that [understands] what your LLM is being asked and only reuses an answer when it can [justify] that reuse.'

// Bento tiles: [key, size (l = hero, s = small, w = full width), title, tag, one plain line].
const FEATURES = [
  ['code', 'l', 'One-line integration', 'get_or_compute', 'Hand it the question and your model call. On a safe hit your model never runs; on a miss it runs once and the answer is banked.'],
  ['stream', 's', 'Streaming', '', 'Cached answers stream back chunk by chunk, so a hit feels like live model output.'],
  ['image', 's', 'Images too', '', 'An image and its text are matched together, as one entry.'],
  ['reason', 's', 'Reasoning reuse', '', 'Saves the expensive part, the reasoning, not just the final words.'],
  ['thresh', 's', 'Adaptive thresholds', '', 'Each intent tunes its own bar from live hit and miss feedback. Where mistakes hurt, the bar goes up.'],
  ['mcp', 's', 'Works with your AI coding assistant', 'MCP', 'Claude Code and other MCP apps check the cache before spending tokens.'],
  ['dash', 'l', 'See everything', '', 'Every hit, miss and block with its confidence score, live. Plus Prometheus /metrics and OpenTelemetry.'],
  ['upgrade', 'w', 'Survives model upgrades', '', 'Canary a new model, compare quality, then migrate entries, so your warm cache survives the upgrade.'],
]

// Shared by the server markup (first rows) and the live feed in init.
const FEED = [
  ['hit', 'HIT', '0.93', 'refund window'], ['miss', 'MISS', '', 'new question'], ['block', 'BLOCK', '0.61', 'personal data'],
  ['hit', 'HIT', '0.97', 'reset password'], ['hit', 'HIT', '0.90', 'pricing tiers'], ['miss', 'MISS', '', 'order status'],
  ['hit', 'HIT', '0.95', 'shipping times'], ['block', 'BLOCK', '0.58', 'stale entry'], ['hit', 'HIT', '0.92', 'opening hours'],
]
// Deterministic starting chart: bar height is the confidence score, colour is the verdict.
const BARS = Array.from({ length: 28 }, (_, i) => {
  const r = ((i * 37 + 11) % 23) / 23
  const k = r < 0.6 ? 'hit' : r < 0.85 ? 'miss' : 'block'
  return [k, k === 'miss' ? 0.18 + r * 0.12 : k === 'block' ? 0.5 + r * 0.1 : 0.72 + ((i * 13) % 10) / 40]
})
const THRESH = [['factual', 0.88], ['personal', 0.94], ['creative', 0.70]]
const ENTRIES = ['refunds', 'pricing', 'passwords', 'shipping']

const row = ([k, v, s, q]) => `<li class="is-${k}"><b>${v}</b><span>${s || '—'}</span><span>${q}</span></li>`
const bar = ([k, h]) => `<i class="is-${k}" style="--h:${h.toFixed(2)}"></i>`

// Each micro-visual's server markup is its finished state (what reduced motion sees); init only loops away and back.
const VIZ = {
  code: () => `<div class="ck-ex-code">
        <p class="ck-ex-status"><span class="ck-ex-pill is-hit" data-pill>HIT 0.94</span><span data-note>model not called</span></p>
        <pre><code><span class="ln"><i>1</i>q = <span class="s" data-q>"What’s your refund window?"</span></span><span class="ln"><i>2</i>answer = cache.<b>get_or_compute</b>(q, <span class="fn is-off" data-fn>call_model<span class="run"></span></span>)</span><span class="ln"><i>3</i><span class="cm" data-cm># served from cache in 4 ms</span></span></code></pre>
      </div>`,
  stream: () => `<div class="ck-ex-chat">
        <p class="ck-ex-q">How do refunds work?</p>
        <p class="ck-ex-ans">${['Refunds go back', ' to your original card', ' within 5–7 days', ' of approval.'].map((t) => `<span class="c">${t}</span>`).join('')}<span class="caret"></span></p>
        <span class="ck-ex-pill is-hit" data-pill>HIT · streamed</span>
      </div>`,
  image: () => `<div class="ck-ex-ent">
        <span class="ck-ex-tag">entry #4821</span>
        <div class="ck-ex-img"><svg viewBox="0 0 120 84" preserveAspectRatio="xMidYMid slice"><rect width="120" height="84" fill="#ededea"/><circle cx="84" cy="30" r="13" fill="#d50000"/><path d="M0 84 L0 58 L28 36 L52 60 L70 46 L120 72 L120 84Z" fill="#111"/><path d="M0 84 L0 70 L40 56 L78 74 L120 64 L120 84Z" fill="#9a9ea7"/></svg><span class="scan"></span></div>
        <span class="ck-ex-plus2">+</span>
        <p class="ck-ex-cap">“a red sun over two hills”</p>
        <span class="ck-ex-pill is-hit" data-pill>match 0.91</span>
      </div>`,
  reason: () => `<div class="ck-ex-graph"><svg viewBox="0 0 260 124">
        ${[['M34 62 C70 62 80 28 116 28', 'e1'], ['M34 62 C70 62 80 96 116 96', 'e2'], ['M116 28 C160 28 170 62 214 62', 'e3'], ['M116 96 C160 96 170 62 214 62', 'e4']].map(([d]) => `<path class="bg" d="${d}"/><path class="on" pathLength="1" d="${d}"/>`).join('')}
        ${[[34, 62, 'read'], [116, 28, 'look up'], [116, 96, 'compare'], [214, 62, 'conclude']].map(([x, y, t]) => `<circle class="nd" cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y + (y < 62 ? -16 : 24)}">${t}</text>`).join('')}
      </svg><span class="ck-ex-pill is-hit" data-pill>4 steps reused</span></div>`,
  thresh: () => `<ul class="ck-ex-th">
        ${THRESH.map(([n, v]) => `<li style="--v:${v}"><span>${n}</span><span class="tr"><span class="fl"></span><span class="kw"><span class="kn"></span></span></span><output>${v.toFixed(2)}</output></li>`).join('')}
      </ul>`,
  mcp: () => `<div class="ck-ex-term">
        <span class="dots"><i></i><i></i><i></i></span>
        <p><span class="pr">$</span> <span class="ty">claude mcp add crowkis -- crowkis mcp</span></p>
        <p class="out">✓ crowkis connected</p>
        <p class="out"><span class="ck-ex-pill is-hit">HIT</span> cache checked before tokens are spent</p>
      </div>`,
  dash: () => `<div class="ck-ex-dash">
        <div class="ck-ex-chart">
          <p><span>hit rate</span><b data-rate>${Math.round((BARS.filter(([k]) => k === 'hit').length / BARS.length) * 100)}%</b></p>
          <div class="ck-ex-bars">${BARS.map(bar).join('')}</div>
          <p class="ft"><span>/metrics</span><span>OpenTelemetry</span></p>
        </div>
        <ol class="ck-ex-feed">${FEED.slice(0, 5).map(row).join('')}</ol>
      </div>`,
  upgrade: () => `<div class="ck-ex-up">
        <div class="col"><span class="lbl">model v1</span>${ENTRIES.map(() => '<span class="slot"></span>').join('')}</div>
        <div class="mid"><span>canary 10%</span><span class="meter"><span></span></span><span>quality 0.98 ✓</span></div>
        <div class="col is-new"><span class="lbl">model v2</span>${ENTRIES.map((t) => `<span class="lane"><span>${t}</span></span>`).join('')}</div>
        <span class="stamp">warm cache kept</span>
      </div>`,
}
const NOT = [
  ['Not a replacement for your LLM', 'It sits in front and decides reuse vs recompute.'],
  ['Not a vector database for RAG', 'Keep your RAG store, put Crowkis in front of the model calls.'],
  ['Never phones home', 'Offline license check, runs fully air-gapped.'],
  ['No surprises on a miss', 'A miss is a pass-through: exactly what happened before Crowkis.'],
]

// Editions, framed like crowkis.com/enterprise: one comparison, Community | Enterprise, grouped by what's shared,
// how far it scales and what Enterprise adds. A cell is true (included), false (not) or a short value.
const ED_GROUPS = [
  ['In both', [
    ['Full engine, all seven differentiators', '', true, true],
    ['Same signed binary', 'A licence file flips the tier at boot.', true, true],
    ['Runs fully air-gapped', 'Offline licence check. Never phones home.', true, true],
  ]],
  ['Scale', [
    ['Tenants', '', 'Up to 3', 'Unlimited'],
    ['Cache entries', '', '100K', 'Unlimited'],
  ]],
  ['Enterprise adds', [
    ['Virtual API keys', 'Per-key budgets and rate limits.', false, true],
    ['SSO / SAML', '', false, true],
    ['Audit log', '', false, true],
    ['Crowkis Replay on your own traffic', 'See your real savings before you spend.', false, true],
  ]],
]

// Included = red check, not included = dim dash; both carry a spoken label.
const cell = (v, esc) => v === true ? '<span class="ck-ex-mk is-yes" role="img" aria-label="Included"></span>'
  : v === false ? '<span class="ck-ex-mk is-no" role="img" aria-label="Not included"></span>'
  : `<span class="ck-ex-val">${esc(v)}</span>`
const pad = (i) => String(i + 1).padStart(2, '0')
const ext = (href, text, esc, cursor = 'Open') => `<a href="${esc(href)}" target="_blank" rel="noopener" data-cursor="${cursor}">${esc(text)} <span aria-hidden="true">↗</span></a>`

// Words become spans (scrubbed from faint to solid); [groups] become <em> with a red rule that draws under them.
const sentence = (esc) =>
  SENTENCE.split(/(\[[^\]]+\])/).filter(Boolean).map((part) =>
    part[0] === '['
      ? `<em>${part.slice(1, -1).split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}<span class="u" aria-hidden="true"></span></em>`
      : part.trim().split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')).join(' ')
    .replace(/ (?=<span class="w">[,.])/g, '') // keep punctuation glued to the word before it

export const html = ({ esc, serif }) => `<section class="ck-scene ck-explain" id="explained" data-scene="explain" aria-labelledby="ck-ex-one">
  <div class="ck-ex-one">
    <p class="ck-ex-kicker">Explained · in one sentence</p>
    <h2 id="ck-ex-one" class="ck-ex-sentence">${sentence(esc)}</h2>
  </div>

  <div class="ck-ex-feat">
    <header>
      <div>
        <p class="ck-ex-kicker">What you get</p>
        <h2 class="ck-ex-h">${serif('What you get, *explained*.')}</h2>
      </div>
      <p class="ck-ex-lede">Eight things Crowkis does, one plain line each.</p>
    </header>
    <ul class="ck-ex-bento">
      ${FEATURES.map(([k, size, t, tag, x], i) => `<li class="ck-ex-tile is-${size} is-${k}"><article>
      <div class="ck-ex-viz" aria-hidden="true">${VIZ[k]()}</div>
      <div class="ck-ex-txt"><span class="ck-ex-idx" aria-hidden="true">${pad(i)}</span><h3>${esc(t)}${tag ? ` <code>${esc(tag)}</code>` : ''}</h3><p>${esc(x)}</p></div>
    </article></li>`).join('\n      ')}
    </ul>
  </div>

  <div class="ck-ex-not">
    <p class="ck-ex-kicker">Deliberately not</p>
    <h2 class="ck-ex-h">${serif('What it *doesn’t* do.')}</h2>
    <ul class="ck-ex-nots">
      ${NOT.map(([t, x]) => `<li><span class="ck-ex-x" aria-hidden="true"></span><h3>${esc(t)}</h3><p>${esc(x)}</p></li>`).join('\n      ')}
    </ul>
  </div>

  <div class="ck-ex-ed">
    <p class="ck-ex-kicker">Editions</p>
    <h2 class="ck-ex-h">${serif('Free to run. *Flat* to scale.')}</h2>
    <table class="ck-ex-cmp">
      <caption class="ck-ex-sr">Community and Enterprise editions compared</caption>
      <thead><tr>
        <td class="ck-ex-intro"><p class="ck-ex-lede">Free is not a trial. Run Community in production for as long as you like; Enterprise is for when you outgrow it.</p></td>
        <th scope="col" class="is-c"><div class="ck-ex-eh">
          <h3>Community</h3>
          <p class="ck-ex-lead">Free forever</p>
          <p class="ck-ex-note">No licence, no sign-up. Solo devs and small teams can run it in production.</p>
          <p class="ck-ex-acts"><a class="ck-ex-btn is-red" href="#get-started" data-cursor="Install">Get started</a></p>
        </div></th>
        <th scope="col" class="is-e"><div class="ck-ex-eh">
          <h3>Enterprise</h3>
          <p class="ck-ex-lead">Flat per cluster per year</p>
          <p class="ck-ex-note">No usage metering. No checkout, a conversation.</p>
          <p class="ck-ex-acts"><a class="ck-ex-btn is-white" href="mailto:contact@crowkis.com" data-cursor="Email">Talk to us</a>${ext('https://www.crowkis.com/enterprise', 'See Enterprise', esc)}</p>
        </div></th>
      </tr></thead>
      ${ED_GROUPS.map(([g, rows]) => `<tbody>
        <tr class="ck-ex-grp"><th scope="rowgroup">${esc(g)}</th><td class="is-c"></td><td class="is-e"></td></tr>
        ${rows.map(([t, sub, c, e]) => `<tr><th scope="row">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</th>${[['is-c', c], ['is-e', e]].map(([k, v]) => `<td class="${k}">${cell(v, esc)}</td>`).join('')}</tr>`).join('\n        ')}
      </tbody>`).join('\n      ')}
    </table>
  </div>
</section>`

// Ambient loops, one per tile. Each is built paused from the finished state, departs after `hold` seconds and
// ends back on the finished state, so pausing anywhere or wrapping to 0 never jumps.
const RED = '#d50000'
const LOOP = {
  code(v, gsap, hold) {
    const q = v.querySelector('[data-q]'), fn = v.querySelector('[data-fn]'), cm = v.querySelector('[data-cm]')
    const pill = v.querySelector('[data-pill]'), note = v.querySelector('[data-note]')
    const set = (hit, qt, pt, nt, ct) => () => {
      q.textContent = qt; pill.textContent = pt; note.textContent = nt; cm.textContent = ct
      fn.classList.toggle('is-off', hit); pill.classList.toggle('is-hit', hit)
    }
    return gsap.timeline({ repeat: -1, paused: true })
      .call(set(false, '"How do refunds work?"', 'MISS', 'calling model…', '# first time anyone asked'), null, hold)
      .fromTo(fn.querySelector('.run'), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'none', immediateRender: false }, '+=0.2')
      .call(set(false, '"How do refunds work?"', 'MISS', 'model ran once', '# answer banked for next time'))
      .call(set(true, '"What’s your refund window?"', 'HIT 0.94', 'model not called', '# served from cache in 4 ms'), null, '+=1.8')
      .set({}, {}, '+=1.4')
  },
  stream(v, gsap, hold) {
    const c = [...v.querySelectorAll('.c')], pill = v.querySelector('[data-pill]')
    return gsap.timeline({ repeat: -1, paused: true })
      .to([...c, pill], { opacity: 0, duration: 0.35 }, hold)
      .to(c, { opacity: 1, duration: 0.15, stagger: 0.45 }, '+=0.4')
      .fromTo(c, { backgroundColor: 'rgba(213, 0, 0, 0.18)' }, { backgroundColor: 'rgba(213, 0, 0, 0)', duration: 0.6, stagger: 0.45, immediateRender: false }, '<')
      .to(pill, { opacity: 1, duration: 0.3 }, '-=0.2')
      .set({}, {}, '+=1')
  },
  image(v, gsap, hold) {
    const ent = v.querySelector('.ck-ex-ent'), scan = v.querySelector('.scan'), cap = v.querySelector('.ck-ex-cap'), pill = v.querySelector('[data-pill]')
    return gsap.timeline({ repeat: -1, paused: true })
      .to(pill, { opacity: 0, duration: 0.3 }, hold)
      .to(ent, { '--ent': 0, duration: 0.3 }, '<')
      .to(cap, { backgroundSize: '0% 100%', duration: 0.3 }, '<')
      .fromTo(scan, { yPercent: -100, opacity: 1 }, { yPercent: 100, duration: 1.3, ease: 'power1.inOut', immediateRender: false })
      .set(scan, { opacity: 0 })
      .to(cap, { backgroundSize: '100% 100%', duration: 0.7, ease: 'power2.inOut' }, '-=0.2')
      .to(ent, { '--ent': 1, duration: 0.4 })
      .to(pill, { opacity: 1, duration: 0.3 }, '<')
      .set({}, {}, '+=1.2')
  },
  reason(v, gsap, hold) {
    const nd = v.querySelectorAll('.nd'), on = v.querySelectorAll('.on'), pill = v.querySelector('[data-pill]')
    const lit = { fill: RED, stroke: RED, duration: 0.25 }, draw = { attr: { 'stroke-dashoffset': 0 }, duration: 0.55, ease: 'power1.inOut' }
    return gsap.timeline({ repeat: -1, paused: true })
      .to(nd, { fill: '#ffffff', stroke: '#c9cbd0', duration: 0.4 }, hold)
      .to(on, { attr: { 'stroke-dashoffset': 1 }, duration: 0.4 }, '<')
      .to(pill, { opacity: 0, duration: 0.3 }, '<')
      .to(nd[0], lit, '+=0.5')
      .to([on[0], on[1]], draw)
      .to([nd[1], nd[2]], lit)
      .to([on[2], on[3]], draw)
      .to(nd[3], lit)
      .to(pill, { opacity: 1, duration: 0.3 })
      .set({}, {}, '+=1.2')
  },
  thresh(v, gsap, hold) {
    const tl = gsap.timeline({ repeat: -1, paused: true })
    v.querySelectorAll('li').forEach((li, i) => {
      const out = li.querySelector('output'), v0 = THRESH[i][1], d = [0.03, 0.02, -0.05][i]
      const show = () => { out.textContent = parseFloat(gsap.getProperty(li, '--v')).toFixed(2) }
      tl.to(li, { '--v': v0 + d, duration: 1.4, ease: 'sine.inOut', onUpdate: show }, hold + i * 0.6)
        .to(li, { '--v': v0, duration: 1.4, ease: 'sine.inOut', onUpdate: show }, hold + 3.2 + i * 0.6)
    })
    return tl.set({}, {}, '+=0.4')
  },
  mcp(v, gsap, hold) {
    const ty = v.querySelector('.ty'), out = v.querySelectorAll('.out')
    return gsap.timeline({ repeat: -1, paused: true })
      .to([ty, ...out], { opacity: 0, duration: 0.3 }, hold)
      .set(ty, { clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 })
      .to(ty, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'steps(37)' }, '+=0.3')
      .to(out[0], { opacity: 1, duration: 0.25 }, '+=0.4')
      .to(out[1], { opacity: 1, duration: 0.25 }, '+=0.5')
      .set({}, {}, '+=1.2')
  },
  dash(v, gsap) {
    const bars = [...v.querySelectorAll('.ck-ex-bars i')], feed = v.querySelector('.ck-ex-feed'), rate = v.querySelector('[data-rate]')
    let n = 5
    const tick = () => {
      const f = FEED[n++ % FEED.length]
      // Chart: every bar takes its right neighbour's verdict; the newest request enters on the right.
      bars.forEach((b, i) => {
        const src = bars[i + 1]
        b.className = src ? src.className : `is-${f[0]}`
        b.style.setProperty('--h', src ? src.style.getPropertyValue('--h') : f[2] || (0.18 + Math.random() * 0.12).toFixed(2))
      })
      rate.textContent = `${Math.round((bars.filter((b) => b.className === 'is-hit').length / bars.length) * 100)}%`
      // Feed: the bottom row is recycled as the newest one on top.
      const li = feed.lastElementChild
      li.className = `is-${f[0]}`
      ;[li.children[0].textContent, li.children[1].textContent, li.children[2].textContent] = [f[1], f[2] || '—', f[3]]
      feed.prepend(li)
      gsap.fromTo(feed.children, { y: -li.offsetHeight }, { y: 0, duration: 0.5, ease: 'power3.out' })
      gsap.fromTo(li, { opacity: 0 }, { opacity: 1, duration: 0.4 })
    }
    return gsap.timeline({ repeat: -1, paused: true }).call(tick, null, 1.4)
  },
  upgrade(v, gsap, hold) {
    const lanes = v.querySelectorAll('.lane'), stamp = v.querySelector('.stamp'), meter = v.querySelector('.meter span')
    return gsap.timeline({ repeat: -1, paused: true })
      .to([stamp, ...lanes], { opacity: 0, duration: 0.4 }, hold)
      .set(lanes, { xPercent: -200 })
      .set(meter, { scaleX: 0 })
      .to(lanes, { opacity: 1, duration: 0.3, stagger: 0.08 })
      .to(meter, { scaleX: 1, duration: 1.2, ease: 'power1.inOut' }, '+=0.2')
      .to(lanes, { xPercent: 0, duration: 0.9, ease: 'power3.inOut', stagger: 0.14 })
      .fromTo(stamp, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out', immediateRender: false }, '-=0.1')
      .set({}, {}, '+=1.6')
  },
}

export function init(el, { gsap, ScrollTrigger }) {
  const $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)]
  const mm = gsap.matchMedia()
  // Refresh after the pinned scenes above so our starts include their spacing.
  const st = (o) => ({ refreshPriority: -1, ...o })

  // Sentence: words go faint → solid in reading order; each red group's rule draws as it's reached.
  const tl = gsap.timeline({ scrollTrigger: st({ trigger: $('.ck-ex-sentence'), start: 'top 80%', end: 'bottom 55%', scrub: 0.8 }) })
  $$('.ck-ex-sentence .w').forEach((w, i) => {
    tl.to(w, { opacity: 1, duration: 1, ease: 'none' }, i * 0.5)
    if (w.parentNode.tagName === 'EM' && !w.nextElementSibling.classList.contains('w'))
      tl.to(w.parentNode.querySelector('.u'), { scaleX: 1, duration: 1.5, ease: 'power2.out' }, i * 0.5)
  })

  // Bento tiles: each micro-visual loops gently, starting from (and returning to) its finished state, and only
  // while its tile is on screen. Holds differ per tile so neighbours don't pulse in sync.
  $$('.ck-ex-tile').forEach((t, i) => {
    const tl = LOOP[t.className.match(/is-(\w+)$/)[1]](t.querySelector('.ck-ex-viz'), gsap, 1.6 + (i % 3) * 0.7)
    ScrollTrigger.create(st({ trigger: t, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) }))
  })

  // "Doesn't do" tiles: each column drifts at its own speed (4 columns desktop, 2 tablet).
  mm.add({ four: '(min-width: 961px)', two: '(min-width: 601px) and (max-width: 960px)' }, (ctx) => {
    const n = ctx.conditions.four ? 4 : 2
    gsap.fromTo($$('.ck-ex-nots > li'), { y: (i) => 30 + (i % n) * 50 }, {
      y: (i) => -(i % n) * 20, ease: 'none', scrollTrigger: st({ trigger: $('.ck-ex-nots'), start: 'top bottom', end: 'bottom top', scrub: 1 }),
    })
  })

  // Editions: the marks and values land row by row as the comparison scrolls through.
  gsap.to($$('.ck-ex-cmp tbody :is(.ck-ex-mk, .ck-ex-val)'), {
    opacity: 1, scale: 1, ease: 'power2.out', stagger: 0.06,
    scrollTrigger: st({ trigger: $('.ck-ex-cmp tbody'), start: 'top 85%', endTrigger: $('.ck-ex-cmp'), end: 'bottom 70%', scrub: 0.8 }),
  })

  // Tiles: spotlight follows the pointer and the tile tilts toward it. Fine pointers only.
  mm.add('(hover: hover) and (pointer: fine)', () => {
    const off = $$('.ck-ex-tile article').map((a) => {
      const rx = gsap.quickTo(a, 'rotationX', { duration: 0.6, ease: 'power3' })
      const ry = gsap.quickTo(a, 'rotationY', { duration: 0.6, ease: 'power3' })
      gsap.set(a, { transformPerspective: 1200 })
      const move = (e) => {
        const r = a.getBoundingClientRect()
        a.style.setProperty('--mx', `${e.clientX - r.left}px`)
        a.style.setProperty('--my', `${e.clientY - r.top}px`)
        rx((0.5 - (e.clientY - r.top) / r.height) * 5); ry(((e.clientX - r.left) / r.width - 0.5) * 6)
      }
      const leave = () => { rx(0); ry(0) }
      a.addEventListener('pointermove', move)
      a.addEventListener('pointerleave', leave)
      return () => { a.removeEventListener('pointermove', move); a.removeEventListener('pointerleave', leave); gsap.set(a, { clearProps: 'transform' }) }
    })
    return () => off.forEach((f) => f())
  })
}
