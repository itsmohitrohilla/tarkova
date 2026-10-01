// Client motion engine for /crowkis/: Lenis smooth scroll driving GSAP ScrollTrigger, then each scene's init.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { scenes } from './scenes.js'

export function start(root) {
  if (!document.documentElement.classList.contains('ck-motion')) return // reduced motion: static page
  window.__ck = true
  gsap.registerPlugin(ScrollTrigger)

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)

  // In-page anchors glide instead of jumping.
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const target = document.querySelector(a.getAttribute('href'))
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -40, duration: 1.6 }) }
  })

  // Scenes may init async (dynamic plugin imports) and add pins late; measure every trigger only once
  // all of them exist and the fonts have settled, or the triggers below a late pin start too early.
  const m = { gsap, ScrollTrigger, lenis }
  const ready = scenes.map(async (s) => {
    const el = root.querySelector(`[data-scene="${s.id}"]`)
    if (!el) return
    try { await s.init(el, m) } catch (err) { console.error(`crowkis scene "${s.id}" failed`, err) }
  })
  Promise.all([...ready, document.fonts.ready]).then(() => ScrollTrigger.refresh())

  cursor(gsap)
}

// A small follower cursor (fine pointers only). Anything with [data-cursor="label"] grows it and shows the label.
function cursor(gsap) {
  if (!matchMedia('(pointer: fine)').matches) return
  const dot = document.createElement('div')
  dot.className = 'ck-cursor'
  dot.innerHTML = '<span></span>'
  document.body.append(dot)
  const x = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' })
  const y = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' })
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); dot.classList.add('on') })
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('a, button, [data-cursor]')
    dot.classList.toggle('big', !!t)
    dot.firstChild.textContent = t?.dataset.cursor || ''
  })
  document.addEventListener('pointerleave', () => dot.classList.remove('on'))
}
