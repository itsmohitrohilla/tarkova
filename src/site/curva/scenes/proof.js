// Scene "proof" (INK): Curva vs Jev, the fuller picture behind the hero's three headline wins. An accuracy
// chart against Jev's published numbers (wins, then matches), a plain comparison with asking an LLM directly,
// and the link to /curva/vs-jev/, which carries every number and where Jev is ahead. Numbers: Content Box/
// 4 Benchmarks/benchmarks.md sections 1 and 2 (2026-10-01); Jev named per founder decision 2026-10-02.
// Table: Content Box/1 Product/what-is-curva.md and how-it-works.md.
export const id = 'proof'

const DATE = '2026-10-01'
const GEMINI = 'gemini-flash-lite-latest'
const GROQ = 'qwen3.8-27b on Groq'
const VS = '/curva/vs-jev/'
// Nominative use only: small, beside the name, never larger than Curva's mark.
const JEV = '<img class="cv-pf-jev" src="/compare/jev-logo.svg" alt="" width="16" height="16" />Jev'

// Accuracy, natural label mix, with the 95% range. win: the range sits above Jev's published number.
const ROWS = [
  { set: 'PhishNChips', model: GEMINI, n: 100, v: 80.8, lo: 73, hi: 89, b: 62.6, win: true },
  { set: 'PhishNChips', model: GROQ, n: 100, v: 72.8, lo: 64, hi: 82, b: 62.6, win: true },
  { set: 'HellaSwag', model: GROQ, n: 100, v: 86.0, lo: 79, hi: 93, b: 86.1 },
  { set: 'OpenBookQA', model: GEMINI, n: 100, v: 92.2, lo: 87, hi: 97, b: 94.2 },
  { set: 'BoolQ', model: GEMINI, n: 127, v: 88.9, lo: 83, hi: 94, b: 89.7 },
  { set: 'BANKING77', model: GEMINI, n: 120, v: 79.8, lo: 73, hi: 87, b: 75.3 },
]
const MIN = 60 // chart domain 60% to 100%: every value and range fits, dots need no zero baseline
const at = (x) => `${(((x - MIN) / (100 - MIN)) * 100).toFixed(2)}%`

const TABLE = [
  ['Output', 'A sentence you parse', 'One of your labels, validated'],
  ['Confidence', 'A self-reported guess', 'A probability for every option. Once you send corrections, it matches how often it is right'],
  ['Stability', 'Can change when options are reordered', 'Asked in both orders and averaged'],
  ['When unsure', 'It guesses', 'Says it is not sure (<code>abstain: true</code>), so a person can decide'],
  ['Audit', 'Nothing to check', 'Every decision logged'],
  ['Runs on', 'Their servers', 'Yours, with any model'],
]

export const html = ({ esc }) => `<section class="cv-scene cv-proof" data-scene="proof" aria-labelledby="cv-pf-title">
  <div class="cv-pf-in">
    <h2 id="cv-pf-title">Curva vs Jev: accuracy on public benchmarks.</h2>
    <p class="cv-pf-lede">How often each one picks the right answer, on six public test sets. We call it a win only when even the low end of Curva's range beats Jev. Otherwise it matches.</p>

    <figure class="cv-pf-chart">
      <figcaption>
        <h3>LLM classification accuracy, test set by test set</h3>
        <p class="cv-pf-meta">Run ${DATE} · Jev scores are its published ones, on different samples</p>
        <ul class="cv-pf-legend">
          <li><i class="k-win"></i>Curva, win</li>
          <li><i class="k-tie"></i>Curva, matches</li>
          <li><i class="k-range"></i>95% range, the likely spread</li>
          <li><i class="k-best"></i>${JEV} (published)</li>
        </ul>
      </figcaption>
      <div class="cv-pf-axis" aria-hidden="true"><span></span><span>${[60, 70, 80, 90, 100].map((t) => `<i style="left:${at(t)}">${t}%</i>`).join('')}</span></div>
      <ol class="cv-pf-rows">
${ROWS.map((r) => `        <li class="${r.win ? 'is-win' : 'is-tie'}">
          <p class="cv-pf-set"><b>${esc(r.set)}</b><span>${esc(r.model)} · n&nbsp;=&nbsp;${r.n}</span></p>
          <div class="cv-pf-plot" role="img" aria-label="${esc(`${r.set}: Curva ${r.v.toFixed(1)}%, 95% range ${r.lo}% to ${r.hi}%, Jev published ${r.b}%, ${r.win ? 'win' : 'matches'}`)}">
            <span class="cv-pf-band" style="left:${at(r.lo)};width:calc(${at(r.hi)} - ${at(r.lo)})"></span>
            <span class="cv-pf-dot" style="left:${at(r.v)}"></span>
            <span class="cv-pf-best" style="left:${at(r.b)}"></span>
          </div>
          <p class="cv-pf-val"><b>${r.v.toFixed(1)}%</b><span>Jev ${r.b}%</span><em>${r.win ? 'win' : 'matches'}</em></p>
        </li>`).join('\n')}
      </ol>
    </figure>

    <table class="cv-pf-vs">
      <caption>Asking an LLM directly vs asking through Curva</caption>
      <thead><tr><td></td><th scope="col">Asking an LLM directly</th><th scope="col">Curva</th></tr></thead>
      <tbody>
${TABLE.map(([k, a, c]) => `        <tr><th scope="row">${k}</th><td>${esc(a)}</td><td>${c}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <p class="cv-pf-foot">Jev is still ahead on some runs. <a href="${VS}">Curva vs Jev, every number ↗</a></p>
    <p class="cv-pf-tm">Jev and TypeSafe are trademarks of their respective owners. Tarkova is not affiliated with them. Jev numbers are their published figures.</p>
  </div>
</section>`

// Scroll-scrubbed: the chart's dots slide in from the left edge with their ranges drawing, row by row.
export function init(el, { gsap }) {
  const rows = el.querySelector('.cv-pf-rows')
  const chart = gsap.timeline({ scrollTrigger: { trigger: rows, start: 'top 90%', end: 'bottom 60%', scrub: 0.8, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  rows.querySelectorAll('li').forEach((row, i) => {
    const dot = row.querySelector('.cv-pf-dot')
    chart
      .fromTo(row.querySelector('.cv-pf-band'), { scaleX: 0 }, { scaleX: 1, duration: 1 }, i * 0.5)
      .fromTo(dot, { x: () => -dot.offsetLeft, opacity: 0 }, { x: 0, opacity: 1, duration: 1 }, i * 0.5)
  })
}
