// Scene "workflows" (INK): one real flow, incident triage, as a three-stage diagram, its code byte-exact from
// Content Box/3 Use cases/incident-triage.md ("Example"), and the other workflow tools in one list.
// Facts: incident-triage.md; 1 Product/how-it-works.md (Rules, when and depends_on; Think; Plans); features.md
// (Workflows, Speed and cost); 3 Use cases/support-triage.md (the invoice rule); document-extraction.md;
// faq.md Q14 (counting and arithmetic). The 0.78 / stage 2 answer is the docs' example.
export const id = 'workflows'

const CODE = `from curva import Curva, Choice, Noul, Score

d = Curva().decide(alert, {
    "system": Choice("Which system is failing?", ["database", "api", "network"]),
    "severity": Score("How severe is the incident?", ["minor", "major", "critical"]).depends("system"),
    "deployment_related": Noul("Did a recent deployment cause it?").depends("system"),
    "rollback": Noul("Should the last deployment be rolled back now?", think=True)
        .depends("severity", "deployment_related"),
})`

// Stages are numbered as the API numbers them (`stage`, from 0).
const STAGES = [
  [{ k: 'system', q: 'Which system is failing?', a: 'database · api · network' }],
  [
    { k: 'severity', q: 'How severe is the incident?', a: 'minor · major · critical' },
    { k: 'deployment_related', q: 'Did a recent deployment cause it?', a: 'yes or no' },
  ],
  [{ k: 'rollback', q: 'Should the last deployment be rolled back now?', a: 'yes or no, with <code>think</code>', end: true }],
]

const TOOLS = [
  ['Rules', 'rules', 'Easy cases are answered on the spot, with no model call: “mentions an invoice, so billing”.'],
  ['Follow-ups', 'when · @key', 'Ask a question only when an earlier answer calls for it. Skipped questions are never sent or paid for.'],
  ['Cascade', 'cascade', 'A cheap model answers first. Only the questions it is unsure about go to the strong one.'],
  ['Council', 'council', 'Two to five models at once, their probabilities blended. Where they disagree, confidence drops.'],
  ['Extraction', 'Text · Number · Integer', 'Read the total from an invoice, then decide “reimbursable?” with it in view, in the same request.'],
]

const node = ({ k, q, a, end }) => `<li class="cv-wf-node${end ? ' is-end' : ''}"><code>${k}</code><p>${q}</p><span>${a}</span>${end ? '<b class="cv-wf-ans"><i>noul</i>0.78<i>stage</i>2</b>' : ''}</li>`

export const html = ({ esc }) => `<section class="cv-scene cv-workflows" data-scene="workflows" aria-labelledby="cv-wf-title">
  <div class="cv-wf-in">
    <h2 id="cv-wf-title">Multi-step LLM decision workflows, in one request.</h2>
    <p class="cv-wf-lede">Real decisions come in steps, and each answer depends on the one before. Curva runs the whole chain in one request, stage by stage. Each question sees the earlier answers and how sure they were.</p>

    <figure class="cv-wf-flow" aria-label="Incident triage in three stages">
      <figcaption>Incident triage: an alert fires, and four questions are answered in three stages.</figcaption>
      <ol class="cv-wf-stages">
${STAGES.map((s, i) => `        <li class="cv-wf-stage"><span class="cv-wf-num">stage ${i}</span><ul>${s.map(node).join('')}</ul></li>`).join('\n')}
      </ol>
    </figure>

    <div class="cv-wf-main">
      <div class="cv-wf-code">
        <h3>The whole flow is one call</h3>
        <pre><code>${esc(CODE)}</code></pre>
        <p>The rollback question gets <code>think=True</code>: the model reasons in its own call there, while the other questions answer fast. The decision is logged once.</p>
      </div>
      <div class="cv-wf-tools">
        <h3>What else a flow can use</h3>
        <dl>
${TOOLS.map(([n, k, t]) => `          <div><dt>${n} <code>${esc(k)}</code></dt><dd>${esc(t)}</dd></div>`).join('\n')}
        </dl>
      </div>
    </div>

    <p class="cv-wf-nuance"><b>Nuance.</b> A request runs at most 8 stages, and latency and cost add up across them. <code>think</code> is slower and costs the reasoning tokens, so keep it for the hard question. A council or a cascade means more model calls. And like the models it uses, Curva is bad at counting, arithmetic and comparing dates: compute those in code and put the result in the state.</p>
  </div>
</section>`

// Scroll-scrubbed: the stages light up in order along the rail, ending on the rollback answer.
export function init(el, { gsap }) {
  const flow = el.querySelector('.cv-wf-stages')
  const tl = gsap.timeline({ scrollTrigger: { trigger: flow, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 }, defaults: { ease: 'none' } })
  flow.querySelectorAll('.cv-wf-stage').forEach((s, i) => {
    tl.fromTo(s, { opacity: 0.25 }, { opacity: 1, duration: 1 }, i)
  })
  tl.fromTo(flow.querySelector('.cv-wf-ans'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6 })
}
