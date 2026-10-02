// Scene "start" (PAPER): the quickstart. Code is copy-paste exact from Content Box/2 How to use/code-snippets.md.
// Root id="start": the hero and close buttons link here.
export const id = 'start'

const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'
const SH = 'pip install curva-ai\nexport OPENROUTER_API_KEY=sk-or-v1-...     # or any one provider key'
const PY = `import curva
d = curva.decide("I was charged twice, please refund me",
                 {"team": ["billing", "technical"], "refund": "Asks for a refund?", "total": float})
print(d.team, d.refund, d.total)           # e.g. billing True None`

// Light syntax colour (comments, strings), one span per line for the type-in. Escapes everything, so the
// block's textContent stays the exact snippet; the copy button reads data-copy anyway.
const hl = (src, esc) => src.split('\n').map((line) => {
  const c = line.indexOf('#')
  const code = c < 0 ? line : line.slice(0, c)
  const body = code.split(/("[^"]*")/).map((t, i) => (i % 2 ? `<span class="s">${esc(t)}</span>` : esc(t))).join('')
  return `<span class="l">${body}${c < 0 ? '' : `<span class="c">${esc(line.slice(c))}</span>`}</span>`
}).join('\n')

const copy = (text, esc) => `<button type="button" class="copy" data-copy="${esc(text)}">Copy</button>`

export const html = ({ esc }) => `<section id="start" class="cv-scene cv-start" data-scene="start" aria-labelledby="cv-st-title">
  <div class="cv-st-in">
    <h2 id="cv-st-title">Add Curva to your app in three lines.</h2>
    <p class="cv-st-lede">Use the AI API key you already have: OpenAI, Anthropic, Gemini, Groq, OpenRouter, or a local model. Add a few lines of code, and your AI makes quick decisions you can trust. Curva itself is free.</p>

    <div class="cv-st-main">
      <div class="cv-st-code">
        <figure class="cv-st-block is-sh"><pre><code>${hl(SH, esc)}</code></pre>${copy(SH, esc)}</figure>
        <figure class="cv-st-block is-py"><pre><code>${hl(PY, esc)}</code></pre>${copy(PY, esc)}</figure>
      </div>
      <div class="cv-st-side">
        <div class="cv-st-out" aria-label="Output">
          <span><i>team</i><b>billing</b></span>
          <span><i>refund</i><b>True</b></span>
          <span><i>total</i><b>None</b></span>
        </div>
        <p class="cv-st-links"><a href="https://pypi.org/project/curva-ai/" target="_blank" rel="noopener">PyPI ↗</a><a href="${DOCS}" target="_blank" rel="noopener">Docs ↗</a></p>
      </div>
    </div>

    <p class="cv-st-also">It also works from TypeScript, n8n, MCP and Docker. <a href="${DOCS}" target="_blank" rel="noopener">See the docs ↗</a></p>
  </div>
</section>`

// Scroll-scrubbed: the snippet types in line by line, then its output lands. Ends by the time an
// anchor jump to #start settles, so the code is always whole when someone arrives to copy it.
export function init(el, { gsap }) {
  const main = el.querySelector('.cv-st-main')
  const tl = gsap.timeline({ scrollTrigger: { trigger: main, start: 'top 95%', end: 'top 55%', scrub: 0.6 }, defaults: { ease: 'none' } })
  main.querySelectorAll('.l').forEach((line, i) => {
    tl.fromTo(line, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1 }, i * 0.8)
  })
  tl.fromTo(main.querySelectorAll('.cv-st-out span'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.3 })
}
