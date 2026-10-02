// Scene "handover" (PAPER): automate the sure answers, send the rest to a person.
// A stream of ten example decisions, each a confidence bar, crossed by one `min_confidence` line. Rows at or
// above it are automated; rows below come back `abstain: true`. The threshold is a radio group, so the split
// works with CSS alone (`:has`), including reduced motion where init never runs; default 0.8, as in the
// support-triage recipe. Beside it, the coverage-set idea as two chip rows. Motion: bars fill on scroll (scrub).
export const id = 'handover'

const T = [0.5, 0.6, 0.7, 0.8, 0.9]
const T0 = 0.8
// Example tickets and answers (illustrative, not measured).
const ROWS = [
  ['Charged twice, refund please', 'billing', 0.97],
  ['App crashes on login', 'technical', 0.91],
  ['Can I change my plan?', 'account', 0.58],
  ['Reset my password', 'account', 0.88],
  ['Invoice looks wrong after upgrade', 'billing', 0.74],
  ['Error 500 on export', 'technical', 0.95],
  ['Please update my details', 'account', 0.66],
  ['Update the card on file', 'billing', 0.83],
  ['It just does not work', 'technical', 0.52],
  ['Close my account', 'account', 0.93],
]
const k = (t) => Math.round(t * 10) // 0.8 -> 8, for class and id names
const auto = (t) => ROWS.filter((r) => r[2] >= t).length

export const html = () => `<section class="cv-scene cv-handover" data-scene="handover">
  <div class="cv-ho-in">
    <h2 class="cv-ho-title">Automate the sure answers. Send the rest to a person.</h2>
    <p class="cv-ho-lede">Set <code>min_confidence</code>. Unsure answers come back with <code>abstain: true</code>. Once calibrated, the bar means what it says.</p>
    <div class="cv-ho-grid">
      <div class="cv-ho-desk">
        <fieldset class="cv-ho-set">
          <legend><code>min_confidence</code></legend>
          ${T.map((t) => `<label><input type="radio" name="cv-ho-t" value="${t}" id="cv-ho-t${k(t)}"${t === T0 ? ' checked' : ''} /><span>${t.toFixed(1)}</span></label>`).join('')}
        </fieldset>
        <p class="cv-ho-tally" aria-live="polite">${T.map((t) => `<span class="cv-ho-n" data-t="${k(t)}"><b>${auto(t)}</b> automated <i>·</i> <b>${ROWS.length - auto(t)}</b> to a person</span>`).join('')}</p>
        <div class="cv-ho-list" role="list">
          ${ROWS.map(([q, a, c]) => `<div class="cv-ho-row ${T.filter((t) => c < t).map((t) => `lo${k(t)}`).join(' ')}" role="listitem">
            <span class="cv-ho-q">${q}</span><b class="cv-ho-chip">${a}</b><span class="cv-ho-bar" aria-hidden="true"><i style="--v:${c}"></i></span><span class="cv-ho-c">${c.toFixed(2)}</span><span class="cv-ho-to"><span class="cv-ho-auto">automated</span><code class="cv-ho-abs">abstain: true</code></span>
          </div>`).join('\n          ')}
          <span class="cv-ho-line" aria-hidden="true"><i></i></span>
        </div>
      </div>
      <aside class="cv-ho-cov">
        <h3>Or ask for a set that contains the right answer 95% of the time.</h3>
        <p class="cv-ho-code"><code>coverage: 0.95</code></p>
        <ul class="cv-ho-sets">
          <li><span class="cv-ho-chips"><b>billing</b></span><span>One option: automate.</span></li>
          <li><span class="cv-ho-chips"><b>billing</b><b>account</b></span><span>Several: show them, or route to a person.</span></li>
        </ul>
        <p class="cv-ho-note">Once a question has 30 feedback labels.</p>
      </aside>
    </div>
  </div>
</section>`

export function init(el, { gsap }) {
  gsap.from(el.querySelectorAll('.cv-ho-bar i'), {
    scaleX: 0, ease: 'none', stagger: 0.06,
    scrollTrigger: { trigger: el.querySelector('.cv-ho-list'), start: 'top 88%', end: 'bottom 62%', scrub: 0.8, refreshPriority: -3 },
  })
}
