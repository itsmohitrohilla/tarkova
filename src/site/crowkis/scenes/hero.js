// Scene "hero": the brand, plainly. Tagline and crow on top, the lede, CTAs and facts in the middle, and the
// wordmark (the page's only h1) as a full-width base. Ember → Dried Wine ground with a fine static grain.
// Scrolling out, the ground dims toward the next scene's ink and the copy lifts a little, so the problem scene
// follows with no gap. The wordmark and the crow never move.
export const id = 'hero'

export const html = ({ p, c, esc }) => {
  // Tagline words are masked individually for the intro; the text itself stays plain for crawlers.
  const tag = esc(p.tagline).split(' ').map((w, i) => `<span class="ck-hero-w"><span style="--i:${i}">${w}</span></span>`).join(' ')
  return `<section class="ck-scene ck-hero" data-scene="hero">
  <div class="ck-hero-plate" aria-hidden="true"><div class="ck-hero-dusk"></div></div>
  <div class="ck-hero-in">
    <h1><img src="${p.wordmark[0]}" alt="${esc(p.name)}, a semantic cache and memory layer for AI apps" width="${p.wordmark[1]}" height="${p.wordmark[2]}"></h1>
    <img class="ck-hero-crow" src="${p.mark[0]}" alt="${esc(p.logoAlt)}" width="${p.mark[1]}" height="${p.mark[2]}">
    <p class="ck-hero-tag">${tag}</p>
    <div class="ck-hero-act">
      <p class="ck-hero-lede">${esc(c.hero)}</p>
      <div class="ck-hero-cta">
        <a class="ck-hero-btn" href="#how" data-cursor="Explore"><span>See how it works <span aria-hidden="true">↓</span></span></a>
        <a class="ck-hero-btn ck-hero-btn-ghost" href="${p.url}" rel="noopener" data-cursor="Visit"><span>Visit crowkis.com <span aria-hidden="true">↗</span></span></a>
      </div>
    </div>
    <dl class="ck-hero-facts">${p.facts.map(([v, l], i) => `<div style="--i:${i}"><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div>
</section>`
}

export function init(el, { gsap, ScrollTrigger }) {
  // Facts count up once, in step with the CSS intro. The server text is the final value.
  for (const dd of el.querySelectorAll('.ck-hero-facts dd')) {
    const [, num, rest] = dd.textContent.match(/^([\d.]+)(.*)$/) || []
    if (!num) continue
    const dec = (num.split('.')[1] || '').length, o = { v: 0 }
    gsap.to(o, { v: +num, duration: 0.9, delay: 0.25, ease: 'power2.out', onUpdate: () => (dd.textContent = o.v.toFixed(dec) + rest) })
  }

  // Hand-off, scrubbed as the hero leaves: the ground dims toward ink, the copy and facts lift a little.
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to(el.querySelector('.ck-hero-dusk'), { opacity: 0.7 }, 0)
    .to(el.querySelectorAll('.ck-hero-tag, .ck-hero-act, .ck-hero-facts'), { y: -60, opacity: 0.5, stagger: 0.04 }, 0)

  if (!matchMedia('(pointer: fine)').matches) return
  // Tactile CTAs: the pill leans toward the cursor, its label a little further.
  for (const a of el.querySelectorAll('.ck-hero-btn')) {
    const to = (t, p) => gsap.quickTo(t, p, { duration: 0.6, ease: 'power3' })
    const ax = to(a, 'x'), ay = to(a, 'y'), lx = to(a.firstChild, 'x'), ly = to(a.firstChild, 'y')
    a.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2
      ax(dx * 0.25); ay(dy * 0.35); lx(dx * 0.12); ly(dy * 0.18)
    })
    a.addEventListener('pointerleave', () => { ax(0); ay(0); lx(0); ly(0) })
  }
}
