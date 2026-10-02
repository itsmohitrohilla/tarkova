// Scene "usecases" (BLUE): six decision slips, each a use case from Content Box/3 Use cases with the one
// typed answer it gets back. Values appear only where the docs give an example; the rest show their labels.
export const id = 'usecases'

// a: the answer chip. k: key, v: value or label set, n: probability in pixel type (with a bar).
const CARDS = [
  { name: 'Support triage', line: 'Route every ticket to the right team.', a: { k: 'team', v: 'billing', n: 0.9999 } },
  { name: 'Phishing checks', line: 'Yes or no, with how sure it is.', a: { k: 'phishing', v: 'P(yes)' } },
  { name: 'Content moderation', line: 'A policy call on every post, text and images.', a: { k: 'policy', v: 'ok · nudity · violence · spam' } },
  { name: 'LLM output QA', line: 'Check an AI answer before a user sees it.', a: { k: 'verdict', v: 'pass · revise · block' } },
  { name: 'Document extraction', line: 'Pull out fields, with how sure it is of each.', a: { k: 'total', v: '14.3', n: 0.94 } },
  { name: 'Incident triage', line: 'Linked questions, answered in one request.', a: { k: 'rollback', n: 0.78 } },
]

const chip = ({ k, v, n }, esc) => `<span class="cv-uc-chip${n ? ' is-val' : ''}"><i>${esc(k)}</i>${v ? `<b>${esc(v)}</b>` : ''}${n ? `<em>${n}</em><s style="--p:${n}" aria-hidden="true"></s>` : ''}</span>`

export const html = ({ esc }) => `<section class="cv-scene cv-usecases" data-scene="usecases" aria-labelledby="cv-uc-title">
  <div class="cv-uc-head"><h2 id="cv-uc-title">What you can build with Curva.</h2></div>
  <div class="cv-uc-grid">
${CARDS.map((c) => `    <article class="cv-uc-card">
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.line)}</p>
      ${chip(c.a, esc)}
    </article>`).join('\n')}
  </div>
</section>`

// Scroll-scrubbed: the slips start scattered across the light table and settle into a tidy grid.
const SCATTER = [[-70, 60, -7], [20, 120, 4], [90, 40, 8], [-40, 90, 5], [30, 150, -5], [80, 70, -9]]
export function init(el, { gsap }) {
  const cards = el.querySelectorAll('.cv-uc-card')
  const grid = el.querySelector('.cv-uc-grid')
  gsap.matchMedia().add({ wide: '(min-width: 601px)', narrow: '(max-width: 600px)' }, ({ conditions: { wide } }) => {
    const k = wide ? 1 : 0.35 // a phone column only tilts and shifts a little
    cards.forEach((card, i) => {
      const [x, y, r] = SCATTER[i % SCATTER.length]
      gsap.fromTo(card, { x: x * k, y: y * k, rotation: r * k }, {
        x: 0, y: 0, rotation: 0, ease: 'none',
        scrollTrigger: wide
          ? { trigger: grid, start: 'top 95%', end: 'top 30%', scrub: 1 }
          : { trigger: card, start: 'top bottom', end: 'top 55%', scrub: 1 },
      })
    })
  })
}
