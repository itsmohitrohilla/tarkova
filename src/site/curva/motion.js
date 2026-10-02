// Client motion engine for /curva/: Lenis smooth scroll driving GSAP ScrollTrigger, then each scene's init.
// ponytail: same engine as crowkis/motion.js minus the follower cursor; share one module if a third motion page lands.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { scenes } from './scenes.js'

export function start(root) {
  if (!document.documentElement.classList.contains('cv-motion')) return // reduced motion: static page
  window.__cv = true
  gsap.registerPlugin(ScrollTrigger)

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    const target = a && document.querySelector(a.getAttribute('href'))
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -40, duration: 1.6 }) }
  })

  // Scenes may init async; measure triggers once every scene and the fonts are ready.
  const m = { gsap, ScrollTrigger, lenis }
  const ready = scenes.map(async (s) => {
    const el = root.querySelector(`[data-scene="${s.id}"]`)
    if (!el) return
    try { await s.init(el, m) } catch (err) { console.error(`curva scene "${s.id}" failed`, err) }
  })
  Promise.all([...ready, document.fonts.ready]).then(() => ScrollTrigger.refresh())
}
