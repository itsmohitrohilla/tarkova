// Client motion for /about/: Lenis smooth scroll driving GSAP ScrollTrigger. Every effect is scrubbed to
// scroll, so scrolling back plays it backwards; nothing fires once. Started from site.js when [data-ab] exists.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

export function start(root) {
  if (!document.documentElement.classList.contains('ab-motion')) return // reduced motion: static page
  window.__ab = true
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  const $ = (s, el = root) => el.querySelector(s)
  const $$ = (s, el = root) => [...el.querySelectorAll(s)]

  gsap.matchMedia().add({ mob: '(max-width: 600px)', desk: '(min-width: 601px)' }, ({ conditions: { mob } }) => {
    hero(mob)
    words()
    mark(mob)
    team()
  })
  Promise.all([document.fonts.ready, $('.ab-hero img').decode().catch(() => {})]).then(() => ScrollTrigger.refresh())

  // The question set huge; the mountains open behind it and the two lines part.
  function hero(mob) {
    const sec = $('.ab-hero')
    const [l1, l2] = $$('.ab-hl', sec)
    const vw = () => innerWidth
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: '+=130%', pin: true, scrub: 1, invalidateOnRefresh: true } })
      .fromTo($('.ab-hero-photo', sec), { clipPath: mob ? 'inset(28% 22% 28% 22% round 12px)' : 'inset(30% 38% 30% 38% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo($('.ab-hero img', sec), { scale: 1.4 }, { scale: 1, duration: 1 }, 0)
      .fromTo(l1, { x: () => vw() * 0.14 }, { x: 0, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo(l2, { x: () => -vw() * 0.14 }, { x: 0, duration: 1, ease: 'power2.inOut' }, 0)
      .to($('.ab-hero-dim', sec), { opacity: 0.72, duration: 0.45 }, 0.85)
      .to($('.ab-hero-h', sec), { scale: 0.92, duration: 0.45 }, 0.85)
  }

  // Headings rise word by word out of a mask; long lines brighten word by word.
  function words() {
    for (const el of $$('[data-rise]'))
      gsap.fromTo($$('.ab-m > span', el), { yPercent: 110 }, { yPercent: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 45%', scrub: 1 } })
    for (const el of $$('[data-kin]'))
      gsap.fromTo($$('.ab-wd', el), { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 1 } })
  }

  // The mark in the heading grows from a word in the line to the whole stage, steps aside, and the
  // explanation rolls up beside it. Its frame scales; a light comes up behind it.
  function mark(mob) {
    const stage = $('.ab-k-stage')
    const big = $('.ab-k-big', stage)
    const slot = $('.ab-k-slot', stage)
    const copy = $('.ab-k-copy', stage)
    const geo = () => {
      const s = stage.getBoundingClientRect(), r = slot.getBoundingClientRect()
      return { x: r.left + r.width / 2 - (s.left + s.width / 2), y: r.top + r.height / 2 - (s.top + s.height / 2), k: r.width / big.offsetWidth }
    }
    const H = () => stage.clientHeight
    gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: stage, start: 'top top', end: '+=280%', pin: true, scrub: 1, invalidateOnRefresh: true } })
      .fromTo(big, { x: () => geo().x, y: () => geo().y, scale: () => geo().k }, { x: 0, y: 0, scale: 1, duration: 1 }, 0.15)
      .to($$('.ab-k-w', stage), { opacity: 0, stagger: 0.06, duration: 0.4, ease: 'none' }, 0.15)
      .fromTo($('.ab-k-glow', big), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1 }, 0.5)
      .to(big, { x: () => (mob ? 0 : -stage.clientWidth * 0.22), y: () => (mob ? -H() * 0.2 : 0), duration: 0.8 }, 1.35)
      .fromTo(copy, { y: () => H() }, { y: () => (mob ? H() * 0.52 : (H() - copy.offsetHeight) / 2), duration: 1.4, ease: 'power1.out' }, 1.45)
      .fromTo($$('p', copy), { opacity: 0.12 }, { opacity: 1, stagger: 0.25, duration: 0.5, ease: 'none' }, 1.8)
      .to($('.ab-k-glow', big), { opacity: 0, duration: 0.4, ease: 'none' }, 2.85)
  }

  // Portraits open and drift against the scroll; the names slide into place.
  function team() {
    $$('.ab-people li').forEach((li) => {
      const st = (start, end, scrub = 1) => ({ trigger: li, start, end, scrub, invalidateOnRefresh: true })
      gsap.fromTo($('.ab-photo', li), { clipPath: 'inset(16% 14% 16% 14% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'none', scrollTrigger: st('top 95%', 'top 30%') })
      const img = $('.ab-photo img', li)
      if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: st('top bottom', 'bottom top', true) })
      // Names slide in from the right at two speeds; never leftwards, so they can't cross the gutter.
      $$('h3 span', li).forEach((el, k) => gsap.fromTo(el, { x: () => innerWidth * (0.08 + k * 0.08) }, { x: 0, ease: 'none', scrollTrigger: st('top bottom', 'center 55%') }))
    })
  }
}
