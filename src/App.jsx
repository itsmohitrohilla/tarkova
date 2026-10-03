import { useEffect, useState } from 'react'
import { TextAnimationCollection, TextPathStudies } from '@designcodeio/threeui'
import '@designcodeio/threeui/style.css'
import './global.css'
import './App.css'
import { products } from './site/products.js'
import { footerHTML, WORDMARK_PROPS } from './site/footer.js'
import './site/footer.css'
import { mountMusic } from './music.js'
import { mountGlass } from './glass.js'
import Galaxy from './Galaxy.jsx'
import Sections from './Sections.jsx'

export default function App() {
  const [latest, setLatest] = useState([])
  const [topics, setTopics] = useState([])

  // Newest posts + topic list, written next to the static blog; feeds the nav's Blog peek and the footer.
  useEffect(() => {
    fetch('/blog/latest.json')
      .then((r) => r.json())
      .then((d) => { setLatest(d.posts); setTopics(d.topics) })
      .catch(() => {})
  }, [])

  // Music and its mute button are shared with every site page (src/music.js).
  useEffect(mountMusic, [])
  useEffect(() => mountGlass(document.querySelector('.nav')), [])

  return (
    <>
      <main className="scene">
        <img className="bg" src="/bg.jpg" alt="" />

        <nav className="glass nav" aria-label="Main">
          <a href="/" aria-label="Tarkova home"><img src="/mark.png" alt="" /></a>
          <div className="nav-links">
            <a href="/about/">About</a>
            {products.map((p) => <a key={p.id} href={`/${p.id}/`}>{p.name}</a>)}
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

      </main>

      <Galaxy />

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
      <Sections />

      <footer className="foot">
        <div dangerouslySetInnerHTML={{ __html: footerHTML(topics) }} />
        <div className="foot-wordmark" aria-hidden="true">
          <TextAnimationCollection {...WORDMARK_PROPS} />
        </div>
      </footer>
    </>
  )
}

