// The About page as one scroll-driven film. Every word is server-rendered here (Node, no DOM);
// ./motion.js choreographs it in the browser. Without motion the page reads as its final frames.
import { existsSync } from 'node:fs'
import { MARK } from '../footer.js'

// Founders. Drop a portrait at public/team/<id>.jpg and the card uses it instead of the monogram.
// Focus lines follow Mohit's LinkedIn post ("I focus on whether the tech works. He focuses on whether the market cares.").
export const TEAM = [
  { id: 'mohit', name: 'Mohit Rohilla', role: 'Co-founder · Product & Engineering', bio: 'Built the first version of Crowkis himself. Asks: does the tech work?', linkedin: 'https://www.linkedin.com/in/itsmohitrohilla/' },
  { id: 'subhraneel', name: 'Subhraneel Baruah', role: 'Co-founder · GTM & Growth', bio: 'Background in GTM, growth and management. Asks: does the market care?', linkedin: 'https://www.linkedin.com/in/subhraneelbaruah/' },
].map((m) => ({ ...m, photo: existsSync(new URL(`../../../public/team/${m.id}.jpg`, import.meta.url)) ? `/team/${m.id}.jpg` : null }))

// The founder's posts this page quotes, linked so every line is traceable.
const SOURCES = [
  ['How Crowkis started', 'https://www.linkedin.com/posts/itsmohitrohilla_a-few-months-ago-i-kept-noticing-the-same-share-7503016409711636480-v0WB/'],
  ['Meet the new Tarkova mark', 'https://www.linkedin.com/posts/itsmohitrohilla_tarkova-crowkis-ai-share-7510245906982760449-NX7U/'],
]

// Same fallback as CK_HEAD: set the motion class before first paint; drop it if the bundle never starts.
export const AB_HEAD = `<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('ab-motion');setTimeout(function(){if(!window.__ab)document.documentElement.classList.remove('ab-motion')},location.hostname==='localhost'?20000:4000)}</script>
`

const LINKEDIN = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zm7 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.61 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg>`

export function aboutMain({ esc }) {
  // Words wrapped for scrubbed effects: `rise` masks each word, `kin` lets each word brighten.
  const rise = (s) => s.split(' ').map((w) => `<span class="ab-m"><span>${esc(w)}</span></span>`).join(' ')
  const kin = (s) => s.split(' ').map((w) => `<span class="ab-wd">${esc(w)}</span>`).join(' ')
  const first = (m) => m.name.split(' ')[0]

  return `<div class="about" data-ab>
<div class="ab-grain" aria-hidden="true"></div>

<section class="ab-hero">
  <figure class="ab-hero-photo"><picture><source srcset="/about/mountains.avif" type="image/avif" /><img src="/about/mountains.webp" alt="The Tarkova mark held up in the mountains" width="1086" height="1448" fetchpriority="high" /></picture></figure>
  <div class="ab-hero-dim" aria-hidden="true"></div>
  <h1 class="ab-hero-h"><span class="ab-hl">how did</span> <span class="ab-hl">it start?</span></h1>
</section>

<section class="ab-intro" aria-labelledby="ab-intro-h">
  <h2 id="ab-intro-h" class="ab-big" data-rise>${rise('Tarkova is a technology company.')}</h2>
  <p class="ab-kin" data-kin>${kin("We're here to make AI cost less, and to build products that make your work easier.")} <a href="/crowkis/">${kin('Crowkis')}</a> ${kin('and')} <a href="/curva/">${kin('Curva')}</a> ${kin('are the first. More are coming.')}</p>
</section>

<section class="ab-story" aria-labelledby="ab-story-h">
  <h2 id="ab-story-h" class="ab-big" data-rise>${rise('One question, asked in different words.')}</h2>
  <p class="ab-kin" data-kin>${kin('Working with LLMs, Mohit kept seeing it: the same question, reworded, answered from scratch every single time. Full cost. Full wait.')}</p>
  <p class="ab-kin ab-kin-r" data-kin>${kin('Nothing solved it properly. So he built it himself.')}</p>
</section>

<section class="ab-k" aria-labelledby="ab-k-h">
  <div class="ab-k-stage">
    <div class="ab-k-big" aria-hidden="true"><span class="ab-k-glow"></span>${MARK}</div>
    <h2 id="ab-k-h" class="ab-k-h"><span class="ab-k-w">Everything</span> <span class="ab-k-w">starts with</span> <span class="ab-k-slot"><span class="ab-sr">the Tarkova mark</span>${MARK}</span><span class="ab-k-w">.</span></h2>
    <div class="ab-k-copy">
      <p>Our mark is a single letter, kept simple. It's the first letter every Indian kid learns: where everything begins.</p>
      <p>Every product we build starts there. <a href="/crowkis/">Crowkis</a> first. <a href="/curva/">Curva</a> next.</p>
    </div>
  </div>
</section>

<section class="ab-team" aria-labelledby="ab-team-h">
  <h2 id="ab-team-h" class="ab-big" data-rise>${rise('The people behind Tarkova.')}</h2>
  <blockquote class="ab-team-quote"><p data-kin>${kin('“I focus on whether the tech works. He focuses on whether the market cares. Both questions matter.”')}</p><cite>Mohit Rohilla</cite></blockquote>
  <ul class="ab-people" role="list">${TEAM.map((m) => `
    <li>
      <figure class="ab-photo">${m.photo ? `<img src="${m.photo}" alt="Portrait of ${esc(m.name)}" width="400" height="400" />` : `<span class="ab-mono" aria-hidden="true">${esc(m.name.split(' ').map((w) => w[0]).join(''))}</span>`}</figure>
      <div class="ab-person">
        <span class="ab-role">${esc(m.role)}</span>
        <h3>${m.name.split(' ').map((w) => `<span>${esc(w)}</span>`).join(' ')}</h3>
        <p>${esc(m.bio)}</p>
        <a class="ab-talk" href="${m.linkedin}" rel="noopener" target="_blank">${LINKEDIN} Talk with ${esc(first(m))}</a>
      </div>
    </li>`).join('')}
  </ul>
  <p class="ab-sources">From the founders: ${SOURCES.map(([l, h]) => `<a href="${h}" rel="noopener" target="_blank">${l} ↗</a>`).join('')}</p>
</section>

</div>`
}
