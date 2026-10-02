// Scene "start" (PAPER): the quickstart. Code is copy-paste exact from Content Box/2 How to use/code-snippets.md.
// Root id="start": the hero and close buttons link here.
export const id = 'start'

const DOCS = 'https://itsmohitrohilla.github.io/curva-docs/'
const SH = 'pip install curva-ai\nexport OPENROUTER_API_KEY=sk-or-v1-...     # or any one provider key'
const PY = `import curva
d = curva.decide("I was charged twice, please refund me",
                 {"team": ["billing", "technical"], "refund": "Asks for a refund?", "total": float})
print(d.team, d.refund, d.total)           # e.g. billing True None`

const WAYS = [
  { name: 'TypeScript', line: 'Answers typed from your options.', cmd: 'npm install curva-ai', href: 'https://www.npmjs.com/package/curva-ai', link: 'npm' },
  { name: 'n8n', line: 'Settings, Community Nodes, Install. Then a Route node.', cmd: 'n8n-nodes-curva', href: 'https://www.npmjs.com/package/n8n-nodes-curva', link: 'npm' },
  { name: 'MCP', line: 'A decide tool for any MCP client. Run curva serve first.', cmd: 'claude mcp add curva -- curva mcp --url http://127.0.0.1:7777' },
  { name: 'Docker', line: 'One image. --no-auth only on your own machine.', cmd: 'docker run --rm -p 127.0.0.1:7777:7777 -e OPENROUTER_API_KEY ghcr.io/itsmohitrohilla/curva \\\n  serve --addr 0.0.0.0:7777 --no-auth' },
]

const PROVIDERS = ['OpenAI', 'Anthropic', 'Gemini', 'Groq', 'Mistral', 'DeepSeek', 'GLM', 'Qwen', 'OpenRouter', 'Ollama', 'vLLM', 'LM Studio', 'llama.cpp', 'any OpenAI-compatible endpoint']

// Light syntax colour: comments and strings. Escapes everything; textContent stays the exact snippet.
const hl = (src, esc) => src.split('\n').map((line) => {
  const c = line.indexOf('#')
  const code = c < 0 ? line : line.slice(0, c)
  const body = code.split(/("[^"]*")/).map((t, i) => (i % 2 ? `<span class="s">${esc(t)}</span>` : esc(t))).join('')
  return body + (c < 0 ? '' : `<span class="c">${esc(line.slice(c))}</span>`)
}).join('\n')

const copy = (text, esc) => `<button type="button" class="copy" data-copy="${esc(text)}">Copy</button>`

export const html = ({ esc }) => `<section id="start" class="cv-scene cv-start" data-scene="start" aria-labelledby="cv-st-title">
  <div class="cv-st-in">
    <h2 id="cv-st-title">Your first decision in three lines.</h2>

    <div class="cv-st-main">
      <div class="cv-st-code">
        <figure class="cv-st-block is-sh">
          <pre><code>${hl(SH, esc)}</code></pre>
          ${copy(SH, esc)}
        </figure>
        <figure class="cv-st-block is-py">
          <pre><code>${hl(PY, esc)}</code></pre>
          ${copy(PY, esc)}
        </figure>
      </div>
      <div class="cv-st-side">
        <div class="cv-st-out" aria-label="Output">
          <span><i>team</i><b>billing</b></span>
          <span><i>refund</i><b>True</b></span>
          <span><i>total</i><b>None</b></span>
        </div>
        <p class="cv-st-links"><a href="https://pypi.org/project/curva-ai/" target="_blank" rel="noopener">curva-ai on PyPI ↗</a><a href="${DOCS}" target="_blank" rel="noopener">Read the docs ↗</a></p>
      </div>
    </div>

    <ul class="cv-st-ways">
${WAYS.map((w) => `      <li>
        <div class="cv-st-way-head"><h3>${esc(w.name)}</h3>${w.href ? `<a href="${w.href}" target="_blank" rel="noopener">${esc(w.link)} ↗</a>` : ''}</div>
        <p>${esc(w.line)}</p>
        <div class="cv-st-cmd"><code>${esc(w.cmd)}</code>${copy(w.cmd, esc)}</div>
      </li>`).join('\n')}
    </ul>

    <div class="cv-st-models">
      <div>
        <h3>Any model, your servers.</h3>
        <p class="cv-st-prov">${PROVIDERS.map((p) => `<span>${esc(p)}</span>`).join('')}</p>
      </div>
      <div class="cv-st-free">
        <p><b>Pay your model provider, nothing else.</b> Curva is free to use. Free models work.</p>
      </div>
    </div>
  </div>
</section>`

export function init() {}
