// Scene "close" (BLUE): the last call to action. One line, two buttons, and the legal line from the Content Box
// README. (The install command and the price line live in "start", just above.)
// The halftone C logo sits still; a halftone wash rises behind it as the scene scrolls in.
export const id = 'close'

const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'

export const html = ({ p, esc }) => `<section class="cv-scene cv-close" data-scene="close" aria-labelledby="cv-close-h">
  <div class="cv-close-wash" aria-hidden="true"></div>
  <div class="cv-close-in">
    <h2 id="cv-close-h">Your AI key. A few lines of code. Clear answers you can trust.</h2>
    <div class="cv-close-cta">
      <a class="cv-close-btn" href="#start">Get started</a>
      <a class="cv-close-btn cv-close-btn-ghost" href="${DOCS}" rel="noopener">Read the docs <span aria-hidden="true">↗</span></a>
    </div>
    <img class="cv-close-logo" src="${p.logo}" alt="${esc(p.logoAlt)}" width="512" height="512">
    <p class="cv-close-legal">© 2026 Tarkova Private Limited. Curva and the Curva logo are trademarks of Tarkova Private Limited; all rights reserved. Curva is free to use under the Curva Free License; its source code is not published.</p>
  </div>
</section>`

export function init(el, { gsap }) {
  // The wash rises with the scroll; nothing else moves.
  gsap.fromTo(el.querySelector('.cv-close-wash'), { yPercent: 30 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  })
}
