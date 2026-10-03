// Scene "typed" (PAPER): type safety as a feature explanation (Content Box has no measured number for it).
// Left: a Choice's label set plus the default none_of_these, and the TypeScript line byte-exact from
// Content Box/2 How to use/code-snippets.md. Right: extraction values checked against type and bounds, on the
// invoice from 3 Use cases/document-extraction.md (14.3 / 0.94 and the missing PO number are the docs' example).
// Facts: 1 Product/what-is-curva.md (The solution), how-it-works.md (steps 6 and 9, Question types),
// features.md, faq.md Q10, document-extraction.md, llm-output-qa.md (verdict has no escape option).
export const id = 'typed'

const TS = `d.answers.team.choice;     // "billing" | "technical" | "none_of_these", typed from the options`
const INVOICE = 'ACME Inc. / Invoice 2291 / 3 x Widget @ 4.10 / Shipping 2.00 / Total due 14.30 EUR'

// k: key, t: the declared type, v: what comes back, c: confidence, note, bad: the rejected case.
const CHECKS = [
  { k: 'total', t: 'Number, min=0', v: '14.3', c: '0.94', note: 'A number, inside its bounds.' },
  { k: 'po_number', t: 'Text, nullable', v: 'None', note: 'Not in the document, so it says so instead of making one up.' },
  { k: 'any value', t: 'wrong type or out of range', v: 'null', c: '0', note: 'Rejected. Never a silent bad value.', bad: true },
]

export const html = ({ esc }) => `<section class="cv-scene cv-typed" data-scene="typed" aria-labelledby="cv-ty-title">
  <div class="cv-ty-in">
    <h2 id="cv-ty-title">Type-safe LLM output: answers that always fit your types.</h2>
    <p class="cv-ty-lede">Curva never reads a label out of a sentence. It reads the probability of each label you declared, or asks for JSON limited to them, and checks every answer before it reaches you.</p>

    <div class="cv-ty-grid">
      <article class="cv-ty-panel">
        <h3>Choices: only your labels, plus a way out</h3>
        <ul class="cv-ty-labels" aria-label="The labels a Choice answer can take">
          <li>billing</li><li>technical</li><li class="is-escape">none_of_these<small>added by default</small></li>
        </ul>
        <p>The answer is always one of these keys. When none of your options fit, the model can say so with <code>none_of_these</code> instead of being forced into a wrong pick.</p>
        <p>In TypeScript, the answer’s type is built from your options, so a typo is a compile error:</p>
        <pre class="cv-ty-code"><code>${esc(TS)}</code></pre>
      </article>

      <article class="cv-ty-panel">
        <h3>Values: checked against their type and bounds</h3>
        <p class="cv-ty-doc"><span>invoice</span>${esc(INVOICE)}</p>
        <ol class="cv-ty-checks">
${CHECKS.map((r) => `          <li class="${r.bad ? 'is-bad' : 'is-ok'}">
            <p class="cv-ty-key"><code>${esc(r.k)}</code><span>${esc(r.t)}</span></p>
            <p class="cv-ty-val"><b>${esc(r.v)}</b>${r.c ? `<i>confidence ${r.c}</i>` : ''}</p>
            <p class="cv-ty-note">${esc(r.note)}</p>
          </li>`).join('\n')}
        </ol>
        <p>Text, Number and Integer questions each come back as a <code>value</code> with a <code>confidence</code>, so a cut-off works on extraction too.</p>
      </article>
    </div>

    <p class="cv-ty-nuance"><b>Nuance.</b> A valid type is not a right answer: a well-formed label can still be wrong, which is what the probabilities, <code>abstain</code> and calibration are for. <code>none_of_these</code> is on by default and you can turn it off; the LLM output QA recipe’s <code>verdict</code> has no escape option. Text, Number and Integer questions are answered in verbal mode. Keep arithmetic in code: ask for the numbers printed on the document, then add them up yourself.</p>
  </div>
</section>`

// Scroll-scrubbed: the three checks resolve in turn, each value appearing as its row is checked.
export function init(el, { gsap }) {
  const rows = el.querySelectorAll('.cv-ty-checks li')
  const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.cv-ty-checks'), start: 'top 85%', end: 'bottom 60%', scrub: 0.6 }, defaults: { ease: 'none' } })
  rows.forEach((row, i) => {
    tl.fromTo(row.querySelector('.cv-ty-val'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1 }, i)
      .fromTo(row.querySelector('.cv-ty-note'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, i + 0.5)
  })
}
