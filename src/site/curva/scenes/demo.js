// Scene "demo" (BLUE): one ticket, two outputs side by side. Left: what a raw LLM call hands back (a sentence).
// Right: Curva's response, byte-exact from Content Box/3 Use cases/ai-agents.md ("What Curva returns"), with its
// probabilities as a small bar chart. Ticket: 2 How to use/how-to-use.md step 4. Raw prompt and reply wording:
// 3 Use cases/support-triage.md and ai-agents.md ("The problem"). Notes: 1 Product/what-is-curva.md; nuance:
// 1 Product/faq.md Q5 and Q9, how-it-works.md (Calibration), how-to-use.md ("Real numbers depend on the model").
export const id = 'demo'

const TICKET = 'I was charged twice for order A-104. Please refund the duplicate!'
const JSON_OUT = `{"decision_id": "dec_…", "answers": {
  "department": {"choice": "billing", "probabilities": {"billing": 0.97, "technical": 0.02, "sales": 0.01, "none_of_these": 0.0},
                 "confidence": 0.97, "abstain": false, "calibrated": false},
  "refund": {"noul": 0.93, "calibrated": false}}}`
const BARS = [['billing', '0.97'], ['technical', '0.02'], ['sales', '0.01'], ['none_of_these', '0.0']] // as printed in the JSON

const RAW_NOTES = [
  'A sentence. Your code has to parse it and hope it named a team that exists.',
  '“Fairly sure” is not a number you can set a threshold on.',
  'Reorder the options and many models change their answer.',
]
const CV_NOTES = [
  '<code>choice</code> is always one of your labels, checked before it reaches you.',
  'A probability for every option, including <code>none_of_these</code> for “none of them fit”.',
  '<code>abstain</code> turns <code>true</code> below the confidence you set (0.8 here), so a person can take it.',
  '<code>refund</code> is a second question, answered in the same call: P(yes) is 0.93.',
]

export const html = ({ esc }) => `<section class="cv-scene cv-demo" data-scene="demo" aria-labelledby="cv-dm-title">
  <div class="cv-dm-in">
    <h2 id="cv-dm-title">Curva vs a raw LLM call, side by side.</h2>
    <p class="cv-dm-lede">One support ticket and one question: which team should handle it? Here is what each one hands back to your code.</p>

    <p class="cv-dm-ticket"><span>ticket</span><q>${esc(TICKET)}</q></p>

    <div class="cv-dm-grid">
      <article class="cv-dm-side cv-dm-raw">
        <h3>A raw LLM call</h3>
        <p class="cv-dm-prompt"><span>Prompt</span>Which team should handle this ticket? Reply with one of billing, technical, sales.</p>
        <blockquote class="cv-dm-reply"><p>This looks like a billing issue, fairly sure.</p></blockquote>
        <ul class="cv-dm-notes">${RAW_NOTES.map((t) => `\n          <li>${esc(t)}</li>`).join('')}
        </ul>
      </article>

      <article class="cv-dm-side cv-dm-cv">
        <h3>Curva</h3>
        <pre class="cv-dm-json"><code>${esc(JSON_OUT)}</code></pre>
        <figure class="cv-dm-bars">
          <figcaption>Probability for each team, from the response above</figcaption>
          <ul>${BARS.map(([k, p]) => `\n            <li><code>${k}</code><span class="cv-dm-track"><i style="--p:${p}"></i></span><b>${p}</b></li>`).join('')}
          </ul>
        </figure>
        <ul class="cv-dm-notes">${CV_NOTES.map((t) => `\n          <li>${t}</li>`).join('')}
        </ul>
      </article>
    </div>

    <p class="cv-dm-nuance"><b>Nuance.</b> The ticket and the numbers are the docs’ example; real numbers depend on the model you choose. A probability matches how often Curva is right only once that exact question is calibrated: after 30 feedback labels, and only if the calibrator beats the raw numbers on held-out labels. Until then you get the model’s own probabilities, debiased, which is what <code>calibrated: false</code> says. Debiasing asks in two option orders, so it costs two model calls unless you set <code>debias: "auto"</code>.</p>
  </div>
</section>`

// Scroll-scrubbed: the probability bars grow to their values as the Curva side comes into view.
export function init(el, { gsap }) {
  const bars = el.querySelectorAll('.cv-dm-track i')
  gsap.fromTo(bars, { scaleX: 0 }, {
    scaleX: (i, b) => +b.style.getPropertyValue('--p'), ease: 'none', stagger: 0.15,
    scrollTrigger: { trigger: el.querySelector('.cv-dm-bars'), start: 'top 92%', end: 'top 55%', scrub: 0.6 },
  })
}
