// /curva/vs-jev/: Curva vs Jev, every number. Static (no motion), server-rendered so search engines read every
// figure as text. Facts only from curva/Content Box/4 Benchmarks/benchmarks.md and curva-vs-jev.md (runs
// 2026-10-01, cost 2026-09-30); Jev links from Content Box/Jev reference/Sources.md. Named per founder decision
// 2026-10-02. Rules kept: a win only where benchmarks.md marks win; ties say "matches" or "within margin";
// Jev's numbers are its published ones on different samples; paid-model n = 20 rows only as "early".
export const VJ_PATH = '/curva/vs-jev/'
export const VJ_UPDATED = '2026-10-02'
export const VJ_META = {
  title: 'Curva vs Jev: benchmarks, calibration, speed and cost',
  description: 'Curva vs Jev on public benchmarks: accuracy, calibration, speed and cost, with the n for every number. A free, self-hosted Jev alternative for calibrated LLM decisions.',
}

const DATE = '2026-10-01'
const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'
const GEM = 'Gemini flash-lite'
const GROQ = 'Groq qwen3.8-27b'
const JEV_IMG = (s = 18) => `<img class="vj-jev" src="/compare/jev-logo.svg" alt="" width="${s}" height="${s}" />`
const CURVA_IMG = (s = 22) => `<img class="vj-curva" src="/products/curva.png" alt="" width="${s}" height="${s}" />`

const SRC = {
  launch: ['TypeSafe launch post', 'https://typesafe.ai/blog/introducing-system-one-models-and-jev'],
  docs: ['Jev docs', 'https://docs.typesafe.ai/concepts/system-one'],
  evals: ['TypeSafe evals', 'https://evals.typesafe.ai'],
  phish: ['jev-phishing-bench (PhishNChips, 2,000 emails)', 'https://github.com/anisselbd/jev-phishing-bench'],
  bank: ['llmevals: Jev on BANKING77 (77 items)', 'https://sanand0.github.io/llmevals/jev'],
  ood: ['jev-ood-calibration (OpenBookQA, CommonsenseQA, HellaSwag)', 'https://github.com/scienthoon/jev-ood-calibration'],
  aita: ['jev-aita (AITA, 770 posts)', 'https://github.com/dchristopoulos/jev-aita'],
  frontier: ['jev-frontier-bench (4-set average and cost per 1,000)', 'https://github.com/manjunathshiva/jev-frontier-bench'],
  molas: ['Alex Molas: "Jev can\'t be calibrated"', 'https://www.alexmolas.com/2026/09/23/jev-cant-be-calibrated.html'],
  agentconn: ['AgentConn review', 'https://agentconn.com/blog/jev-typesafe-new-agent-layer-if-calibration-holds/'],
  devto: ['dev.to guide to Jev', 'https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e'],
}

// The four measured wins (benchmarks.md section 1), n = 100 each.
const WINS = [
  { num: '80.8%', vs: '62.6%', what: 'Accuracy: how often it picks the right answer', model: GEM, extra: '95% range 73% to 89%' },
  { num: '0.138', vs: '0.154', what: 'Calibration error: how far confidence is from reality, lower is better', model: GEM, extra: 'unchanged after tuning' },
  { num: '72.8%', vs: '62.6%', what: 'Accuracy, on a fast free model', model: GROQ, extra: '95% range 64% to 82%' },
  { num: '178 ms', vs: '239 ms', what: 'Typical response time (median)', model: GROQ, extra: '' },
]

// Every free-model row with a Jev number (benchmarks.md section 4). v: accuracy with 95% range; ece: before /
// after tuning (held-out); ms: median. r: win | match | margin | behind.
const ROWS = [
  { set: 'PhishNChips', model: GEM, n: 100, v: 80.8, lo: 73, hi: 89, b: 62.6, r: 'win', ece: '0.138 / 0.138', jece: '0.154', ms: '1,146', jms: '239' },
  { set: 'PhishNChips', model: GROQ, n: 100, v: 72.8, lo: 64, hi: 82, b: 62.6, r: 'win', ece: '0.283 / 0.209', jece: '0.154', ms: '178', jms: '239' },
  { set: 'BANKING77', model: GEM, n: 120, v: 79.8, lo: 73, hi: 87, b: 75.3, r: 'match', ece: '0.097 / 0.097', jece: 'not published', ms: '1,362', jms: 'not published' },
  { set: 'BANKING77', model: GROQ, n: 69, v: 74.7, lo: 64, hi: 85, b: 75.3, r: 'margin', ece: '0.252 / 0.157', jece: 'not published', ms: '351', jms: 'not published' },
  { set: 'BoolQ', model: GEM, n: 127, v: 88.9, lo: 83, hi: 94, b: 89.7, r: 'match', ece: '0.081 / 0.081', jece: '0.038', ms: '1,071', jms: 'not published' },
  { set: 'OpenBookQA', model: GEM, n: 100, v: 92.2, lo: 87, hi: 97, b: 94.2, r: 'match', ece: '0.056 / 0.056', jece: '0.024', ms: '1,013', jms: 'not published' },
  { set: 'OpenBookQA', model: GROQ, n: 100, v: 85.0, lo: 78, hi: 92, b: 94.2, r: 'behind', ece: '0.051 / 0.051', jece: '0.024', ms: '207', jms: 'not published' },
  { set: 'CommonsenseQA', model: GROQ, n: 100, v: 84.0, lo: 77, hi: 91, b: 88.1, r: 'match', ece: '0.066 / 0.066', jece: '0.032', ms: '230', jms: 'not published' },
  { set: 'CommonsenseQA', model: GEM, n: 100, v: 82.0, lo: 74, hi: 90, b: 88.1, r: 'margin', ece: '0.118 / 0.118', jece: '0.032', ms: '1,263', jms: 'not published' },
  { set: 'HellaSwag', model: GROQ, n: 100, v: 86.0, lo: 79, hi: 93, b: 86.1, r: 'match', ece: '0.085 / 0.085', jece: '0.029', ms: '209', jms: 'not published' },
  { set: 'HellaSwag', model: GEM, n: 98, v: 78.6, lo: 70, hi: 87, b: 86.1, r: 'margin', ece: '0.032 / 0.032', jece: '0.029', ms: '1,173', jms: 'not published' },
  { set: 'AITA', model: GEM, n: 100, v: 67.2, lo: 58, hi: 76, b: 75.4, r: 'margin', ece: '0.404 / 0.149', jece: 'not published', ms: '1,318', jms: '390' },
  { set: 'AITA', model: GROQ, n: 100, v: 55.7, lo: 46, hi: 65, b: 75.4, r: 'behind', ece: '0.475 / 0.221', jece: 'not published', ms: '265', jms: '390' },
]
const VERDICT = { win: 'Curva wins', match: 'matches', margin: 'within margin', behind: 'Jev ahead' }
const MIN = 40 // chart domain 40% to 100%: every value and range fits
const at = (x) => `${(((x - MIN) / (100 - MIN)) * 100).toFixed(2)}%`

// Feature comparison (curva-vs-jev.md section 4), Jev cells only where a public source backs them.
const FEATURES = [
  ['The model', 'Any OpenAI-compatible model: OpenAI, Anthropic, Gemini, Groq, DeepSeek, Mistral, OpenRouter, or local Ollama, vLLM, LM Studio, llama.cpp. Mix them in one request.', 'One closed model, Jev. Architecture, weights and paper undisclosed.', 'launch'],
  ['Where it runs', 'Your servers: one binary with SQLite, or Docker. Your data stays with you.', "TypeSafe's hosted API, served from the US West Coast.", 'launch'],
  ['Price', 'Free to use, also commercially. You pay only your model provider, and free models work.', '$0.042 per 1M input tokens, output free (self-reported).', 'launch'],
  ['Answer types', 'Choice (2 to 255 options), Score (2 to 20 levels), yes/no, multi-select, text, number, integer.', 'Choice (up to 255 options), Score (2 to 10 levels), yes/no probability.', 'docs'],
  ['Images', 'Up to 8 per decision, with vision models.', 'Text only.', 'docs'],
  ['When unsure', 'A "none of these" option by default. Below your threshold it says it is not sure, so a person decides. Or a short list that holds the right answer 95% of the time.', 'No "none of these" option. In one test, 7 of 53 answers reached 0.9 confidence.', 'agentconn'],
  ['Confidence on your data', 'Tuned from your corrections, per question. Kept only when it helps on rows it did not learn from.', 'Fixed at training (self-reported). In one test a fair coin came out 0.92 heads.', 'molas'],
  ['Linked questions', 'One question can depend on another (depends_on, when), plus rules and per-question reasoning.', 'Not in Jev\'s docs.', 'docs'],
  ['Several models', 'Fallback, council, cascade and race across models.', 'One model.', 'launch'],
  ['Audit', 'An audit log for every decision, and which input fields moved the answer.', 'No reason returned with a decision.', 'agentconn'],
  ['Versions', 'Pinned configs. You move curva-latest yourself.', 'jev-latest moves to new releases; a pinned version is available.', 'docs'],
  ['Typical speed', '178 ms on Groq (PhishNChips, n = 100). 720 ms to 13,373 ms on other models. Repeat decisions come from a cache at $0.', '70 to 500 ms (self-reported). 239 ms measured on PhishNChips.', 'phish'],
  ['Input size', 'Up to 150,000 characters of input. The total limit is your model\'s.', '64k tokens; input plus the longest question within 32k.', 'docs'],
  ['SDKs', 'Python (sync and async), TypeScript, n8n node, MCP server, OpenAPI.', 'Python and TypeScript.', 'docs'],
]

const COST = [
  ['Gemini flash-lite', '$0', 'free tier, about 250 decisions a day'],
  ['Groq qwen3.8-27b', '$0', 'free tier, about 180 decisions a day'],
  ['gpt-4.1-nano', '$0.078', '$0.055 on PhishNChips'],
  ['gpt-4o-mini', '$0.118', '$0.083 on PhishNChips'],
  ['gpt-4.1-mini', '$0.314', '$0.223 on PhishNChips'],
  ['Claude Haiku 4.5', '$1.64', '$1.29 on PhishNChips'],
  ['Any model, repeat decision', '$0', 'served from the cache'],
]

// curva-vs-jev.md section 6, plus the AITA Brier scores from benchmarks.md section 4.
const AHEAD = [
  ['Response time on every model but Groq', '720 ms to 13,373 ms on PhishNChips; 765 ms to 2,002 ms on AITA (n = 20 to 100)', '239 ms (PhishNChips); 390 ms (AITA)'],
  ['Calibration error on BoolQ and multiple-choice sets', '0.032 to 0.118 (Gemini, Groq; n = 98 to 127)', '0.024 to 0.038'],
  ['Phishing calibration error on Groq', '0.209 after tuning, 0.283 before (n = 100)', '0.154'],
  ['OpenBookQA accuracy on Groq', '85.0%, range 78% to 92% (n = 100)', '94.2%'],
  ['AITA accuracy', 'Groq 55.7%, range 46% to 65% (n = 100); OpenAI small models about 41% (early, n = 20 each)', '75.4%'],
  ['AITA Brier score (lower is better)', 'Gemini 0.878, Groq 1.042 (n = 100)', '0.369'],
  ['Cost per decision on paid models', '$0.078 (gpt-4.1-nano) to $1.64 (Claude Haiku 4.5) per 1,000', '$0.025 per 1,000 (third-party, 4-set bench)'],
  ['Size of the evidence', '20 to 127 rows per result', '77 to 2,000 items per published number'],
]

const link = ([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${label} ↗</a>`
const scroll = (label, inner) => `<div class="vj-scroll" role="region" aria-label="${label}" tabindex="0">${inner}</div>`

export const vsJevMain = ({ esc }) => `<div class="cv cv-vj">
<header class="vj-hero">
  <div class="vj-in">
    <nav class="vj-crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/curva/">Curva</a></li><li aria-current="page">Curva vs Jev</li></ol></nav>
    <h1>Curva vs Jev: benchmarks, calibration, speed and cost</h1>
    <p class="vj-lede">Both make an AI pick from your options and tell you how sure it is. Here is how they compare on public test sets, with the model, sample size and date next to every number.</p>
    <ul class="vj-who">
      <li>${CURVA_IMG()}<p><b>Curva</b> is a free server you run yourself. It gets typed answers with a probability for every option from any LLM you choose, and tunes that confidence from your corrections.</p></li>
      <li>${JEV_IMG()}<p><b>Jev</b> is TypeSafe AI's "System One" model: one trained, closed model behind a hosted API that returns typed answers with probabilities.</p></li>
    </ul>
    <p class="vj-sum">With Curva, you use the AI API key you already have (OpenAI, Anthropic, Gemini, Groq, OpenRouter, or a local model), add a few lines of code, and your AI makes quick decisions you can trust. Curva itself is free.</p>
    <p class="vj-sum">In short: Curva is ahead on PhishNChips accuracy, calibration and speed (n = 100). It matches Jev on five more test sets. Jev is ahead on response time with most models, on calibration error for multiple-choice sets, on AITA, and on cost per decision with paid models.</p>
    <p class="vj-btns"><a class="vj-btn" href="/curva/#start">Try Curva</a><a class="vj-btn vj-btn-ghost" href="#jev-ahead">Where Jev is ahead</a></p>
    <p class="vj-date">Benchmarks run ${DATE}. Page updated <time datetime="${VJ_UPDATED}">October 2, 2026</time>.</p>
  </div>
</header>

<section class="vj-sec" aria-labelledby="vj-wins">
  <div class="vj-in">
    <h2 id="vj-wins">Where Curva beats Jev</h2>
    <p class="vj-p">Measured wins only: Curva's whole 95% range sits above Jev's published number, or the benchmark record marks it a win. All on PhishNChips, a public phishing email set, n = 100, run ${DATE}.</p>
    <ul class="vj-wins">
${WINS.map((w) => `      <li>
        <p class="vj-num">${w.num}</p>
        <p class="vj-vs">${JEV_IMG(14)}Jev ${w.vs}</p>
        <h3>${esc(w.what)}</h3>
        <p class="vj-meta">${esc(w.model)} · PhishNChips · n = 100 · ${DATE}${w.extra ? ` · ${esc(w.extra)}` : ''}</p>
      </li>`).join('\n')}
    </ul>
    <p class="vj-note">Also ahead, too small or narrow to lead with: on AITA, Groq's typical response time is 265 ms vs Jev's 390 ms (n = 100), but its AITA accuracy is behind.</p>
  </div>
</section>

<section class="vj-sec" aria-labelledby="vj-chart">
  <div class="vj-in">
    <h2 id="vj-chart">Accuracy on every test set</h2>
    <p class="vj-p">The dot is Curva's accuracy; the bar is its 95% range, where the true score likely sits at this sample size. The outlined mark is Jev's published number.</p>
    <figure class="vj-chart">
      <figcaption>
        <ul class="vj-legend">
          <li><i class="k-win"></i>Curva, win</li>
          <li><i class="k-tie"></i>Curva, other results</li>
          <li><i class="k-range"></i>95% range</li>
          <li><i class="k-jev"></i>${JEV_IMG(14)}Jev (published)</li>
        </ul>
      </figcaption>
      <div class="vj-axis" aria-hidden="true"><span></span><span>${[40, 50, 60, 70, 80, 90, 100].map((t) => `<i style="left:${at(t)}">${t}%</i>`).join('')}</span><span></span></div>
      <ol class="vj-rows">
${ROWS.map((r) => `        <li class="is-${r.r}" title="${esc(`${r.set}, ${r.model}, n = ${r.n}: Curva ${r.v.toFixed(1)}% (${r.lo}% to ${r.hi}%), Jev ${r.b}%, ${VERDICT[r.r]}`)}">
          <p class="vj-set"><b>${esc(r.set)}</b><span>${esc(r.model)} · n = ${r.n}</span></p>
          <div class="vj-plot" role="img" aria-label="${esc(`${r.set}, ${r.model}: Curva ${r.v.toFixed(1)}%, 95% range ${r.lo}% to ${r.hi}%, Jev published ${r.b}%, ${VERDICT[r.r]}`)}">
            <span class="vj-band" style="left:${at(r.lo)};width:calc(${at(r.hi)} - ${at(r.lo)})"></span>
            <span class="vj-jevmark" style="left:${at(r.b)}"></span>
            <span class="vj-dot" style="left:${at(r.v)}"></span>
          </div>
          <p class="vj-val"><b>${r.v.toFixed(1)}%</b><span>Jev ${r.b}%</span><em>${VERDICT[r.r]}</em></p>
        </li>`).join('\n')}
      </ol>
      <p class="vj-meta">Curva runs ${DATE}, free models, n = 69 to 127 per row. "Matches": Jev's number is inside Curva's range. "Within margin": also inside, but Curva's score is clearly lower, so too close to call at this sample size.</p>
    </figure>
  </div>
</section>

<section class="vj-sec" aria-labelledby="vj-table">
  <div class="vj-in">
    <h2 id="vj-table">Every number, side by side</h2>
    <p class="vj-p">Calibration error measures how far stated confidence is from how often the answer is right; lower is better. "After tuning" is measured on rows the tuning did not see, which is what you get once your corrections flow in.</p>
    ${scroll('Full benchmark table, Curva vs Jev', `<table class="vj-tbl vj-tbl-wide">
      <caption>Curva vs Jev, all free-model results, run ${DATE}</caption>
      <thead><tr><th scope="col">Test set</th><th scope="col">Curva model</th><th scope="col">n</th><th scope="col">Curva accuracy (95% range)</th><th scope="col">${JEV_IMG(14)}Jev accuracy</th><th scope="col">Result</th><th scope="col">Curva calibration error, before / after tuning</th><th scope="col">Jev calibration error</th><th scope="col">Curva typical time (ms)</th><th scope="col">Jev typical time (ms)</th></tr></thead>
      <tbody>
${ROWS.map((r) => `        <tr class="is-${r.r}"><th scope="row">${esc(r.set)}</th><td>${esc(r.model)}</td><td>${r.n}</td><td><b>${r.v.toFixed(1)}%</b> (${r.lo}% to ${r.hi}%)</td><td>${r.b}%</td><td>${VERDICT[r.r]}</td><td>${r.ece}</td><td>${r.jece}</td><td>${r.ms}</td><td>${r.jms}</td></tr>`).join('\n')}
      </tbody>
    </table>`)}
    <p class="vj-note">On PhishNChips, Gemini's calibration error (0.138) and Groq's response time (178 ms) are wins; Groq's calibration error (0.209 after tuning) is behind Jev's 0.154. Jev publishes no calibration error for AITA; its AITA Brier score is 0.369 against Curva's 0.878 (Gemini) and 1.042 (Groq). Paid models (gpt-4.1-nano, gpt-4o-mini, gpt-4.1-mini, Claude Haiku 4.5) ran only 20 rows per set, too early to compare, so they are left out of this table.</p>
  </div>
</section>

<section class="vj-sec" aria-labelledby="vj-features">
  <div class="vj-in">
    <h2 id="vj-features">Features: Curva vs Jev</h2>
    <table class="vj-tbl vj-tbl-feat">
      <caption>What each one offers, from Curva's docs and Jev's public sources</caption>
      <thead><tr><th scope="col"><span class="vj-sr">Area</span></th><th scope="col">${CURVA_IMG(16)}Curva</th><th scope="col">${JEV_IMG(14)}Jev</th></tr></thead>
      <tbody>
${FEATURES.map(([k, c, j, s]) => `        <tr><th scope="row">${esc(k)}</th><td data-k="Curva">${esc(c)}</td><td data-k="Jev">${esc(j)} <a class="vj-cite" href="${SRC[s][1]}" target="_blank" rel="noopener">${esc(SRC[s][0])} ↗</a></td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>

<section class="vj-sec" aria-labelledby="vj-cost">
  <div class="vj-in">
    <h2 id="vj-cost">Cost per 1,000 decisions</h2>
    <p class="vj-p">Curva is free to use and runs on your servers, so there is no per-call fee to Tarkova. You pay your model provider. Each decision is two model calls by default (the options are asked in both orders).</p>
    <div class="vj-cost">
      <table class="vj-tbl">
        <caption>${CURVA_IMG(16)}Curva, measured 2026-09-30: 160 decisions per model, 20 on each of 8 public sets</caption>
        <thead><tr><th scope="col">Model</th><th scope="col">Per 1,000 decisions</th><th scope="col">Note</th></tr></thead>
        <tbody>
${COST.map(([m, c, n]) => `          <tr><th scope="row">${esc(m)}</th><td><b>${esc(c)}</b></td><td>${esc(n)}</td></tr>`).join('\n')}
        </tbody>
      </table>
      <table class="vj-tbl">
        <caption>${JEV_IMG(14)}Jev, published</caption>
        <thead><tr><th scope="col">Figure</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead>
        <tbody>
          <tr><th scope="row">List price</th><td><b>$0.042</b> per 1M input tokens, output free (self-reported)</td><td>${link(SRC.launch)}</td></tr>
          <tr><th scope="row">Per 1,000 decisions</th><td><b>$0.025</b> (third-party, 4-set bench)</td><td>${link(SRC.frontier)}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="vj-note">Plainly: on paid models, Curva costs more per decision than Jev's third-party figure (gpt-4.1-nano $0.078 vs $0.025 per 1,000). Curva is cheaper on free tiers within their daily limits, on repeat decisions (cache) and on questions your rules answer ($0). Curva figures are truncated, not rounded up.</p>
  </div>
</section>

<section class="vj-sec vj-ahead" id="jev-ahead" aria-labelledby="vj-ahead">
  <div class="vj-in">
    <h2 id="vj-ahead">Where Jev is ahead</h2>
    <p class="vj-p">Jev is one model trained for this job, and it shows on speed and on raw calibration. These are the gaps Curva is working on.</p>
    <table class="vj-tbl vj-tbl-feat">
      <caption>Gaps, Curva runs ${DATE}</caption>
      <thead><tr><th scope="col">Gap</th><th scope="col">Curva</th><th scope="col">${JEV_IMG(14)}Jev</th></tr></thead>
      <tbody>
${AHEAD.map(([k, c, j]) => `        <tr><th scope="row">${esc(k)}</th><td data-k="Curva">${esc(c)}</td><td data-k="Jev"><b>${esc(j)}</b></td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>

<section class="vj-sec" aria-labelledby="vj-method">
  <div class="vj-in vj-two">
    <div>
      <h2 id="vj-method">How we measured</h2>
      <ul class="vj-list">
        <li>Curva ran with option-order debiasing on, over public dataset rows sampled with a fixed seed. Samples are balanced across labels; accuracy is then weighted back to each label's share of the full public set, which is what a published accuracy measures.</li>
        <li>The 95% range is on that weighted accuracy. A win needs the whole range above Jev's number.</li>
        <li>Jev numbers are their published figures, on different samples, mostly measured by third parties. Compare with care.</li>
        <li>Free models ran 69 to 127 rows per set. Paid models ran 20 per set (early, about ±20 points), so they are not used as evidence here.</li>
        <li>Calibration after tuning: each half of the rows is tuned on the other half. Reported only from 30 rows up.</li>
        <li>Curva is closed source and free to use; we publish the datasets, models, sample sizes and dates rather than the harness. <a href="${DOCS}" target="_blank" rel="noopener">Curva docs ↗</a></li>
      </ul>
    </div>
    <div>
      <h2 id="vj-sources">Sources for Jev's numbers</h2>
      <ul class="vj-list vj-src">
${['launch', 'docs', 'evals', 'phish', 'bank', 'ood', 'aita', 'frontier', 'molas', 'agentconn', 'devto'].map((k) => `        <li>${link(SRC[k])}</li>`).join('\n')}
        <li>BoolQ: Nimble PUBLIC_BENCHMARKS boolq subset (89.7%, calibration error 0.038)</li>
      </ul>
    </div>
  </div>
</section>

<section class="vj-cta" aria-labelledby="vj-try">
  <div class="vj-in">
    <h2 id="vj-try">Try Curva on your own data</h2>
    <p>Use the AI API key you already have. Add Curva with a few lines of code. Your AI makes quick decisions you can trust, and Curva itself is free.</p>
    <pre><code>pip install curva-ai</code></pre>
    <p class="vj-btns"><a class="vj-btn vj-btn-light" href="/curva/#start">Get started</a><a class="vj-btn vj-btn-line" href="${DOCS}" target="_blank" rel="noopener">Read the docs ↗</a></p>
    <p class="vj-tm">Jev and TypeSafe are trademarks of their respective owners. Tarkova is not affiliated with them. Jev numbers are their published figures.</p>
  </div>
</section>
</div>`
