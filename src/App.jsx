import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TextAnimationCollection, TextPathStudies } from '@designcodeio/threeui'
import '@designcodeio/threeui/style.css'
import './global.css'
import './App.css'
import { footerHTML, WORDMARK_PROPS } from './site/footer.js'
import './site/footer.css'
import { mountMusic } from './music.js'
import { mountGlass } from './glass.js'
import Galaxy from './Galaxy.jsx'
import Sections from './Sections.jsx'
import Why, { DotScene } from './Why.jsx'
import { bookHTML, mountBook } from './site/book.js'
import './site/book.css'

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
  // Book a demo and the contact form: the same markup and script as on the static pages (src/site/book.js).
  const book = useRef(null)
  useEffect(() => mountBook(book.current), [])

  return (
    <>
      {/* The hero (photo and menu) is plain HTML in index.html, so it shows before this script loads.
          Only the Blog peek, which needs the newest post, is added to that menu from here. */}
      {latest[0] && createPortal(
        <a className="blog-peek" href={latest[0].url}>
          <span className="peek-art" dangerouslySetInnerHTML={{ __html: latest[0].cover }} />
          <span className="peek-k">New on the blog</span>
          <strong>{latest[0].title}</strong>
          <span className="peek-go">Read it →</span>
        </a>,
        document.querySelector('.nav-blog'),
      )}

      {/* The headline under the hero is plain HTML too; only its moving backdrop comes from here. */}
      {createPortal(<DotScene scene="flow" />, document.querySelector('.lede-art'))}

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
      <Why />
      <div ref={book} dangerouslySetInnerHTML={{ __html: bookHTML() }} />

      <footer className="foot">
        <div dangerouslySetInnerHTML={{ __html: footerHTML(topics) }} />
        <div className="foot-wordmark" aria-hidden="true">
          <TextAnimationCollection {...WORDMARK_PROPS} />
        </div>
      </footer>
    </>
  )
}

