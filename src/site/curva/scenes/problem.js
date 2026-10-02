// Scene "problem" (PAPER): the four problems from Content Box 1 Product/what-is-curva.md, one line each, beside one
// motion idea: a model's free-text answer dissolves word by word into halftone as you scroll, and the typed answer
// prints in its place. Static page: the sentence above the chip it should have been.
export const id = 'problem'

const ITEMS = [
  'You get a sentence, not a label your code can use.',
  '“Fairly sure” is not a number you can act on.',
  'Change the order of the options and the answer can change.',
  'Nothing records which model answered, or how sure it was.',
]
const SAID = "Probably billing, could be technical. I'm fairly sure, maybe 0.95."

export const html = () => `<section class="cv-scene cv-problem" data-scene="problem" aria-labelledby="cv-problem-h">
  <div class="cv-problem-in">
    <h2 id="cv-problem-h">Ask an AI to sort a ticket and it writes a sentence.</h2>
    <p class="cv-problem-sub">Your code needs one clear answer and a confidence number.</p>
    <ol class="cv-problem-list">${ITEMS.map((t, i) => `
      <li><span aria-hidden="true">${i + 1}</span>${t}</li>`).join('')}
    </ol>
    <figure class="cv-problem-spec" aria-label="A free-text answer, and the typed answer that replaces it">
      <blockquote class="cv-problem-said"><p>${SAID.split(' ').map((w) => `<span>${w}</span>`).join(' ')}</p></blockquote>
      <p class="cv-problem-chip"><code>{"choice": "billing", "confidence": <b>0.97</b>}</code></p>
    </figure>
  </div>
</section>`

export function init(el, { gsap }) {
  const words = el.querySelectorAll('.cv-problem-said span')
  const chip = el.querySelector('.cv-problem-chip')
  // Scrubbed: each word goes to halftone in reading order, then the chip prints over the dots.
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: el.querySelector('.cv-problem-spec'), start: 'top 75%', end: 'bottom 30%', scrub: 0.8 },
  })
    .fromTo(words, { '--d': 0 }, { '--d': 1, duration: 0.5, stagger: 0.08 })
    .fromTo(chip, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, '-=0.3')
}
