// Scene "hero" (BLUE). Plain words first (owner): what Curva does, one concrete example (0.97 is the docs' example
// value, Content Box 3 Use cases/ai-agents.md), then the proof. Fold: wordmark, the only h1, subline, example, buttons, and:
// Curva vs Jev head to head on a public phishing benchmark. Wins only, from Content Box/4 Benchmarks/benchmarks.md
// section 1 (all n = 100, 2026-10-01; Jev = its published numbers, on different samples). The quickstart lives
// in "start". Everything is final in the server HTML. Motion: a short load intro on the charts (they are in view on
// load, so a scroll scrub would start empty), then a faint sheen on Curva's bars (CSS). Pre-states only under html.cv-motion.
export const id = 'hero'

const DOCS = 'https://docs.tarkova.com/curva/'
const VS = '/curva/vs-jev/'
const JEV_LOGO = '/compare/jev-logo.svg'

// One small chart per win: [verdict (checked: 80.8 - 62.6 = 18.2 points; 0.154 vs 0.138 is 10.4% lower;
// 239 - 178 = 61 ms), plain metric label, curva, jev, unit, decimals, source line]. Bars start at zero, scaled to
// the larger value; for error and time the shorter Curva bar is the win, and the verdict says so.
const CHARTS = [
  ['18 points more accurate', 'Accuracy on phishing emails', 80.8, 62.6, '%', 1, 'gemini-flash-lite-latest · PhishNChips · n = 100 · 2026-10-01 · 95% range 73% to 89%'],
  ['10% lower error', 'Calibration error: how far its confidence is from reality', 0.138, 0.154, '', 3, 'gemini-flash-lite-latest · PhishNChips · n = 100 · 2026-10-01'],
  ['61 ms faster', 'Typical response time', 178, 239, ' ms', 0, 'groq qwen3.8-27b · PhishNChips · n = 100 · 2026-10-01'],
]

// Jev has no wordmark asset of its own (typesafe.ai sets the name in text); its maker's mark sits beside the name.
const jev = `<img src="${JEV_LOGO}" alt="" width="16" height="16">Jev`
const wm = (p, h) => `<img class="cv-hero-wm" src="${p.wordmark[0]}" alt="Curva" width="${Math.round((h * p.wordmark[1]) / p.wordmark[2])}" height="${h}">`

const chart = ([verdict, metric, c, j, unit, dp, src], p) => {
  const max = Math.max(c, j), f = (v) => v.toFixed(dp) + unit
  const col = (cls, name, v) => `<div class="cv-hero-ch-col ${cls}" style="--h:${(v / max).toFixed(3)}" title="${name.replace(/<[^>]+>/g, '')}: ${f(v)}"><b>${f(v)}</b><i></i></div>`
  return `<li class="cv-hero-ch">
          <p class="cv-hero-ch-v">${verdict}</p>
          <p class="cv-hero-ch-m">${metric}</p>
          <div class="cv-hero-ch-plot" role="img" aria-label="${metric}: Curva ${f(c)}, Jev ${f(j)}">${col('is-cv', 'Curva', c)}${col('is-jev', 'Jev', j)}</div>
          <div class="cv-hero-ch-x" aria-hidden="true"><span>${wm(p, 11)}</span><span>${jev}</span></div>
          <p class="cv-hero-ch-src">${src}</p>
        </li>`
}

export const html = ({ p, esc }) => `<section class="cv-scene cv-hero" data-scene="hero" aria-labelledby="cv-hero-h">
  <div class="cv-hero-dots" aria-hidden="true"></div>
  <div class="cv-hero-in">
    <p class="cv-hero-mark"><img src="${p.wordmark[0]}" alt="${esc(p.name)}" width="${p.wordmark[1]}" height="${p.wordmark[2]}"></p>
    <h1 id="cv-hero-h">LLM classification with confidence scores you can trust.</h1>
    <div class="cv-hero-act">
      <p class="cv-hero-sub">Curva is a decision server that makes your LLM pick one of your options and say how sure it is. Bring the AI key you already use.</p>
      <p class="cv-hero-eg"><span>Which team should handle this email?</span><span class="cv-hero-eg-a"><b>Billing</b>, 97% sure</span></p>
      <div class="cv-hero-cta">
        <a class="cv-hero-btn" href="#start">Get started</a>
        <a class="cv-hero-btn cv-hero-btn-ghost" href="${DOCS}" rel="noopener">Read the docs <span aria-hidden="true">↗</span></a>
      </div>
    </div>
    <figure class="cv-hero-vs" aria-labelledby="cv-hero-vs-t">
      <p class="cv-hero-vs-t" id="cv-hero-vs-t">Curva vs Jev on a public phishing benchmark</p>
      <p class="cv-hero-vs-what">Curva's best run on each measure, with the model named under each chart. Jev is a hosted AI decision service.</p>
      <p class="cv-hero-vs-key"><span class="is-cv">${wm(p, 14)}</span><span class="is-jev">${jev}</span></p>
      <ul>
        ${CHARTS.map((c) => chart(c, p)).join('\n        ')}
      </ul>
      <figcaption><a href="${VS}">Every number, including where Jev is ahead <span aria-hidden="true">↗</span></a><span>Jev numbers are their published figures.</span></figcaption>
    </figure>
  </div>
</section>`

export function init(el, { gsap }) {
  // ≤ 1.2 s, left to right: verdict and label rise in, bars grow from the baseline, numerals count up to the
  // server's final text (restored exactly on complete).
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  el.querySelectorAll('.cv-hero-ch').forEach((ch, i) => {
    const t = i * 0.1
    tl.fromTo(ch.querySelectorAll('.cv-hero-ch-v, .cv-hero-ch-m'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, t)
    ch.querySelectorAll('.cv-hero-ch-col').forEach((col, k) => {
      const num = col.querySelector('b'), final = num.textContent
      const [, n, rest] = final.match(/^([\d.]+)(.*)$/), dp = (n.split('.')[1] || '').length, o = { v: 0 }
      tl.fromTo(col.querySelector('i'), { scaleY: 0 }, { scaleY: 1, duration: 0.75 }, t + 0.15 + k * 0.08)
        .fromTo(num, { opacity: 0 }, { opacity: 1, duration: 0.25 }, '<')
        .to(o, { v: +n, duration: 0.75, onUpdate: () => (num.textContent = o.v.toFixed(dp) + rest), onComplete: () => (num.textContent = final) }, '<')
    })
  })
}
