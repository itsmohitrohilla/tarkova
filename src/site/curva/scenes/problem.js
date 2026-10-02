// Scene "problem" (PAPER): the four problems from Content Box 1 Product/what-is-curva.md, one line each, beside a
// specimen: a model's free-text answer. As you scroll, each problem marks its part of the answer (the guess, the
// "fairly sure", the options reversed and the answer flipping, the missing record) until the sentence fades into
// halftone and the typed chip takes its place. Static page: every mark shown, sentence and chip side by side.
export const id = 'problem'

const ITEMS = [
  ["Free text you can't route on.", 'You parse a sentence and hope it names a team that exists.'],
  ["Confidence you can't trust.", '“Fairly sure” is not a probability.'],
  ['Answers that shift.', 'Reorder the options and the answer can change.'],
  ['Nothing to audit.', 'No record of which model decided, or how sure it was.'],
]

// A word that flips when the options are reversed; the flipped copy is for the eye only.
const sw = (a, b) => `<span class="cv-problem-sw"><span>${a}</span><span aria-hidden="true">${b}</span></span>`

export const html = () => `<section class="cv-scene cv-problem" data-scene="problem" aria-labelledby="cv-problem-h">
  <div class="cv-problem-in">
    <h2 id="cv-problem-h">LLMs answer in sentences. Your code needs a label and a number.</h2>
    <ol class="cv-problem-list">${ITEMS.map(([h, t], i) => `
      <li style="--i:${i}"><span class="cv-problem-n" aria-hidden="true">${i + 1}</span><h3>${h}</h3><p>${t}</p></li>`).join('')}
    </ol>
    <figure class="cv-problem-spec" aria-label="A free-text answer, and the typed answer that replaces it">
      <p class="cv-problem-opts" aria-hidden="true"><span class="cv-problem-fwd">billing · technical · sales</span><span class="cv-problem-rev">sales · technical · billing</span></p>
      <blockquote class="cv-problem-said">
        <p><span class="cv-problem-m" data-m="1">Probably ${sw('billing.', 'technical.')}<br>Could be ${sw('technical.', 'billing.')}</span><br><span class="cv-problem-m" data-m="2">I'm fairly sure, maybe 0.95.</span></p>
      </blockquote>
      <p class="cv-problem-log" aria-hidden="true"><span class="cv-problem-m" data-m="4">model? settings? confidence? not recorded</span></p>
      <p class="cv-problem-chip"><code>{"choice": "billing", "confidence": <b>0.97</b>}</code></p>
    </figure>
  </div>
</section>`

export function init(el, { gsap }) {
  const q = (s) => el.querySelectorAll(s)
  const items = q('.cv-problem-list li')
  const marks = [...q('.cv-problem-m')]
  const mark = (n) => marks.filter((m) => m.dataset.m === String(n))
  const said = el.querySelector('.cv-problem-said')
  const chip = el.querySelector('.cv-problem-chip')

  // One scrubbed timeline, five beats of equal length: the four problems, then the answer.
  const build = (pinItems) => {
    const tl = gsap.timeline({ defaults: { ease: 'none', duration: 1 } })
    if (pinItems) tl.set(items, { opacity: 0.28 }, 0)
    const beat = (i, fn) => {
      if (pinItems) tl.to(items[i], { opacity: 1, duration: 0.3 }, i).to(items[i], { opacity: 0.28, duration: 0.3 }, i + 0.85)
      fn(i)
    }
    beat(0, (t) => tl.fromTo(mark(1), { '--hl': 0 }, { '--hl': 1, duration: 0.5 }, t))
    beat(1, (t) => tl.fromTo(mark(2), { '--hl': 0 }, { '--hl': 1, duration: 0.5 }, t))
    beat(2, (t) => tl.fromTo(q('.cv-problem-fwd'), { yPercent: 0, autoAlpha: 1 }, { yPercent: -100, autoAlpha: 0, duration: 0.4 }, t)
      .fromTo(q('.cv-problem-rev'), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4 }, t)
      .fromTo(q('.cv-problem-sw > span'), { yPercent: 0 }, { yPercent: -100, duration: 0.4 }, t + 0.25))
    beat(3, (t) => tl.fromTo(mark(4), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, t))
    tl.to(said, { '--fade': 1, duration: 0.6 }, 4)
      .fromTo(chip, { autoAlpha: 0, y: 24, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }, 4.3)
    if (pinItems) tl.to(items, { opacity: 1, duration: 0.4 }, 4.5)
    return tl
  }

  // Desktop: the list scrolls past a sticky specimen; small screens: the specimen plays as it crosses the screen.
  const mm = gsap.matchMedia()
  mm.add('(min-width: 901px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.cv-problem-list'), start: 'top 60%', end: 'bottom 75%', scrub: 0.8 } }).add(build(true))
  })
  mm.add('(max-width: 900px)', () => {
    gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.cv-problem-spec'), start: 'top 80%', end: 'bottom 25%', scrub: 0.8 } }).add(build(false))
  })
}
