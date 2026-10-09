// Scene "install" (Get started): the three packages with their registry logos, then three steps on a rail:
// run the server (Docker) → add the SDK (Python / Node.js tabs) → done, plus MCP. Paper ground, dark terminals.
// The tabs are CSS-only (radios + :has), so they switch with motion off; init only adds scrubbed motion.
//   id                       matches data-scene on the root <section>
//   html(ctx) -> string      Node only, no DOM. ctx = { p, c, latest, esc, serif, card }
//   init(el, m)              browser only; m = { gsap, ScrollTrigger, lenis }
import { icon } from '../brand-icons.js'

export const id = 'install'

// One <span class="ln"> per line, newlines kept between them so a figure's Copy (textContent) stays exact.
// Strings and `#` comments get a tint.
const lines = (src, esc) =>
  src.split('\n').map((l) => `<span class="ln">${l.split(/("[^"]*"|# .*$)/).map((t, i) => (i % 2 ? `<span class="${t[0] === '#' ? 'cm' : 'st'}">${esc(t)}</span>` : esc(t))).join('')}</span>`).join('\n')

// A shell command row: the prompt is CSS, the Copy button carries the exact command.
const cmd = (label, src, esc) => `<div class="ck-in-cmd">${label ? `<span class="ck-in-cap"># ${esc(label)}</span>` : ''}<pre><code>${lines(src, esc)}</code></pre><button type="button" class="copy" data-copy="${esc(src)}">Copy</button></div>`

// A dark window. `copy` puts a Copy in the title bar (it copies the figure's <code>).
const term = (title, body, copy = false) => `<figure class="code ck-in-panel"><figcaption><span class="ck-in-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${title}</span>${copy ? '<button type="button" class="copy" data-copy>Copy</button>' : ''}</figcaption>${body}</figure>`

// Logos sit beside their name, so they're decorative to screen readers.
const logo = (k, size) => `<span class="ck-in-logo" aria-hidden="true">${icon(k, size)}</span>`

const link = (href, text, esc) => `<a href="${esc(href)}" target="_blank" rel="noopener">${text} <span aria-hidden="true">↗</span></a>`

export const html = ({ c, esc, serif }) => {
  const { docker, python, node, mcp } = c.install
  const pkg = (s) => s.split(' ').pop() // the package name is the last word of its install command
  const SDKS = [
    ['py', 'python', 'Python', python, 'app.py', 'PyPI'],
    ['node', 'npm', 'Node.js', node, 'app.mjs', 'npm'],
  ]
  return `<section class="ck-scene ck-install" id="get-started" data-scene="install">
  <header class="ck-in-head">
    <h2>${serif('Up and running in *one minute*.')}</h2>
    <p class="ck-in-lede">Crowkis installs as one Docker image, plus one package for your app.</p>
    <ul class="ck-in-reg" aria-label="Official packages">
      ${[['python', 'Python · PyPI', python.url, pkg(python.cmd)], ['npm', 'Node.js · npm', node.url, pkg(node.cmd)], ['docker', 'Docker Hub', docker.url, pkg(docker.pull)]]
        .map(([k, name, url, id]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Open">${logo(k, 36)}<span><b>${name}</b><code>${esc(id)}</code></span><span class="ck-in-arrow" aria-hidden="true">↗</span></a></li>`).join('\n      ')}
    </ul>
  </header>
  <div class="ck-in-flow">
  <ol class="ck-in-steps">
    <li class="ck-in-step">
      <span class="ck-in-dot" aria-hidden="true"><i></i></span>
      <div class="ck-in-info">
        <span class="ck-in-num">01</span>
        <h3>${logo('docker', 30)}Run the server</h3>
        <p>One container, three local ports.</p>
        <dl class="ck-in-ports">${docker.ports.map(([port, what]) => `<div><dt>${esc(port)}</dt><dd>${esc(what)}</dd></div>`).join('')}</dl>
        <p class="ck-in-links">${link(docker.url, 'Docker Hub', esc)}${link(docker.docs, 'Docker guide', esc)}</p>
      </div>
      ${term('Terminal', cmd('pull the image', docker.pull, esc) + cmd('run it', docker.run, esc) + cmd('check it is up', docker.check, esc))}
    </li>
    <li class="ck-in-step">
      <span class="ck-in-dot" aria-hidden="true"><i></i></span>
      <div class="ck-in-info">
        <span class="ck-in-num">02</span>
        <h3>Add the SDK</h3>
        <p>Wrap your model call. Rephrasings hit the cache.</p>
      </div>
      <div class="ck-in-sdk">
        <div class="ck-in-tabs" role="radiogroup" aria-label="SDK language">
          ${SDKS.map(([v, k, name], i) => `<label class="ck-in-tab"><input type="radio" name="ck-in-sdk" value="${v}"${i ? '' : ' checked'}>${logo(k, 22)}<span>${name}</span></label>`).join('\n          ')}
        </div>
        <div class="ck-in-panes">
          ${SDKS.map(([v, , , s, file, reg]) => `<div class="ck-in-pane" data-lang="${v}">
            ${term('Terminal', cmd('', s.cmd, esc))}
            ${term(file, `<pre><code>${lines(s.code, esc)}</code></pre>`, true)}
            <p class="ck-in-links">${link(s.url, reg, esc)}${link(s.docs, 'Docs', esc)}</p>
          </div>`).join('\n          ')}
        </div>
      </div>
    </li>
    <li class="ck-in-step is-last">
      <span class="ck-in-dot" aria-hidden="true"><i></i></span>
      <div class="ck-in-info">
        <span class="ck-in-num">03</span>
        <h3>${serif('Done. Ask *twice*, pay once.')}</h3>
        <p>Optional: connect Claude Code or any agent over MCP.</p>
      </div>
      ${term('MCP', cmd('', mcp, esc))}
    </li>
  </ol>
  <span class="ck-in-rail" aria-hidden="true"></span>
  </div>
</section>`
}

export function init(el, { gsap }) {
  const $$ = (s) => [...el.querySelectorAll(s)]
  const mm = gsap.matchMedia()
  // Refresh after the pinned scenes above so our starts include their spacing.
  const st = (o) => ({ scrub: 0.8, ...o })

  // Header: title and lede rise into place at staggered depths; the registry logos stay still.
  gsap.fromTo(el.querySelectorAll('.ck-in-head h2, .ck-in-lede'), { y: (i) => 40 + i * 30, opacity: 0.1 }, {
    y: 0, opacity: 1, ease: 'power2.out', stagger: 0.15, scrollTrigger: st({ trigger: el.querySelector('.ck-in-head'), start: 'top 90%', end: 'top 40%' }),
  })

  // Rail draws down the steps; each dot fills as the rail reaches it.
  gsap.fromTo(el.querySelector('.ck-in-rail'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: st({ trigger: el.querySelector('.ck-in-steps'), start: 'top 70%', end: 'bottom 70%' }) })
  $$('.ck-in-step').forEach((s) => {
    gsap.fromTo(s.querySelector('.ck-in-dot i'), { scale: 0 }, { scale: 1, ease: 'back.out(2)', scrollTrigger: st({ trigger: s, start: 'top 72%', end: 'top 62%' }) })
  })
  // Terminal and code lines type in (left-to-right wipe), per panel, scrubbed. Both SDK panes run together
  // so switching tabs never lands on a half-typed pane.
  $$('.ck-in-panel').forEach((p) => {
    gsap.fromTo(p.querySelectorAll('.ln'), { clipPath: 'inset(0 100% 0 0)' }, {
      clipPath: 'inset(0 0% 0 0)', ease: 'none', stagger: 0.3,
      scrollTrigger: st({ trigger: p.closest('.ck-in-panes') || p, start: 'top 85%', end: 'top 40%' }),
    })
  })

  // Dark panels: a soft red spotlight follows the pointer (CSS vars). Fine pointers only.
  mm.add('(hover: hover) and (pointer: fine)', () => {
    const move = (e) => {
      const p = e.target.closest('.ck-in-panel')
      if (!p) return
      const r = p.getBoundingClientRect()
      p.style.setProperty('--mx', `${e.clientX - r.left}px`)
      p.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('pointermove', move)
    return () => el.removeEventListener('pointermove', move)
  })
}
