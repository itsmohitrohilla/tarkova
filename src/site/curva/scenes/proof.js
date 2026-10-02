// Scene "proof" (INK): the measured wins from Content Box/4 Benchmarks/benchmarks.md section 1, then the
// section 2 matches. Compared against the best published number for a hosted decision model on the same
// dataset (no competitor names). Every figure carries model, dataset, n and date.
export const id = 'proof'

const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'
const DATE = '2026-10-01'
const GEMINI = 'gemini-flash-lite-latest'
const GROQ = 'qwen3.8-27b on Groq'

// min/max: the scale. lo/hi: 95% range (accuracy only). v: Curva. b: best published.
const WINS = [
  { num: '80.8', unit: '%', what: 'Phishing accuracy', sub: 'Natural label mix. 95% range 73% to 89%.', model: GEMINI, min: 0, max: 100, lo: 73, hi: 89, v: 80.8, b: 62.6, fmt: (x) => `${x}%` },
  { num: '72.8', unit: '%', what: 'Phishing accuracy', sub: 'Natural label mix. 95% range 64% to 82%.', model: GROQ, min: 0, max: 100, lo: 64, hi: 82, v: 72.8, b: 62.6, fmt: (x) => `${x}%` },
  { num: '0.138', unit: '', what: 'Calibration error (ECE)', sub: 'Lower is better.', model: GEMINI, min: 0, max: 0.2, v: 0.138, b: 0.154, fmt: (x) => `${x}` },
  { num: '178', unit: 'ms', what: 'Median time per decision', sub: 'Lower is better. Other models we ran were slower.', model: GROQ, min: 0, max: 300, v: 178, b: 239, fmt: (x) => `${x} ms` },
]

// Ties: the 95% range includes the published number.
const MATCHES = [
  { set: 'HellaSwag', v: 86.0, lo: 79, hi: 93, b: 86.1, model: GROQ, n: 100 },
  { set: 'OpenBookQA', v: 92.2, lo: 87, hi: 97, b: 94.2, model: GEMINI, n: 100 },
  { set: 'BoolQ', v: 88.9, lo: 83, hi: 94, b: 89.7, model: GEMINI, n: 127 },
  { set: 'BANKING77', v: 79.8, lo: 73, hi: 87, b: 75.3, model: GEMINI, n: 120 },
]

const pct = (x, min, max) => `${(((x - min) / (max - min)) * 100).toFixed(2)}%`

const scale = (w, esc) => {
  const at = (x) => pct(x, w.min, w.max)
  const band = w.lo != null ? `left:${at(w.lo)};width:calc(${at(w.hi)} - ${at(w.lo)})` : `left:0;width:${at(w.v)}`
  return `<div class="cv-pf-scale${w.lo != null ? '' : ' is-fill'}" role="img" aria-label="${esc(`Curva ${w.fmt(w.v)}, best published ${w.fmt(w.b)}`)}">
        <span class="cv-pf-track"></span>
        <span class="cv-pf-band" style="${band}"></span>
        <span class="cv-pf-dot" style="left:${at(w.v)}"></span>
        <span class="cv-pf-best" style="left:${at(w.b)}"><span>best published ${esc(w.fmt(w.b))}</span></span>
        <span class="cv-pf-ends"><span>${esc(w.fmt(w.min))}</span><span>${esc(w.fmt(w.max))}</span></span>
      </div>`
}

export const html = ({ esc }) => `<section class="cv-scene cv-proof" data-scene="proof" aria-labelledby="cv-pf-title">
  <div class="cv-pf-in">
    <div class="cv-pf-head">
      <h2 id="cv-pf-title">Honest numbers, with the n next to each one.</h2>
      <p>Each one against the best published number for a hosted decision model on the same dataset.</p>
    </div>

    <div class="cv-pf-wins">
${WINS.map((w) => `    <article class="cv-pf-win">
      <p class="cv-pf-num">${esc(w.num)}${w.unit ? `<span>${esc(w.unit)}</span>` : ''}</p>
      <h3>${esc(w.what)}</h3>
      <p class="cv-pf-sub">${esc(w.sub)}</p>
      ${scale(w, esc)}
      <p class="cv-pf-meta">${esc(w.model)} · PhishNChips · n&nbsp;=&nbsp;100 · ${DATE}</p>
    </article>`).join('\n')}
    </div>

    <div class="cv-pf-matches">
      <h3>Where we match</h3>
      <p class="cv-pf-sub">Within the margin of the best published number. Accuracy, ${DATE}.</p>
      <ul>
${MATCHES.map((m) => `        <li>
          <span class="cv-pf-set">${esc(m.set)}</span>
          <span class="cv-pf-pair"><b>${m.v.toFixed(1)}%</b> <span>vs ${m.b}%</span></span>
          <span class="cv-pf-mini" role="img" aria-label="${esc(`95% range ${m.lo}% to ${m.hi}%, best published ${m.b}%`)}"><span class="cv-pf-band" style="left:${m.lo}%;width:${m.hi - m.lo}%"></span><span class="cv-pf-best" style="left:${m.b}%"></span></span>
          <span class="cv-pf-meta">${esc(m.model)} · n&nbsp;=&nbsp;${m.n}</span>
        </li>`).join('\n')}
      </ul>
    </div>

    <p class="cv-pf-foot">Some runs still trail. <a href="${DOCS}" target="_blank" rel="noopener">See every result ↗</a></p>
  </div>
</section>`

// Scroll-scrubbed: the range bands draw out from their left edge as the readings cross the viewport.
export function init(el, { gsap }) {
  el.querySelectorAll('.cv-pf-win, .cv-pf-matches li').forEach((row) => {
    const band = row.querySelector('.cv-pf-band')
    const dot = row.querySelector('.cv-pf-dot')
    const st = { trigger: row, start: 'top 92%', end: 'top 55%', scrub: 0.8 }
    gsap.fromTo(band, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: st })
    if (dot) gsap.fromTo(dot, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: st })
  })
}
