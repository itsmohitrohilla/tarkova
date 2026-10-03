// Scene "problem" (PAPER): the four problems from Content Box 1 Product/what-is-curva.md beside one before/after.
// Before: the model's free-text reply, with margin notes on what is wrong with it. After: the typed answer card
// (0.97 is the docs' example). Scrubbed: the notes land, the reply dims, the card slides in and its bar fills.
// Static page (no JS, reduced motion) shows the end state.
export const id = 'problem'

const ITEMS = [
  'You get a sentence, not a label your code can use.',
  '“Fairly sure” is not a number you can act on.',
  'Reorder the options and the answer can change.',
  'Nothing records which model answered, or how sure it was.',
]
const NOTES = ['no label', 'a guess', 'can’t route on it']

export const html = () => `<section class="cv-scene cv-problem" data-scene="problem" aria-labelledby="cv-problem-h">
  <div class="cv-problem-in">
    <div class="cv-problem-copy">
      <h2 id="cv-problem-h">Ask an AI to sort a ticket and it writes a sentence.</h2>
      <p class="cv-problem-sub">Your code needs one clear answer and a confidence number.</p>
      <ol class="cv-problem-list">${ITEMS.map((t, i) => `
        <li><span aria-hidden="true">${i + 1}</span>${t}</li>`).join('')}
      </ol>
    </div>
    <figure class="cv-pb-fig" aria-label="The same ticket answered without Curva and with Curva">
      <p class="cv-pb-ask">Which team should handle this ticket?</p>
      <div class="cv-pb-before">
        <p class="cv-pb-who">Without Curva</p>
        <div class="cv-pb-row">
          <blockquote class="cv-pb-bubble"><p>It’s <mark>probably billing, but it could be technical</mark>. I’m <mark>fairly sure, maybe 0.95</mark>.</p></blockquote>
          <ul class="cv-pb-notes">${NOTES.map((n) => `<li>${n}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="cv-pb-after">
        <p class="cv-pb-who">With Curva</p>
        <div class="cv-pb-card">
          <div class="cv-pb-top">
            <span class="cv-pb-pick"><span class="cv-pb-k">choice</span><b>billing</b></span>
            <span class="cv-pb-conf"><span class="cv-pb-k">confidence</span><em aria-hidden="true">0.97</em></span>
          </div>
          <div class="cv-pb-bar" aria-hidden="true"><i></i></div>
          <code>{"choice": "billing", "confidence": 0.97}</code>
        </div>
        <p class="cv-pb-act">Your code can act on this.</p>
      </div>
    </figure>
  </div>
</section>`

export function init(el, { gsap }) {
  const num = el.querySelector('.cv-pb-conf em')
  const n = { v: 0 }
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: el.querySelector('.cv-pb-fig'), start: 'top 85%', end: 'center 62%', scrub: 1 },
  })
    .fromTo(el.querySelectorAll('.cv-pb-notes li'), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.1 })
    .fromTo(el.querySelector('.cv-pb-bubble'), { opacity: 1 }, { opacity: 0.62, duration: 0.4 }, 0.2)
    .fromTo(el.querySelector('.cv-pb-after'), { autoAlpha: 0, y: 56 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.35)
    .fromTo(el.querySelector('.cv-pb-bar i'), { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power1.out' }, 0.62)
    .fromTo(n, { v: 0 }, { v: 0.97, duration: 0.45, ease: 'power1.out', onUpdate: () => { num.textContent = n.v.toFixed(2) } }, 0.62)
}
