// Scene "finale": the closing call to action. The Ember → Wine stage opens out of a crow app-icon card to full bleed, the headline rises word by word ("twice" last), and the stage settles
// into a rounded card as the footer arrives. The crow mark itself never animates (owner's rule).
export const id = 'finale'

// One mask per word, so words rise through it wherever the line happens to wrap.
const words = (t, serif) => t.split(' ').map((w) => `<span class="ck-fin-w"><span>${serif(w)}</span></span>`).join(' ')

export const html = ({ p, esc, serif }) => `<section class="ck-scene ck-finale" data-scene="finale">
<div class="ck-fin-cta"><div class="ck-fin-frame"><section class="ck-fin-stage" aria-labelledby="ck-fin-cta-h">
<img class="ck-fin-mark" src="${p.mark[0]}" alt="" width="${p.mark[1]}" height="${p.mark[2]}" />
<h2 id="ck-fin-cta-h">${words('Stop paying *twice* for the same answer.', serif)}</h2>
<ul class="ck-fin-links" role="list">${p.links.map(([l, h], i) => `<li><a class="ck-fin-btn${i ? '' : ' is-main'}" href="${h}" rel="noopener" data-cursor="Go"><span>${esc(l)} <span aria-hidden="true">↗</span></span></a></li>`).join('')}</ul>
</section></div></div>
</section>`

export function init(el, { gsap }) {
  const q = (s) => [...el.querySelectorAll(s)]
  const cta = el.querySelector('.ck-fin-cta')
  const stage = el.querySelector('.ck-fin-stage')
  const mark = el.querySelector('.ck-fin-mark')

  // The stage starts as a rounded red card framing the crow (the Crowkis app icon), in px from the mark.
  const icon = () => {
    const s = stage.getBoundingClientRect(), m = mark.getBoundingClientRect()
    const size = m.width * 1.55
    const t = m.top - s.top + m.height / 2 - size / 2, l = m.left - s.left + m.width / 2 - size / 2
    return `inset(${t}px ${s.width - l - size}px ${s.height - t - size}px ${l}px round ${size * 0.24}px)`
  }
  const title = q('.ck-fin-stage .ck-fin-w > span')
  const twice = title.find((w) => w.querySelector('em'))
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: cta, start: 'top top', end: '+=160%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
  })
  tl.fromTo(stage, { clipPath: icon }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1 })
    .fromTo(title.filter((w) => w !== twice), { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }, 0.55)
    .fromTo(twice, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power3.out' }, '>-0.15')
    .fromTo(q('.ck-fin-links li'), { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' }, '>-0.2')
    .to({}, { duration: 0.4 }) // hold the finished frame before letting go

  const mm = gsap.matchMedia()

  // Magnetic buttons: within reach, the button leans toward the pointer and its label a little further.
  mm.add('(pointer: fine) and (min-width: 601px)', () => {
    const mags = q('.ck-fin-btn').map((a) => {
      const to = (t, p) => gsap.quickTo(t, p, { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
      return { a, x: to(a, 'x'), y: to(a, 'y'), lx: to(a.firstElementChild, 'x'), ly: to(a.firstElementChild, 'y') }
    })
    const move = (e) => {
      for (const m of mags) {
        const r = m.a.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2 - gsap.getProperty(m.a, 'x'))
        const dy = e.clientY - (r.top + r.height / 2 - gsap.getProperty(m.a, 'y'))
        const k = Math.hypot(dx, dy) < r.width / 2 + 70 ? 1 : 0
        m.x(dx * 0.3 * k); m.y(dy * 0.3 * k); m.lx(dx * 0.14 * k); m.ly(dy * 0.14 * k)
      }
    }
    const reset = () => mags.forEach((m) => { m.x(0); m.y(0); m.lx(0); m.ly(0) })
    stage.addEventListener('pointermove', move)
    stage.addEventListener('pointerleave', reset)
    return () => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', reset) }
  })
}
