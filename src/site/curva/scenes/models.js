// Scene "models" (BLUE): every model we ran through Curva, one line each across the public test sets, with
// Jev's published score per set as a pink diamond; then accuracy vs speed on PhishNChips; then why the
// numbers can be trusted. Accuracy: Content Box/4 Benchmarks/benchmarks.md section 4 (natural label mix,
// 95% range, n; run 2026-10-01). Cost: benchmarks.md section 7 (2026-09-30). Speed: section 4 PhishNChips
// table (p50). Paid models are n = 20 per set: drawn hollow and dashed and labelled "early, n = 20".
// Logos: Simple Icons (CC0) paths, simple-icons@13 (OpenAI, Anthropic, Google Gemini) and @16 (Qwen; there
// is no Groq icon, so the model family's mark stands in, with "on Groq" in the name).
// Interaction is CSS only (radio "show one model", hover tooltips), so it works without the motion bundle.
export const id = 'models'

const DATE = '2026-10-01'
const VS = '/curva/vs-jev/'

const LOGO = {
  gemini: 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81',
  qwen: 'M23.919 14.545 20.817 9.17l1.47-2.544a.56.56 0 0 0 0-.566l-1.633-2.83a.57.57 0 0 0-.49-.283h-6.207L12.487.402a.57.57 0 0 0-.49-.284H8.732a.56.56 0 0 0-.49.284L5.139 5.775h-2.94a.56.56 0 0 0-.49.284L.077 8.887a.56.56 0 0 0 0 .567L3.18 14.83l-1.47 2.545a.56.56 0 0 0 0 .566l1.634 2.83a.57.57 0 0 0 .49.283h6.205l1.47 2.545a.57.57 0 0 0 .49.284h3.266a.57.57 0 0 0 .49-.284l3.104-5.375h2.94a.57.57 0 0 0 .49-.283l1.634-2.828a.55.55 0 0 0-.004-.568M8.733.686l1.634 2.828-1.634 2.828H21.8L20.164 9.17H7.425L5.63 6.06Zm1.306 19.801-6.205-.002 1.634-2.83h3.265L2.201 6.344h3.267q3.182 5.517 6.367 11.032zm10.124-5.66L18.53 12l-6.532 11.315-1.634-2.83c2.129-3.673 4.25-7.351 6.373-11.028h3.592l3.102 5.374z',
  anthropic: 'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
  openai: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
}
const logo = (k) => `<svg class="cv-md-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${LOGO[k]}"/></svg>`

// m: marker shape. early: the paid n = 20 runs. cost: per 1,000 decisions, all 8 sets (benchmarks.md section 7).
const MODELS = [
  { k: 'gemini', name: 'gemini-flash-lite-latest', by: 'Google', logo: 'gemini', short: 'Gemini', m: 'dot', n: 'n = 98 to 127 per set', cost: '$0 on the free tier' },
  { k: 'groq', name: 'qwen3.8-27b on Groq', by: 'Groq (Qwen model)', logo: 'qwen', short: 'Qwen on Groq', m: 'dot', n: 'n = 69 to 100 per set', cost: '$0 on the free tier' },
  { k: 'haiku', name: 'Claude Haiku 4.5', by: 'Anthropic', logo: 'anthropic', short: 'Haiku 4.5', m: 'ring', early: true, cost: '$1.64 per 1,000 decisions' },
  { k: 'mini', name: 'gpt-4.1-mini', by: 'OpenAI', logo: 'openai', short: '4.1-mini', m: 'ring', early: true, cost: '$0.314 per 1,000 decisions' },
  { k: 'o4mini', name: 'gpt-4o-mini', by: 'OpenAI', logo: 'openai', short: '4o-mini', m: 'square', early: true, cost: '$0.118 per 1,000 decisions' },
  { k: 'nano', name: 'gpt-4.1-nano', by: 'OpenAI', logo: 'openai', short: '4.1-nano', m: 'tri', early: true, cost: '$0.078 per 1,000 decisions' },
]
const BY = Object.fromEntries(MODELS.map((m) => [m.k, m]))

// Order: the sets both free models ran first, so every line is unbroken (Groq has no BoolQ or Yelp run).
const SETS = [
  { k: 'phish', name: 'PhishNChips', what: 'Phishing, yes or no', jev: 62.6 },
  { k: 'b77', name: 'BANKING77', what: '77 intents', jev: 75.3 },
  { k: 'obqa', name: 'OpenBookQA', what: 'Multiple choice', jev: 94.2 },
  { k: 'csqa', name: 'CommonsenseQA', what: 'Multiple choice', jev: 88.1 },
  { k: 'hs', name: 'HellaSwag', what: 'Multiple choice', jev: 86.1 },
  { k: 'aita', name: 'AITA', what: 'Moral verdict, 4 options', jev: 75.4 },
  { k: 'boolq', name: 'BoolQ', what: 'Reading, yes or no', jev: 89.7 },
  { k: 'yelp', name: 'Yelp', what: 'Review stars, 1 to 5', jev: null },
]

// [accuracy at the natural label mix (Yelp: plain accuracy), 95% low, 95% high, n, verdict vs Jev]
// Verdicts as benchmarks.md words them: win; matches (sections 2 "matches"); margin ("within the margin");
// loss; early (a paid n = 20 tie: too few rows to call). Yelp has no Jev number.
const R = {
  gemini: { phish: [80.8, 73, 89, 100, 'win'], b77: [79.8, 73, 87, 120, 'matches'], obqa: [92.2, 87, 97, 100, 'matches'], csqa: [82.0, 74, 90, 100, 'margin'], hs: [78.6, 70, 87, 98, 'margin'], aita: [67.2, 58, 76, 100, 'margin'], boolq: [88.9, 83, 94, 127, 'matches'], yelp: [54.0, 44, 64, 100] },
  groq: { phish: [72.8, 64, 82, 100, 'win'], b77: [74.7, 64, 85, 69, 'margin'], obqa: [85.0, 78, 92, 100, 'loss'], csqa: [84.0, 77, 91, 100, 'matches'], hs: [86.0, 79, 93, 100, 'matches'], aita: [55.7, 46, 65, 100, 'loss'] },
  haiku: { phish: [75.0, 56, 94, 20, 'early'], b77: [65.0, 44, 86, 20, 'early'], obqa: [94.5, 84, 100, 20, 'early'], csqa: [75.0, 56, 94, 20, 'early'], hs: [85.0, 69, 100, 20, 'early'], aita: [61.2, 40, 83, 20, 'early'], boolq: [90.0, 77, 100, 20, 'early'], yelp: [50.0, 28, 72, 20] },
  mini: { phish: [70.0, 50, 90, 20, 'early'], b77: [75.0, 56, 94, 20, 'early'], obqa: [91.7, 80, 100, 20, 'early'], csqa: [80.0, 62, 98, 20, 'early'], hs: [80.0, 62, 98, 20, 'early'], aita: [41.0, 19, 63, 20, 'loss'], boolq: [90.0, 77, 100, 20, 'early'], yelp: [50.0, 28, 72, 20] },
  o4mini: { phish: [50.0, 28, 72, 20, 'early'], b77: [60.0, 39, 81, 20, 'early'], obqa: [86.4, 71, 100, 20, 'early'], csqa: [90.0, 77, 100, 20, 'early'], hs: [55.0, 33, 77, 20, 'loss'], aita: [40.9, 19, 62, 20, 'loss'], boolq: [95.0, 85, 100, 20, 'early'], yelp: [55.0, 33, 77, 20] },
  nano: { phish: [55.0, 33, 77, 20, 'early'], b77: [50.0, 28, 72, 20, 'loss'], obqa: [77.0, 59, 95, 20, 'early'], csqa: [75.0, 56, 94, 20, 'early'], hs: [60.0, 39, 81, 20, 'loss'], aita: [40.9, 19, 62, 20, 'loss'], boolq: [75.0, 56, 94, 20, 'early'], yelp: [50.0, 28, 72, 20] },
}
const SAYS = { win: 'Curva wins', matches: 'matches Jev', margin: 'within the margin of Jev', loss: 'Jev is ahead', early: 'early, too few rows to call' }

// Accuracy vs speed on PhishNChips (p50 per decision, benchmarks.md section 4). Jev: 239 ms, third-party.
const SPEED = { gemini: 1146, groq: 178, haiku: 958, mini: 720, o4mini: 805, nano: 750 }
const JEV_MS = 239

const Y0 = 40, Y1 = 100 // line chart: every value fits 40% to 100%
const pv = (v) => +(((v - Y0) / (Y1 - Y0)) * 100).toFixed(2) // 0 bottom .. 100 top
const pu = (i) => +(((i + 0.5) / SETS.length) * 100).toFixed(3) // column (desktop) / row (mobile) centre
const pct = (v) => `${v.toFixed(1)}%`
const range = ([, lo, hi]) => `${lo}% to ${hi}%`

const marker = (m) => `<svg class="cv-md-mk" viewBox="0 0 14 14" aria-hidden="true" focusable="false">${
  m === 'dot' ? '<circle cx="7" cy="7" r="5" />'
    : m === 'ring' ? '<circle cx="7" cy="7" r="4" />'
      : m === 'square' ? '<rect x="3" y="3" width="8" height="8" />'
        : m === 'tri' ? '<path d="M7 2.4 11.6 10.6H2.4Z" />'
          : '<path d="M7 1.6 12.4 7 7 12.4 1.6 7Z" />'}</svg>`

// Line-start labels. Desktop: a column left of the plot, pushed apart to 26px (plot is 440px tall).
// Mobile: logos above the plot, stacked into tiers where they would touch (plot at least 300px wide).
const PH = 440, GAP = 26
const starts = MODELS.map((m) => ({ k: m.k, v: R[m.k].phish[0] }))
{
  const s = [...starts].sort((a, b) => b.v - a.v)
  let prev = -Infinity
  for (const l of s) { l.y = Math.max(((Y1 - l.v) / (Y1 - Y0)) * PH, prev + GAP); prev = l.y }
  const over = prev - (PH - 12); if (over > 0) s.forEach((l) => { l.y -= over })
  const asc = [...starts].sort((a, b) => a.v - b.v), last = []
  for (const l of asc) {
    const x = (pv(l.v) / 100) * 300
    let t = 0; while (last[t] !== undefined && x - last[t] < 22) t++
    last[t] = x; l.t = t
  }
}
const START = Object.fromEntries(starts.map((l) => [l.k, l]))

const tip = (m, s, r) => `<span class="cv-md-tip" role="tooltip"><b>${m.name}</b> · ${s.name}<br>${pct(r[0])} (95% range ${range(r)}), n&nbsp;=&nbsp;${r[3]}${m.early ? ', early' : ''}<br>${s.jev == null ? 'No Jev number for this set' : `Jev ${s.jev}% · ${SAYS[r[4]]}`}</span>`

function lines(orient) {
  const pt = (i, v) => (orient === 'h' ? `${pu(i)} ${(100 - pv(v)).toFixed(2)}` : `${pv(v)} ${pu(i)}`)
  return MODELS.map((m) => {
    const d = SETS.map((s, i) => (R[m.k][s.k] ? pt(i, R[m.k][s.k][0]) : null)).filter(Boolean)
    const l = START[m.k]
    const lead = orient === 'h'
      ? `M -0.6 ${((l.y / PH) * 100).toFixed(2)} L ${pt(0, l.v)}`
      : `M ${pv(l.v)} ${(-(14 + l.t * 22) / 6.4).toFixed(2)} L ${pt(0, l.v)}`
    return `<path class="cv-md-s is-${m.k} cv-md-lead" d="${lead}" /><path class="cv-md-s is-${m.k} cv-md-ln${m.early ? ' is-early' : ''}" d="M ${d.join(' L ')}" />`
  }).join('')
}

const points = () => MODELS.map((m) => SETS.map((s, i) => {
  const r = R[m.k][s.k]
  if (!r) return ''
  const edge = i === 0 ? ' is-l' : i >= SETS.length - 2 ? ' is-r' : ''
  return `<span class="cv-md-pt cv-md-s is-${m.k}${m.early ? ' is-early' : ''}${edge}" style="--u:${pu(i)};--v:${pv(r[0])}">${marker(m.m)}<span class="cv-md-val">${pct(r[0])}</span>${tip(m, s, r)}</span>`
}).join('')).join('')

const key = () => `<fieldset class="cv-md-key">
          <legend>Show</legend>
          <label class="cv-md-k is-all"><input type="radio" name="cv-md-f" id="cv-md-f-all" checked /><span class="cv-md-k-name"><b>All models</b></span></label>
${MODELS.map((m) => `          <label class="cv-md-k is-${m.k}${m.early ? ' is-early' : ''}"><input type="radio" name="cv-md-f" id="cv-md-f-${m.k}" /><span class="cv-md-k-line">${marker(m.m)}</span>${logo(m.logo)}<span class="cv-md-k-name"><b>${m.name}</b><span>${m.by} · ${m.early ? 'early, n&nbsp;=&nbsp;20 per set' : m.n}</span><span>${m.cost}</span></span></label>`).join('\n')}
          <p class="cv-md-k is-jev">${marker('diamond')}<span class="cv-md-k-name"><b>Jev, published score</b><span>On its own samples, 77 to 2,000 items</span></span></p>
        </fieldset>`

const table = () => `<details class="cv-md-data">
        <summary>Every number in a table</summary>
        <div class="cv-md-tw">
          <table>
            <caption>Accuracy at each set's natural label mix (Yelp: plain accuracy), with the 95% range and n. Run ${DATE}. Paid models are early, n = 20 per set.</caption>
            <thead><tr><th scope="col">Model</th>${SETS.map((s) => `<th scope="col">${s.name}</th>`).join('')}</tr></thead>
            <tbody>
${MODELS.map((m) => `              <tr><th scope="row">${m.name}${m.early ? ' <span>(early)</span>' : ''}</th>${SETS.map((s) => {
    const r = R[m.k][s.k]
    return r ? `<td><b>${pct(r[0])}</b><span>${range(r)}</span><span>n = ${r[3]}</span></td>` : '<td><span>not run</span></td>'
  }).join('')}</tr>`).join('\n')}
              <tr class="is-jev"><th scope="row">Jev (published)</th>${SETS.map((s) => `<td>${s.jev == null ? '<span>none</span>' : `<b>${s.jev}%</b>`}</td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
      </details>`

// Speed chart: log x from 120 ms to 1,500 ms, y 20% to 100% so every n = 20 range fits.
const SX0 = 120, SX1 = 1500, SY0 = 20
const sx = (ms) => +((Math.log(ms / SX0) / Math.log(SX1 / SX0)) * 100).toFixed(2)
const sy = (v) => +(((100 - v) / (100 - SY0)) * 100).toFixed(2)
// Label side per point, desktop then mobile: r right, l left, t above, b below.
const SIDE = { gemini: 'l l', groq: 'r t', haiku: 'l l', mini: 'l l', o4mini: 'l l', nano: 'l l', jev: 'r l' }
const side = (k) => SIDE[k].split(' ').map((s, i) => ` ${i ? 'm' : 'd'}-${s}`).join('')

const speed = () => `<figure class="cv-md-fig cv-md-sp">
        <figcaption>
          <h3>Accuracy and speed on PhishNChips</h3>
          <p class="cv-md-meta">Median time per decision (log scale) · run ${DATE} · vertical lines are the 95% range</p>
        </figcaption>
        <div class="cv-md-sc">
          <div class="cv-md-sc-plot">
            <span class="cv-md-sc-zone" style="width:${sx(JEV_MS)}%;height:${sy(62.6)}%"><i>Faster and more accurate than Jev</i></span>
${[20, 40, 60, 80, 100].map((t) => `            <i class="cv-md-sc-yt" style="top:${sy(t)}%">${t}%</i>`).join('\n')}
${[200, 500, 1000].map((t) => `            <i class="cv-md-sc-xt" style="left:${sx(t)}%">${t.toLocaleString('en-US')} ms</i>`).join('\n')}
${MODELS.map((m) => {
    const r = R[m.k].phish
    return `            <span class="cv-md-sc-w cv-md-s is-${m.k}" style="left:${sx(SPEED[m.k])}%;top:${sy(r[2])}%;height:${(sy(r[1]) - sy(r[2])).toFixed(2)}%"></span>
            <span class="cv-md-sc-pt cv-md-s is-${m.k}${m.early ? ' is-early' : ''}${side(m.k)}" style="left:${sx(SPEED[m.k])}%;top:${sy(r[0])}%">${marker(m.m)}<span class="cv-md-sc-lab">${logo(m.logo)}<span class="cv-md-sc-name">${m.name}</span><span class="cv-md-sc-short" aria-hidden="true">${m.short}</span> <b>${pct(r[0])}</b> <span class="cv-md-sc-ms">${SPEED[m.k].toLocaleString('en-US')} ms</span></span><span class="cv-md-tip" role="tooltip"><b>${m.name}</b> · PhishNChips<br>${pct(r[0])} (95% range ${range(r)}), n&nbsp;=&nbsp;${r[3]}${m.early ? ', early' : ''}<br>Median ${SPEED[m.k].toLocaleString('en-US')} ms per decision</span></span>`
  }).join('\n')}
            <span class="cv-md-sc-pt is-jev${side('jev')}" style="left:${sx(JEV_MS)}%;top:${sy(62.6)}%">${marker('diamond')}<span class="cv-md-sc-lab"><span class="cv-md-sc-name">Jev</span> <b>62.6%</b> <span class="cv-md-sc-ms">${JEV_MS} ms</span></span><span class="cv-md-tip" role="tooltip"><b>Jev</b> · PhishNChips<br>62.6% on 2,000 emails (published)<br>Median ${JEV_MS} ms, measured by a third party</span></span>
          </div>
        </div>
        <p class="cv-md-note">qwen3.8-27b on Groq is faster and more accurate than Jev on this set: 72.8% in a median 178 ms, against 62.6% in 239 ms (n = 100). Gemini is the most accurate and the slowest. Every other model is slower than Jev.</p>
      </figure>`

const TRUST = [
  ['Public test sets.', 'All eight sets are public, so anyone can check what was asked: PhishNChips, BANKING77, OpenBookQA, CommonsenseQA, HellaSwag, AITA, BoolQ and Yelp reviews.'],
  ['A fixed sample.', 'Rows are drawn with a fixed random seed, not picked by hand, and balanced across the answers.'],
  ['The n and the range, every time.', 'Each score carries its sample size and its 95% range. Accuracy is reweighted to each set\'s real mix of answers, the way a published score is measured. Paid models ran 20 rows per set, so we mark them early: at n = 20 the range is about 20 points either way.'],
  ['Jev\'s published numbers.', 'Jev\'s scores are the ones published for it, on different samples (77 to 2,000 items). Compare with care. We call it a win only when the low end of Curva\'s range is above Jev\'s score.'],
  ['Where Jev is ahead, too.', `Jev leads on AITA, on OpenBookQA against Groq, on raw calibration for BoolQ and the multiple-choice sets, and on speed against every model but Groq. <a href="${VS}">Curva vs Jev, every number ↗</a>`],
]

export const html = () => `<section class="cv-scene cv-models" data-scene="models" aria-labelledby="cv-md-title">
  <div class="cv-md-in">
    <header class="cv-md-head">
      <h2 id="cv-md-title">Curva works with the model you already use.</h2>
      <p class="cv-md-lede">We ran eight public test sets through Curva with six models from four providers. Each line is one model. The pink diamonds are Jev's published scores.</p>
    </header>

    <figure class="cv-md-fig cv-md-acc">
      <figcaption>
        <h3>Accuracy by model, test set by test set</h3>
        <p class="cv-md-meta">Run ${DATE} · share of right answers at each set's natural mix (Yelp: plain) · solid: n = 69 to 127 · dashed and hollow: early, n = 20</p>
      </figcaption>
      ${key()}
      <div class="cv-md-chart">
        <div class="cv-md-plot" role="img" aria-label="Line chart of accuracy for six models on eight test sets, with Jev's published score per set. The table below has every number.">
${[40, 50, 60, 70, 80, 90, 100].map((t) => `          <i class="cv-md-yt" style="--v:${pv(t)}">${t}%</i>`).join('\n')}
          <div class="cv-md-series">
            <svg class="cv-md-lines is-h" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${lines('h')}</svg>
            <svg class="cv-md-lines is-v" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${lines('v')}</svg>
            ${points()}
          </div>
${SETS.map((s, i) => (s.jev == null ? '' : `          <span class="cv-md-jev" style="--u:${pu(i)};--v:${pv(s.jev)}">${marker('diamond')}<span class="cv-md-tip" role="tooltip"><b>Jev</b> · ${s.name}<br>${s.jev}%, its published score</span></span>`)).join('\n')}
          <ol class="cv-md-starts">
${MODELS.map((m) => `            <li class="cv-md-s is-${m.k}" style="--ly:${START[m.k].y.toFixed(1)}px;--v:${pv(START[m.k].v)};--t:${START[m.k].t}">${logo(m.logo)}<span>${m.name}</span></li>`).join('\n')}
          </ol>
          <ol class="cv-md-sets">
${SETS.map((s, i) => `            <li style="--u:${pu(i)}"><b>${s.name}</b><span>${s.what}</span><span class="cv-md-sets-jev">${s.jev == null ? 'No Jev score' : `Jev ${s.jev}%`}</span></li>`).join('\n')}
          </ol>
        </div>
      </div>
      <ul class="cv-md-reads">
        <li><b>PhishNChips:</b> both free models beat Jev's 62.6%. Gemini scores 80.8% (73% to 89%), qwen3.8-27b on Groq 72.8% (64% to 82%), n = 100 each.</li>
        <li><b>BANKING77, OpenBookQA, CommonsenseQA, HellaSwag and BoolQ:</b> the best free model matches Jev, within the margin.</li>
        <li><b>AITA:</b> Jev is ahead, at 75.4% against Gemini's 67.2% (within the margin) and Groq's 55.7%.</li>
      </ul>
      ${table()}
    </figure>

    <div class="cv-md-pair">
      ${speed()}
      <section class="cv-md-trust" aria-labelledby="cv-md-trust-title">
        <h3 id="cv-md-trust-title">Why you can trust these numbers</h3>
        <ol>
${TRUST.map(([b, t]) => `          <li><b>${b}</b> ${t}</li>`).join('\n')}
        </ol>
      </section>
    </div>

    <p class="cv-md-foot">Cost per 1,000 decisions is what each provider charged across 160 decisions per paid model, 20 on each of the eight sets (2026-09-30). Gemini and Groq ran on their free tiers, within the daily limits. Two more free models ran on PhishNChips only (gpt-oss-20b, n = 36; Nemotron 3 Super, n = 20) and are not charted. Model and company names and logos belong to their owners.</p>
  </div>
</section>`

// Scroll-scrubbed: the model lines draw across the sets (Jev's diamonds are already there), then the speed
// chart's ranges grow and its points settle. Pre-motion states live under html.cv-motion in models.css.
export function init(el, { gsap }) {
  const series = el.querySelector('.cv-md-series')
  gsap.fromTo(series, { '--r': 0 }, { '--r': 1, ease: 'none', scrollTrigger: { trigger: el.querySelector('.cv-md-plot'), start: 'top 85%', end: 'bottom 55%', scrub: 1 } })
  gsap.fromTo(el.querySelectorAll('.cv-md-starts li'), { opacity: 0 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el.querySelector('.cv-md-plot'), start: 'top 90%', end: 'top 60%', scrub: 1 } })
  const sc = el.querySelector('.cv-md-sc-plot')
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sc, start: 'top 88%', end: 'bottom 70%', scrub: 1 } })
  tl.fromTo(sc.querySelectorAll('.cv-md-sc-w'), { scaleY: 0 }, { scaleY: 1, stagger: 0.08, duration: 1 }, 0)
    .fromTo(sc.querySelectorAll('.cv-md-sc-pt'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.08, duration: 1 }, 0.2)
}
