// Scene "who": who it's for, in one screen. A short title, then the five use cases as a tight row of cards:
// a small wordless glyph (what users send → the one red answer), the use case and one line. The glyphs resolve
// as the row scrolls through (scrubbed); the static markup is their finished state.
export const id = 'who'

const ask = (w) => `<i class="ckw-ask" style="--w:${w}"></i>`
const ans = '<i class="ckw-ans"></i>'
const link = '<span class="ckw-link"></span>'

// One glyph per use case, in c.who.items order. Decorative: the card's text says what it shows.
const GLYPHS = [
  // support: many phrasings → one answer
  `<span class="ckw-in">${[0.9, 0.6, 0.75, 0.5].map(ask).join('')}</span>${link}${ans}`,
  // copilots: one answer, reused by a whole team
  `${ans}${link}<span class="ckw-team">${'<i></i>'.repeat(12)}</span>`,
  // docs search: the document → the finished answer
  `<span class="ckw-doc"><i></i><i></i><i></i><i></i></span>${link}${ans}`,
  // agents: a reasoning path, reused step by step
  '<span class="ckw-path"><i></i><i></i><i></i></span>',
  // voice: a spoken question → the reply at the very start of the turn
  `<span class="ckw-wave">${[3, 6, 9, 5, 8, 4, 7, 3, 5, 2].map((h) => `<i style="--h:${h}"></i>`).join('')}</span>${link}${ans}`,
]

export const html = ({ c, esc, serif }) => `<section class="ck-scene ck-who" data-scene="who" aria-labelledby="ckw-title">
  <h2 class="ckw-title" id="ckw-title">${serif(c.who.title)}</h2>
  <ul class="ckw-grid">
    ${c.who.items.map(([t, d], i) => `<li class="ckw-card">
      <span class="ckw-g" aria-hidden="true">${GLYPHS[i]}</span>
      <h3>${esc(t)}</h3>
      <p>${esc(d)}</p>
    </li>`).join('\n    ')}
  </ul>
</section>`

export function init(el, { gsap }) {
  const q = (s, r = el) => [...r.querySelectorAll(s)]
  // Each glyph resolves in turn as the row rises: asks arrive, the arrow draws, the red answer lands.
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: el.querySelector('.ckw-grid'), start: 'top 90%', end: 'center 55%', scrub: 0.6 } })
  q('.ckw-g').forEach((g, i) => {
    const at = i * 0.35
    tl.from(q('.ckw-ask, .ckw-doc, .ckw-wave i, .ckw-path i', g), { opacity: 0.15, y: 8, stagger: 0.05, duration: 0.35 }, at)
      .fromTo(q('.ckw-link', g), { '--k': 0 }, { '--k': 1, duration: 0.25, ease: 'none' }, at + 0.3)
      .from(q('.ckw-ans', g), { opacity: 0, scale: 0.6, duration: 0.3 }, at + 0.45)
      .from(q('.ckw-team i', g), { opacity: 0.2, stagger: 0.02, duration: 0.2 }, at + 0.5)
  })
}
