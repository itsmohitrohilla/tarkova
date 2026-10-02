// Scene "usecases" (BLUE): a halftone wall of decision cards. Each card is one use case from
// Content Box/3 Use cases: its typed question and the answer shape it gets back. Values appear only where
// the docs give an example (support triage, RAG, extraction, incident); the rest show their options.
export const id = 'usecases'

// a: answer chips. { k: key, v: value, n: number shown in pixel type, p: probability bar (0..1) }
const CARDS = [
  { name: 'Support triage', line: 'Route every ticket to the right team.', type: 'Choice', q: 'Which team should handle this?',
    a: [{ k: 'team', v: 'billing', n: '0.9999', p: 0.9999 }], recipe: 'support-triage' },
  { name: 'Content moderation', line: 'A policy call on every post, text and images.', type: 'Choice', q: 'Does the image break the content policy?',
    a: [{ v: 'ok' }, { v: 'nudity' }, { v: 'violence' }, { v: 'spam' }], note: 'Unsure below 0.85 goes to a person.', recipe: 'content-moderation' },
  { name: 'Phishing checks', line: 'A score you can threshold, not a hunch.', type: 'Noul', q: 'Is this email phishing?',
    a: [{ k: 'phishing', v: 'P(yes)' }, { k: 'risk', v: 'Safe … High' }], recipe: 'phishing-check' },
  { name: 'Lead qualification', line: 'Score and route each inbound lead.', type: 'Score', q: 'How strong a fit is this lead?',
    a: [{ v: 'Poor' }, { v: 'Weak' }, { v: 'Moderate' }, { v: 'Strong' }], recipe: 'lead-qualification' },
  { name: 'LLM output QA', line: 'A gate in code before an answer ships.', type: 'Choice', q: 'Pass, revise or block this draft?',
    a: [{ v: 'pass' }, { v: 'revise' }, { v: 'block' }], note: 'Unsure below 0.8 goes to a person.', recipe: 'llm-output-qa' },
  { name: 'RAG checks', line: 'Check the answer against its passages.', type: 'Choice', q: 'Passage: 30 days. Answer: 60 days. Next step?',
    a: [{ k: 'next_step', v: 'rewrite' }], recipe: 'rag-check' },
  { name: 'Document extraction', line: 'Typed values, never a silent bad one.', type: 'Number', q: 'Total amount due',
    a: [{ k: 'total', v: '14.3', n: '0.94', p: 0.94 }, { k: 'po_number', v: 'None' }] },
  { name: 'Incident triage', line: 'One request answers the whole chain.', type: 'Noul', q: 'Should the last deployment be rolled back now?',
    a: [{ k: 'rollback', n: '0.78', p: 0.78 }, { k: 'stage', v: '2' }] },
]

const chip = (c, esc) => `<span class="cv-uc-chip${c.n ? ' is-val' : ''}">${c.k ? `<i>${esc(c.k)}</i>` : ''}${c.v ? `<b>${esc(c.v)}</b>` : ''}${c.n ? `<em>${esc(c.n)}</em>` : ''}${c.p ? `<s style="--p:${c.p}" aria-hidden="true"></s>` : ''}</span>`

export const html = ({ esc }) => `<section class="cv-scene cv-usecases" data-scene="usecases" aria-labelledby="cv-uc-title">
  <div class="cv-uc-head">
    <h2 id="cv-uc-title">Built for decisions you make a thousand times a day.</h2>
    <p>One typed question in. One of your labels and a probability out.</p>
  </div>
  <div class="cv-uc-grid">
${CARDS.map((c) => `    <article class="cv-uc-card">
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.line)}</p>
      <div class="cv-uc-q"><span>${esc(c.type)}</span><code>${esc(c.q)}</code></div>
      <div class="cv-uc-a">${c.a.map((x) => chip(x, esc)).join('')}</div>
      ${c.note ? `<p class="cv-uc-note">${esc(c.note)}</p>` : ''}
      ${c.recipe ? `<code class="cv-uc-recipe">curva recipe show ${esc(c.recipe)}</code>` : ''}
    </article>`).join('\n')}
  </div>
</section>`

// Scroll-scrubbed: alternate columns drift against each other, like slips on a light table. Desktop only.
export function init(el, { gsap, ScrollTrigger }) {
  const mm = gsap.matchMedia()
  mm.add('(min-width: 1000px)', () => {
    const cards = [...el.querySelectorAll('.cv-uc-card')]
    cards.forEach((card, i) => {
      const lift = i % 2 ? -56 : 24
      gsap.fromTo(card, { y: -lift }, {
        y: lift, ease: 'none',
        scrollTrigger: { trigger: el.querySelector('.cv-uc-grid'), start: 'top bottom', end: 'bottom top', scrub: 1 },
      })
    })
  })
}
