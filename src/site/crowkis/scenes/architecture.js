// Scene "architecture" (WHITE): where Crowkis sits in a stack, as an inline SVG drawn with archify
// (github.com/tt-a1i/archify, `finalize --quality showcase` passed) and restyled here by class.
// Facts: products.js (protocols, five checks, 0.4 ms, self-hosted), the pipeline scene (check names), explain scene
// (a miss runs your model once), crowkis README (anti-poisoning write pipeline, PII scrubbing, per-tenant isolation).
// The SVG is archify's output minus its legend, grid, icons and viewer-only attributes.
export const id = 'architecture'

const SVG = `<svg viewBox="28 2 852 494" role="img" aria-labelledby="ck-ar-title ck-ar-desc">
<title id="ck-ar-title">How Crowkis fits in your stack</title>
<desc id="ck-ar-desc">Your app asks Crowkis over RESP3, gRPC, REST or MCP. Crowkis reads the meaning and structure of the question and searches its cached answers. The nearest answer must pass five checks: similarity, template, confidence, trust and freshness. A hit goes back to your app in about 0.4 ms. On a miss your app calls your LLM once and stores the answer, which passes the write checks before Crowkis keeps it.</desc>
<defs>
<marker id="ck-ar-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-default" />
</marker>
<marker id="ck-ar-arrow-emphasis" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-emphasis" />
</marker>
<marker id="ck-ar-arrow-security" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-security" />
</marker>
<marker id="ck-ar-arrow-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" class="m-dashed" />
</marker>
</defs>
<rect data-graph-role="structural-frame" x="290" y="10" width="575" height="474" rx="12" class="c-region" stroke-width="1"/>
<g data-graph-role="automatic-crossover" style="--step:0">
<path data-graph-role="automatic-crossover-underlay" d="M 210 223.95 L 320 223.95" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="ask" d="M 210 223.95 L 320 223.95" class="a-emphasis" stroke-width="1.8" marker-end="url(#ck-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:1">
<path data-graph-role="automatic-crossover-underlay" d="M 500 223.95 L 600 223.95" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="search" d="M 500 223.95 L 600 223.95" class="a-emphasis" stroke-width="1.8" marker-end="url(#ck-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:2">
<path data-graph-role="automatic-crossover-underlay" d="M 699.1 200 L 699.1 104" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="candidate" d="M 699.1 200 L 699.1 104" class="a-emphasis" stroke-width="1.8" marker-end="url(#ck-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:3">
<path data-graph-role="automatic-crossover-underlay" d="M 683 104 L 683 120 Q 683 128 675 128 L 133 128 Q 125 128 125 136 L 125 200" fill="none" stroke="var(--mask)" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="hit" d="M 683 104 L 683 120 Q 683 128 675 128 L 133 128 Q 125 128 125 136 L 125 200" class="a-emphasis" stroke-width="1.8" marker-end="url(#ck-ar-arrow-emphasis)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:4">
<path data-graph-role="automatic-crossover-underlay" d="M 125 264 L 125 400" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="miss" d="M 125 264 L 125 400" class="a-default" stroke-width="1.5" marker-end="url(#ck-ar-arrow)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:5">
<path data-graph-role="automatic-crossover-underlay" d="M 210 239 L 257 239 Q 265 239 265 247 L 265 424 Q 265 432 273 432 L 320 432" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="store" d="M 210 239 L 257 239 Q 265 239 265 247 L 265 424 Q 265 432 273 432 L 320 432" class="a-dashed" stroke-width="1.5" marker-end="url(#ck-ar-arrow-dashed)"/>
</g>
<g data-graph-role="automatic-crossover" style="--step:6">
<path data-graph-role="automatic-crossover-underlay" d="M 500 432 L 542 432 Q 550 432 550 424 L 550 247 Q 550 239 558 239 L 600 239" fill="none" stroke="var(--mask)" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>
<path data-edge-id="bank" d="M 500 432 L 542 432 Q 550 432 550 424 L 550 247 Q 550 239 558 239 L 600 239" class="a-dashed" stroke-width="1.5" marker-end="url(#ck-ar-arrow-dashed)"/>
</g>
<g data-node-id="app">
<rect x="40" y="200" width="170" height="64" rx="6" class="c-mask"/>
<rect x="40" y="200" width="170" height="64" rx="6" class="c-frontend" stroke-width="1.5"/>
<text x="125" y="230" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Your app</text>
<text data-detail="context" x="125" y="246" class="t-muted" font-size="9" text-anchor="middle">RESP3, gRPC, REST or MCP</text>
</g>
<g data-node-id="llm">
<rect x="40" y="400" width="170" height="64" rx="6" class="c-mask"/>
<rect x="40" y="400" width="170" height="64" rx="6" class="c-external" stroke-width="1.5"/>
<text x="125" y="430" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Your LLM</text>
<text data-detail="context" x="125" y="446" class="t-muted" font-size="9" text-anchor="middle">called only on a miss</text>
</g>
<g data-node-id="understand">
<rect x="320" y="200" width="180" height="64" rx="6" class="c-mask"/>
<rect x="320" y="200" width="180" height="64" rx="6" class="c-backend" stroke-width="1.5"/>
<text x="410" y="230" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Understand</text>
<text data-detail="context" x="410" y="246" class="t-muted" font-size="9" text-anchor="middle">meaning + structure</text>
</g>
<g data-node-id="index">
<rect x="600" y="200" width="180" height="64" rx="6" class="c-mask"/>
<rect x="600" y="200" width="180" height="64" rx="6" class="c-database" stroke-width="1.5"/>
<text x="690" y="230" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Cached answers</text>
<text data-detail="context" x="690" y="246" class="t-muted" font-size="9" text-anchor="middle">vector index, per tenant</text>
</g>
<g data-node-id="checks">
<rect x="545" y="40" width="290" height="64" rx="6" class="c-mask"/>
<rect x="545" y="40" width="290" height="64" rx="6" class="c-security" stroke-width="1.5"/>
<text x="690" y="70" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Five checks</text>
<text data-detail="context" x="690" y="86" class="t-muted" font-size="9" text-anchor="middle">similarity, template, confidence, trust, freshness</text>
</g>
<g data-node-id="write">
<rect x="320" y="400" width="180" height="64" rx="6" class="c-mask"/>
<rect x="320" y="400" width="180" height="64" rx="6" class="c-security" stroke-width="1.5"/>
<text x="410" y="430" class="t-primary" font-size="11" font-weight="600" text-anchor="middle">Write checks</text>
<text data-detail="context" x="410" y="446" class="t-muted" font-size="9" text-anchor="middle">anti-poisoning, PII scrub</text>
</g>
<g data-detail="context" data-edge-id="ask">
<rect x="250" y="203.95" width="30" height="14" rx="3" class="c-mask"/>
<text x="265" y="213.95" class="t-edge-emphasis" font-size="8" text-anchor="middle">ask</text>
</g>
<g data-detail="context" data-edge-id="search">
<rect x="530.6" y="203.95" width="38.8" height="14" rx="3" class="c-mask"/>
<text x="550" y="213.95" class="t-edge-emphasis" font-size="8" text-anchor="middle">search</text>
</g>
<g data-detail="context" data-edge-id="candidate">
<rect x="677.3000000000001" y="180" width="43.6" height="14" rx="3" class="c-mask"/>
<text x="699.1" y="190" class="t-edge-emphasis" font-size="8" text-anchor="middle">nearest</text>
</g>
<g data-detail="context" data-edge-id="hit">
<rect x="334.2" y="108" width="139.6" height="14" rx="3" class="c-mask"/>
<text x="404" y="118" class="t-edge-emphasis" font-size="8" text-anchor="middle">hit: answer in about 0.4 ms</text>
</g>
<g data-detail="context" data-edge-id="miss">
<rect x="65.80000000000001" y="325" width="53.199999999999996" height="14" rx="3" class="c-mask"/>
<text x="92.4" y="335" class="t-edge-default" font-size="8" text-anchor="middle">on a miss</text>
</g>
<g data-detail="context" data-edge-id="store">
<rect x="231.2" y="315.5" width="67.6" height="14" rx="3" class="c-mask"/>
<text x="265" y="325.5" class="t-edge-dashed" font-size="8" text-anchor="middle">store answer</text>
</g>
<g data-detail="context" data-edge-id="bank">
<rect x="535" y="315.5" width="30" height="14" rx="3" class="c-mask"/>
<text x="550" y="325.5" class="t-edge-dashed" font-size="8" text-anchor="middle">kept</text>
</g>
<g data-graph-role="structural-frame-label">
<rect data-graph-role="structural-frame-label-mask" x="294" y="20" width="204.4" height="16" rx="3" class="c-mask"/>
<text x="298" y="33" class="t-cloud" font-size="9" font-weight="600">Your servers: Crowkis, built in Rust</text>
</g>
</svg>`

export const html = () => `<section class="ck-scene ck-arch" data-scene="architecture" aria-labelledby="ck-ar-h">
  <div class="ck-ar-in">
    <h2 id="ck-ar-h">How Crowkis fits in your stack.</h2>
    <p class="ck-ar-lede">Your app asks Crowkis first. A safe match comes back in about 0.4 ms. Anything else goes to your model once, and the answer is kept for next time.</p>
    <figure class="ck-ar-fig" tabindex="0" aria-label="Crowkis architecture diagram, scrolls sideways on small screens">
${SVG}
    </figure>
  </div>
</section>`

// Scroll-scrubbed trace: the solid routes draw in, in archify's route order, as the diagram crosses the viewport.
export function init(el, { gsap }) {
  const paths = [...el.querySelectorAll('.ck-ar-fig path[data-edge-id]:not(.a-dashed)')]
  const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.ck-ar-fig'), start: 'top 80%', end: 'center 55%', scrub: 1 } })
  paths.forEach((p, i) => {
    const len = p.getTotalLength()
    const head = p.getAttribute('marker-end') // the arrowhead lands when its line arrives
    tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len, attr: { 'marker-end': 'none' } }, { strokeDashoffset: 0, ease: 'none', duration: 1 }, i * 0.5)
      .set(p, { attr: { 'marker-end': head } }, i * 0.5 + 1)
  })
}
