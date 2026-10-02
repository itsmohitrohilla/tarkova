import { useEffect, useRef, useState } from 'react'
import { TextAnimationCollection, TextPathStudies } from '@designcodeio/threeui'
import '@designcodeio/threeui/style.css'
import './App.css'
import { products } from './site/products.js'
import { footerHTML, WORDMARK_PROPS } from './site/footer.js'
import './site/footer.css'

// Products show their wordmark in the menu, same as the site pages' nav.
const NAV_MARK = { crowkis: '/products/crowkis-wordmark-white.png', curva: '/products/curva-wordmark-white.png' }

export default function App() {
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)
  const [latest, setLatest] = useState([])
  const [topics, setTopics] = useState([])

  // Newest posts + topic list, written next to the static blog; feeds the nav's Blog peek and the footer.
  useEffect(() => {
    fetch('/blog/latest.json')
      .then((r) => r.json())
      .then((d) => { setLatest(d.posts); setTopics(d.topics) })
      .catch(() => {})
  }, [])

  // Autoplay, falling back to first user gesture if the browser blocks it.
  useEffect(() => {
    const audio = audioRef.current
    const tryPlay = () => audio.play().catch(() => {})
    tryPlay()
    const onGesture = () => { tryPlay(); cleanup() }
    const cleanup = () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return cleanup
  }, [])

  const toggleMute = () => {
    const next = !muted
    audioRef.current.muted = next
    setMuted(next)
    if (!next) audioRef.current.play().catch(() => {})
  }

  return (
    <>
      <main className="scene">
        <img className="bg" src="/bg.jpg" alt="" />

        <nav className="glass nav" aria-label="Main">
          <a href="/" aria-label="Tarkova home"><img src="/mark.png" alt="" /></a>
          <div className="nav-links">
            <a href="/about/">About</a>
            {products.map((p) => <a key={p.id} href={`/${p.id}/`}>{NAV_MARK[p.id] ? <img className="nav-wm" src={NAV_MARK[p.id]} alt={p.name} /> : p.name}</a>)}
            <div className="nav-blog">
              <a href="/blog/">Blog<span className="nav-dot" aria-hidden="true" /></a>
              {latest[0] && (
                <a className="blog-peek" href={latest[0].url}>
                  <span className="peek-art" dangerouslySetInnerHTML={{ __html: latest[0].cover }} />
                  <span className="peek-k">New on the blog</span>
                  <strong>{latest[0].title}</strong>
                  <span className="peek-go">Read it →</span>
                </a>
              )}
            </div>
          </div>
        </nav>

        <audio ref={audioRef} src="/music.mp3" loop preload="auto" />

        <button
          className="mute"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute music' : 'Mute music'}
          aria-pressed={muted}
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>
      </main>

      <section id="about" className="section">
        <div className="shader-frame">
          <TextPathStudies
            variant="outline-typeflow"
            mode="dark"
            scale={1.0}
            opacity={1.0}
            hue={0}
            saturation={1.0}
            brightness={1.0}
          />
        </div>
      </section>
      <footer className="foot">
        <div dangerouslySetInnerHTML={{ __html: footerHTML(topics) }} />
        <div className="foot-wordmark" aria-hidden="true">
          <TextAnimationCollection {...WORDMARK_PROPS} />
        </div>
      </footer>
    </>
  )
}

const SoundIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16 9a3.5 3.5 0 0 1 0 6" />
    <path d="M18.5 6.5a7 7 0 0 1 0 11" />
  </svg>
)

const MutedIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 9l4 6M21 9l-4 6" />
  </svg>
)
