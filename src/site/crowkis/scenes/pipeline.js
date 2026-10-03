// Scene "pipeline" (PAPER, #how): one repeat question, walked through Crowkis in four panels.
//   1 Ask         a new wording arrives next to one already answered; the transports it can come over
//   2 Understand  the two wordings side by side, the shared meaning marked; intent + template
//   3 Check       the five checks as a scorecard, ticks landing in turn (example values, labelled)
//   4 Answer      the cached answer back in 0.4 ms; the miss path, dimmed
// Each panel has draw(k), k in 0..1. Desktop pins one viewport (headline top-left, copy bottom-left, art right 60%)
// and crossfades the panels with scroll; mobile scrubs each stacked panel on its own. Static (reduced motion) is
// every panel at k = 1, which is the server markup. Then the "Try it" panel.
export const id = 'pipeline'

const CACHED = 'How long do refunds take?'
const ANSWER = 'Refunds take 5-7 business days.' // the stored answer in c.code.body
const VIA = ['RESP3', 'gRPC', 'REST', 'MCP']
const tpl = '<b class="ck-pl-topic">refund</b> · <span class="ck-pl-slot">{timeline}</span>'
// [check, meter html]: example values only where the scene has always shown them.
const CHECKS = [
  ['similarity', '<span class="ck-pl-bar" aria-hidden="true"><i style="--v:0.94"></i></span><span class="ck-pl-val"><b data-v="0.94">0.94</b></span>'],
  ['template', `<span class="ck-pl-tpl">${tpl}</span>`],
  ['confidence', '<span class="ck-pl-bar" aria-hidden="true"><i style="--v:0.91"></i><u style="--v:0.88"></u></span><span class="ck-pl-val"><b data-v="0.91">0.91</b> ≥ 0.88</span>'],
  ['trust', '<span class="ck-pl-lead" aria-hidden="true"></span>'],
  ['freshness', '<span class="ck-pl-lead" aria-hidden="true"></span>'],
]
const TICK = '<svg class="ck-pl-tick" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5"/><path d="M12 20.5l5.5 5.5L28.5 14" pathLength="1"/></svg>'

const ART = [
  `<div class="ck-pl-art ck-pl-ask">
        <div class="ck-pl-old"><p class="ck-pl-lbl">Already answered</p><p class="ck-pl-oq">${CACHED}</p><p class="ck-pl-oa">${ANSWER}</p></div>
        <div class="ck-pl-new"><p class="ck-pl-lbl">New question</p><p class="ck-pl-nq">${'What’s the refund timeline?'.split(' ').map((w) => `<span class="ck-pl-wm"><span>${w}</span></span>`).join(' ')}</p>
        <p class="ck-pl-via"><span class="ck-pl-lbl">over</span>${VIA.map((v) => `<b>${v}</b>`).join('')}</p></div>
      </div>`,
  `<div class="ck-pl-art ck-pl-und">
        <div class="ck-pl-pair">
          <p class="ck-pl-side"><span class="ck-pl-lbl">Cached</span><span class="ck-pl-slot">How long</span> do <b class="ck-pl-topic">refunds</b> <span class="ck-pl-slot">take</span>?</p>
          <span class="ck-pl-eq" aria-hidden="true">≈</span>
          <p class="ck-pl-side"><span class="ck-pl-lbl">New</span>What’s the <b class="ck-pl-topic">refund</b> <span class="ck-pl-slot">timeline</span>?</p>
        </div>
        <dl class="ck-pl-tags"><div><dt class="ck-pl-lbl">Intent</dt><dd><span class="ck-pl-chip">factual</span></dd></div><div><dt class="ck-pl-lbl">Template</dt><dd><span class="ck-pl-chip">${tpl}</span></dd></div></dl>
      </div>`,
  `<div class="ck-pl-art ck-pl-chk">
        <p class="ck-pl-lbl">Five checks, with example values</p>
        <ol class="ck-pl-card">${CHECKS.map(([n, m]) => `<li><span class="ck-pl-name">${n}</span><span class="ck-pl-m">${m}</span>${TICK}</li>`).join('')}</ol>
        <p class="ck-pl-pass"><b>5 of 5 passed.</b> Reuse the cached answer.</p>
      </div>`,
  `<div class="ck-pl-art ck-pl-ans">
        <p class="ck-pl-lbl">Served from cache in</p>
        <p class="ck-pl-ms"><span><b>0.4</b> ms</span></p>
        <p class="ck-pl-reply">“${ANSWER}”</p>
        <p class="ck-pl-free"><b>$0</b>, no model call</p>
        <p class="ck-pl-miss"><i aria-hidden="true"></i>On a miss: your LLM answers, Crowkis stores it after its trust checks.</p>
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

export const html = ({ c, esc, serif }) => `<section class="ck-scene ck-pipeline" id="how" data-scene="pipeline" aria-labelledby="ck-pl-title">
  <div class="ck-pl-pin">
    <header class="ck-pl-head">
      <h2 id="ck-pl-title">How Crowkis answers a repeat question</h2>
      <p>Follow one refund question from your app to a cached answer.</p>
    </header>
    <ol class="ck-pl-steps">
      ${c.how.map(([title, text], i) => `<li class="ck-pl-step">
        <div class="ck-pl-copy"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>
        ${ART[i]}
      </li>`).join('\n      ')}
    </ol>
    <div class="ck-pl-rail" aria-hidden="true">${c.how.map((_, i) => `<span>${i + 1}</span>`).join('')}<i></i></div>
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

// ---------- browser ----------
const clamp = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
const seg = (k, a, b) => clamp((k - a) / (b - a))
const ease = (t) => t * t * (3 - 2 * t)
const rise = (e, a, px = 18) => { e.style.opacity = a.toFixed(3); e.style.transform = `translateY(${((1 - a) * px).toFixed(1)}px)` }

const drawAsk = (s) => {
  const old = s.querySelector('.ck-pl-old'), words = [...s.querySelectorAll('.ck-pl-wm > span')], lbl = s.querySelector('.ck-pl-new > .ck-pl-lbl')
  const via = [s.querySelector('.ck-pl-via .ck-pl-lbl'), ...s.querySelectorAll('.ck-pl-via b')]
  return (k) => {
    rise(old, ease(seg(k, 0, 0.22)))
    lbl.style.opacity = seg(k, 0.16, 0.26).toFixed(3)
    words.forEach((w, i) => { w.style.transform = `translateY(${((1 - ease(seg(k, 0.2 + i * 0.08, 0.4 + i * 0.08))) * 110).toFixed(1)}%)` })
    via.forEach((v, i) => rise(v, ease(seg(k, 0.6 + i * 0.07, 0.72 + i * 0.07)), 12))
  }
}

const drawUnd = (s) => {
  const pair = s.querySelector('.ck-pl-pair'), eq = s.querySelector('.ck-pl-eq'), tags = [...s.querySelectorAll('.ck-pl-tags > div')]
  return (k) => {
    pair.style.setProperty('--m', ease(seg(k, 0.06, 0.32)).toFixed(3))
    pair.style.setProperty('--s', ease(seg(k, 0.28, 0.56)).toFixed(3))
    eq.style.opacity = seg(k, 0.46, 0.6).toFixed(3)
    tags.forEach((t, i) => rise(t, ease(seg(k, 0.6 + i * 0.14, 0.76 + i * 0.14))))
  }
}

const drawChk = (s) => {
  const rows = [...s.querySelectorAll('.ck-pl-card li')].map((r) => ({ r, bar: r.querySelector('.ck-pl-bar i'), n: r.querySelector('[data-v]'), on: true })) // on = passed, as in the markup
  const pass = s.querySelector('.ck-pl-pass')
  return (k) => {
    rows.forEach((o, i) => {
      const a = 0.04 + i * 0.15, m = ease(seg(k, a, a + 0.1)), t = ease(seg(k, a + 0.08, a + 0.13))
      if (o.bar) o.bar.style.transform = `scaleX(${m.toFixed(4)})`
      if (o.n) o.n.textContent = (+o.n.dataset.v * m).toFixed(2)
      o.r.style.setProperty('--t', t.toFixed(3))
      if (o.on !== t > 0.5) { o.on = t > 0.5; o.r.classList.toggle('is-off', !o.on) }
    })
    rise(pass, ease(seg(k, 0.82, 0.94)), 10)
  }
}

const drawAns = (s) => {
  const lbl = s.querySelector('.ck-pl-lbl'), ms = s.querySelector('.ck-pl-ms > span'), reply = s.querySelector('.ck-pl-reply'), free = s.querySelector('.ck-pl-free')
  const miss = s.querySelector('.ck-pl-miss'), line = miss.querySelector('i')
  return (k) => {
    lbl.style.opacity = seg(k, 0, 0.12).toFixed(3)
    ms.style.transform = `translateY(${((1 - ease(seg(k, 0.04, 0.36))) * 105).toFixed(1)}%)`
    rise(reply, ease(seg(k, 0.32, 0.5)))
    rise(free, ease(seg(k, 0.46, 0.62)))
    line.style.transform = `scaleX(${ease(seg(k, 0.64, 0.86)).toFixed(4)})`
    miss.style.opacity = (0.15 + 0.85 * seg(k, 0.7, 0.9)).toFixed(3)
  }
}

export function init(el, { gsap }) {
  const steps = [...el.querySelectorAll('.ck-pl-step')]
  const draws = [drawAsk, drawUnd, drawChk, drawAns].map((d, i) => d(steps[i]))
  const rail = [...el.querySelectorAll('.ck-pl-rail span')], fill = el.querySelector('.ck-pl-rail i')
  const pin = el.querySelector('.ck-pl-pin')
  const reset = () => { steps.forEach((s) => { s.style.cssText = '' }); draws.forEach((d) => d(1)) } // back to the finished panels
  const mm = gsap.matchMedia()

  // Desktop: one pinned viewport. Panel 1 plays as the stage scrolls up into place; the pin then walks panels 2-4,
  // crossfading at the seams (f runs 0.6 → 4: a short hold on panel 1, a short hold on the finished panel 4).
  mm.add('(min-width: 901px)', () => {
    const W = 0.1, st = { p: 0 }
    const render = () => {
      const f = 0.6 + st.p * 3.4
      steps.forEach((s, i) => {
        const fin = i ? clamp((f - i + W) / (2 * W)) : 1
        const fout = i < 3 ? clamp((i + 1 + W - f) / (2 * W)) : 1
        const o = Math.min(fin, fout)
        s.style.opacity = o.toFixed(3)
        s.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        s.style.transform = `translateY(${(fin < 1 ? (1 - fin) * 28 : (fout - 1) * 28).toFixed(1)}px)`
        if (i) draws[i](clamp((f - i - W) / (1 - 3 * W)))
      })
      rail.forEach((r, i) => r.classList.toggle('on', i === Math.min(3, Math.floor(f))))
      fill.style.transform = `scaleX(${st.p.toFixed(4)})`
    }
    const k0 = { k: 0 }
    gsap.to(k0, { k: 1, ease: 'none', onUpdate: () => draws[0](k0.k), scrollTrigger: { trigger: pin, start: 'top 80%', end: 'top 8%', scrub: 0.8 } })
    gsap.to(st, {
      p: 1, ease: 'none', onUpdate: render,
      scrollTrigger: { trigger: pin, pin: true, start: 'top top', end: () => `+=${innerHeight * 3.2}`, scrub: 0.8, invalidateOnRefresh: true },
    })
    draws[0](0)
    render()
    return reset
  })

  // Mobile: panels stay stacked; each one scrubs through its own story as it crosses the viewport.
  mm.add('(max-width: 900px)', () => {
    steps.forEach((s, i) => {
      const st = { k: 0 }
      gsap.to(st, { k: 1, ease: 'none', onUpdate: () => draws[i](st.k), scrollTrigger: { trigger: s.querySelector('.ck-pl-art'), start: 'top 85%', end: 'bottom 55%', scrub: 0.6 } })
      draws[i](0)
    })
    return reset
  })

  // Try-it panel: the terminal rises, then each row types in (clip wipe) with its note sliding in beside it.
  const code = { trigger: '.ck-pl-code', scrub: 0.8 }
  gsap.from('.ck-pl-term', { y: 60, ease: 'power2.out', scrollTrigger: { ...code, start: 'top bottom', end: 'top 55%' } })
  const tl = gsap.timeline({ scrollTrigger: { ...code, start: 'top 80%', end: 'top 30%' } })
  el.querySelectorAll('.ck-pl-row').forEach((row, i) => {
    tl.fromTo(row.querySelector('code'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', duration: 1 }, i)
      .fromTo(row.querySelector('.ck-pl-note'), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.5 }, i + 0.6)
  })
}
