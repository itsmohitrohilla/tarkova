// Scene "architecture" (PAPER): where Curva sits in a stack, as an inline SVG drawn with archify
// (github.com/tt-a1i/archify, `finalize --quality showcase` passed) and restyled here by class, then six ways
// teams wire it in. Facts: Content Box/1 Product/how-it-works.md, what-is-curva.md, 2 How to use/integrations.md,
// 3 Use cases/*.md. The SVG is archify's output minus its legend, grid, icons and viewer-only attributes.
export const id = 'architecture'

// via: the way in (matches the diagram's left side). name + one line, from the use case docs.
const USES = [
  { via: 'SDK', name: 'Route support tickets', line: 'Rules catch the obvious ones at no cost; unsure tickets go to a person.' },
  { via: 'n8n node', name: 'Branch an n8n workflow', line: 'The Route node gives one output per option, plus Needs review.' },
  { via: 'MCP', name: 'Give an agent a decide tool', line: 'Typed answers and an abstain flag instead of a free-text judgement.' },
  { via: 'SDK', name: 'Check LLM output', line: 'Pass, revise or block an answer before a user sees it.' },
  { via: 'HTTP API', name: 'Filter phishing emails', line: 'A probability of phishing, a risk level and a sender-mismatch flag in one call.' },
  { via: 'HTTP API', name: 'Move off a hosted decision API', line: 'Curva accepts the criteria request shape, so a client needs a new base URL and key.' },
]

const SVG = `<svg viewBox="28 18 1244 626" role="img" aria-labelledby="cv-ar-title cv-ar-desc">
<title id="cv-ar-title">How Curva fits in your stack</title>
<desc id="cv-ar-desc">Your app, an n8n workflow, an AI agent or any HTTP tool calls the Curva API on your own servers. Rules and the cache settle easy cases with no model call. The rest is asked twice, in both option orders, to your LLM provider. Curva reads a probability per label, averages both orders, applies the calibrator fitted from your feedback labels, and returns a typed answer. Decisions go to the audit log in an embedded SQLite database.</desc>
<defs>
<marker id="cv-ar-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-default" />
</marker>
<marker id="cv-ar-arrow-emphasis" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-emphasis" />
</marker>
<marker id="cv-ar-arrow-security" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-security" />
</marker>
<marker id="cv-ar-arrow-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-dashed" />
</marker>
</defs>
<rect data-graph-role="structural-frame" x="250" y="130" width="760" height="504" rx="12" class="c-region" stroke-width="1"/>
<g data-graph-role="automatic-crossover" style="--step:0">
<path data-graph-role="automatic-crossover-underlay" d="M 360 90 L 360 160" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="app-in" d="M 360 90 L 360 160" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:1">
<path data-graph-role="automatic-crossover-underlay" d="M 200 254 L 232 254 Q 240 254 240 262 L 240 322 Q 240 330 248 330 L 280 330" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="n8n-in" d="M 200 254 L 232 254 Q 240 254 240 262 L 240 322 Q 240 330 248 330 L 280 330" class="a-default" stroke-width="1.5" marker-end="url(#cv-ar-arrow)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:2">
<path data-graph-role="automatic-crossover-underlay" d="M 200 344 L 280 344" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="agent-in" d="M 200 344 L 280 344" class="a-default" stroke-width="1.5" marker-end="url(#cv-ar-arrow)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:3">
<path data-graph-role="automatic-crossover-underlay" d="M 200 434 L 232 434 Q 240 434 240 426 L 240 366 Q 240 358 248 358 L 280 358" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="tool-in" d="M 200 434 L 232 434 Q 240 434 240 426 L 240 366 Q 240 358 248 358 L 280 358" class="a-default" stroke-width="1.5" marker-end="url(#cv-ar-arrow)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:4">
<path data-graph-role="automatic-crossover-underlay" d="M 440 327.9 L 487 327.9 Q 495 327.9 495 319.9 L 495 268 Q 495 260 503 260 L 550 260" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="api-rules" d="M 440 327.9 L 487 327.9 Q 495 327.9 495 319.9 L 495 268 Q 495 260 503 260 L 550 260" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:5">
<path data-graph-role="automatic-crossover-underlay" d="M 720 260 L 810 260" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="rules-ask" d="M 720 260 L 810 260" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:6">
<path data-graph-role="automatic-crossover-underlay" d="M 980 260 L 1027 260 Q 1035 260 1035 268 L 1035 326.9 Q 1035 334.9 1043 334.9 L 1090 334.9" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="ask-llm" d="M 980 260 L 1027 260 Q 1035 260 1035 268 L 1035 326.9 Q 1035 334.9 1043 334.9 L 1090 334.9" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:7">
<path data-graph-role="automatic-crossover-underlay" d="M 1090 351 L 1043 351 Q 1035 351 1035 359 L 1035 420 Q 1035 428 1027 428 L 980 428" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="llm-probs" d="M 1090 351 L 1043 351 Q 1035 351 1035 359 L 1035 420 Q 1035 428 1027 428 L 980 428" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:8">
<path data-graph-role="automatic-crossover-underlay" d="M 810 428 L 720 428" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="probs-calib" d="M 810 428 L 720 428" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:9">
<path data-graph-role="automatic-crossover-underlay" d="M 550 428 L 503 428 Q 495 428 495 420 L 495 381.05 Q 495 373.05 487 373.05 L 440 373.05" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="calib-api" d="M 550 428 L 503 428 Q 495 428 495 420 L 495 381.05 Q 495 373.05 487 373.05 L 440 373.05" class="a-emphasis" stroke-width="1.8" marker-end="url(#cv-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:10">
<path data-graph-role="automatic-crossover-underlay" d="M 360 528 L 360 533.5 Q 360 539 365.5 539 L 615.5 539 Q 621 539 621 544.5 L 621 550" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="api-store" d="M 360 528 L 360 533.5 Q 360 539 365.5 539 L 615.5 539 Q 621 539 621 544.5 L 621 550" class="a-dashed" stroke-width="1.5" marker-end="url(#cv-ar-arrow-dashed)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:11">
<path data-graph-role="automatic-crossover-underlay" d="M 635 550 L 635 460" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="store-calib" d="M 635 550 L 635 460" class="a-dashed" stroke-width="1.5" marker-end="url(#cv-ar-arrow-dashed)"/>
</g>
<g data-node-id="app">
<rect x="280" y="30" width="160" height="60" rx="6" class="c-mask"/>
<rect x="280" y="30" width="160" height="60" rx="6" class="c-frontend" stroke-width="1.5"/>
<text x="360" y="58" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Your app</text>
<text data-detail="context" x="360" y="74" class="t-muted" font-size="9" text-anchor="middle">Python or TypeScript SDK</text>
</g>
<g data-node-id="n8n">
<rect x="40" y="224" width="160" height="60" rx="6" class="c-mask"/>
<rect x="40" y="224" width="160" height="60" rx="6" class="c-frontend" stroke-width="1.5"/>
<text x="120" y="252" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">n8n workflow</text>
<text data-detail="context" x="120" y="268" class="t-muted" font-size="9" text-anchor="middle">Curva Route node</text>
</g>
<g data-node-id="agent">
<rect x="40" y="314" width="160" height="60" rx="6" class="c-mask"/>
<rect x="40" y="314" width="160" height="60" rx="6" class="c-frontend" stroke-width="1.5"/>
<text x="120" y="342" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">AI agent</text>
<text data-detail="context" x="120" y="358" class="t-muted" font-size="9" text-anchor="middle">decide tool</text>
</g>
<g data-node-id="tool">
<rect x="40" y="404" width="160" height="60" rx="6" class="c-mask"/>
<rect x="40" y="404" width="160" height="60" rx="6" class="c-frontend" stroke-width="1.5"/>
<text x="120" y="432" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Any HTTP tool</text>
<text data-detail="context" x="120" y="448" class="t-muted" font-size="9" text-anchor="middle">Zapier, Make, curl</text>
</g>
<g data-node-id="api">
<rect x="280" y="160" width="160" height="368" rx="6" class="c-mask"/>
<rect x="280" y="160" width="160" height="368" rx="6" class="c-backend" stroke-width="1.5"/>
<text x="360" y="342" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Curva API</text>
<text data-detail="context" x="360" y="358" class="t-muted" font-size="9" text-anchor="middle">decide, feedback, metrics</text>
</g>
<g data-node-id="rules">
<rect x="550" y="228" width="170" height="64" rx="6" class="c-mask"/>
<rect x="550" y="228" width="170" height="64" rx="6" class="c-backend" stroke-width="1.5"/>
<text x="635" y="258" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Rules and cache</text>
<text data-detail="context" x="635" y="274" class="t-muted" font-size="9" text-anchor="middle">settled with no model call</text>
</g>
<g data-node-id="ask">
<rect x="810" y="228" width="170" height="64" rx="6" class="c-mask"/>
<rect x="810" y="228" width="170" height="64" rx="6" class="c-backend" stroke-width="1.5"/>
<text x="895" y="258" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Ask twice</text>
<text data-detail="context" x="895" y="274" class="t-muted" font-size="9" text-anchor="middle">both option orders</text>
</g>
<g data-node-id="llm">
<rect x="1090" y="160" width="170" height="368" rx="6" class="c-mask"/>
<rect x="1090" y="160" width="170" height="368" rx="6" class="c-external" stroke-width="1.5"/>
<text x="1175" y="342" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Your LLM provider</text>
<text data-detail="context" x="1175" y="358" class="t-muted" font-size="9" text-anchor="middle">OpenAI, Anthropic, Ollama</text>
</g>
<g data-node-id="probs">
<rect x="810" y="396" width="170" height="64" rx="6" class="c-mask"/>
<rect x="810" y="396" width="170" height="64" rx="6" class="c-backend" stroke-width="1.5"/>
<text x="895" y="426" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Read probabilities</text>
<text data-detail="context" x="895" y="442" class="t-muted" font-size="9" text-anchor="middle">one per label, both orders</text>
</g>
<g data-node-id="calib">
<rect x="550" y="396" width="170" height="64" rx="6" class="c-mask"/>
<rect x="550" y="396" width="170" height="64" rx="6" class="c-security" stroke-width="1.5"/>
<text x="635" y="426" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Calibrator</text>
<text data-detail="context" x="635" y="442" class="t-muted" font-size="9" text-anchor="middle">fitted from your labels</text>
</g>
<g data-node-id="store">
<rect x="550" y="550" width="170" height="64" rx="6" class="c-mask"/>
<rect x="550" y="550" width="170" height="64" rx="6" class="c-database" stroke-width="1.5"/>
<text x="635" y="580" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Embedded SQLite</text>
<text data-detail="context" x="635" y="596" class="t-muted" font-size="9" text-anchor="middle">audit log, feedback labels</text>
</g>
<g data-detail="context" data-edge-id="app-in">
<rect x="324" y="118" width="30" height="14" rx="3" class="c-mask"/>
<text x="339" y="128" class="t-edge-emphasis" font-size="8" text-anchor="middle">SDK</text>
</g>
<g data-detail="context" data-edge-id="n8n-in">
<rect x="215.8" y="272" width="48.4" height="14" rx="3" class="c-mask"/>
<text x="240" y="282" class="t-edge-default" font-size="8" text-anchor="middle">n8n node</text>
</g>
<g data-detail="context" data-edge-id="agent-in">
<rect x="205" y="324" width="30" height="14" rx="3" class="c-mask"/>
<text x="220" y="334" class="t-edge-default" font-size="8" text-anchor="middle">MCP</text>
</g>
<g data-detail="context" data-edge-id="tool-in">
<rect x="215.8" y="376" width="48.4" height="14" rx="3" class="c-mask"/>
<text x="240" y="386" class="t-edge-default" font-size="8" text-anchor="middle">HTTP API</text>
</g>
<g data-detail="context" data-edge-id="api-rules">
<rect x="475.6" y="273.95" width="38.8" height="14" rx="3" class="c-mask"/>
<text x="495" y="283.95" class="t-edge-emphasis" font-size="8" text-anchor="middle">decide</text>
</g>
<g data-detail="context" data-edge-id="rules-ask">
<rect x="740.8" y="240" width="48.4" height="14" rx="3" class="c-mask"/>
<text x="765" y="250" class="t-edge-emphasis" font-size="8" text-anchor="middle">the rest</text>
</g>
<g data-detail="context" data-edge-id="ask-llm">
<rect x="1003.6" y="277.45" width="62.8" height="14" rx="3" class="c-mask"/>
<text x="1035" y="287.45" class="t-edge-emphasis" font-size="8" text-anchor="middle">both orders</text>
</g>
<g data-detail="context" data-edge-id="llm-probs">
<rect x="998.8" y="369.5" width="72.4" height="14" rx="3" class="c-mask"/>
<text x="1035" y="379.5" class="t-edge-emphasis" font-size="8" text-anchor="middle">probabilities</text>
</g>
<g data-detail="context" data-edge-id="probs-calib">
<rect x="740.8" y="408" width="48.4" height="14" rx="3" class="c-mask"/>
<text x="765" y="418" class="t-edge-emphasis" font-size="8" text-anchor="middle">averaged</text>
</g>
<g data-detail="context" data-edge-id="calib-api">
<rect x="461.2" y="380.525" width="67.6" height="14" rx="3" class="c-mask"/>
<text x="495" y="390.525" class="t-edge-emphasis" font-size="8" text-anchor="middle">typed answer</text>
</g>
<g data-detail="context" data-edge-id="api-store">
<rect x="447.1" y="519" width="86.8" height="14" rx="3" class="c-mask"/>
<text x="490.5" y="529" class="t-edge-dashed" font-size="8" text-anchor="middle">audit + feedback</text>
</g>
<g data-detail="context" data-edge-id="store-calib">
<rect x="566.2" y="498" width="62.8" height="14" rx="3" class="c-mask"/>
<text x="597.6" y="508" class="t-edge-dashed" font-size="8" text-anchor="middle">true labels</text>
</g>
<g data-graph-role="structural-frame-label">
<rect data-graph-role="structural-frame-label-mask" x="254" y="140" width="172" height="16" rx="3" class="c-mask"/>
<text x="258" y="153" class="t-cloud" font-size="9" font-weight="600">Your servers: one Curva binary</text>
</g>
</svg>`

export const html = ({ esc }) => `<section class="cv-scene cv-arch" data-scene="architecture" aria-labelledby="cv-ar-h">
  <div class="cv-ar-in">
    <h2 id="cv-ar-h">How Curva fits in your stack.</h2>
    <p class="cv-ar-lede">Your app calls Curva on your own server. Curva asks your model, reads a probability for every option, and sends back one of your labels.</p>
    <figure class="cv-ar-fig" tabindex="0" aria-label="Curva architecture diagram, scrolls sideways on small screens">
${SVG}
    </figure>
    <ul class="cv-ar-uses">
${USES.map((u) => `      <li><span class="cv-ar-via">${esc(u.via)}</span><h3>${esc(u.name)}</h3><p>${esc(u.line)}</p></li>`).join('\n')}
    </ul>
  </div>
</section>`

// Scroll-scrubbed trace: the solid routes draw in, in archify's route order, as the diagram crosses the viewport.
export function init(el, { gsap }) {
  const paths = [...el.querySelectorAll('.cv-ar-fig path[data-edge-id]:not(.a-dashed)')]
  const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.cv-ar-fig'), start: 'top 80%', end: 'center 55%', scrub: 1 } })
  paths.forEach((p, i) => {
    const len = p.getTotalLength()
    const head = p.getAttribute('marker-end') // the arrowhead lands when its line arrives
    tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len, attr: { 'marker-end': 'none' } }, { strokeDashoffset: 0, ease: 'none', duration: 1 }, i * 0.5)
      .set(p, { attr: { 'marker-end': head } }, i * 0.5 + 1)
  })
}
