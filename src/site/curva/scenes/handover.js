// Scene "handover" (PAPER): automate the sure answers, send the rest to a person. A short plain-language block
// (min_confidence -> abstain) beside the coverage-set idea as two chip rows. Copy: Content Box/1 Product/features.md.
export const id = 'handover'

export const html = () => `<section class="cv-scene cv-handover" data-scene="handover" aria-labelledby="cv-ho-title">
  <div class="cv-ho-in">
    <div class="cv-ho-text">
      <h2 class="cv-ho-title" id="cv-ho-title">Automate the sure answers. Send the rest to a person.</h2>
      <p class="cv-ho-lede">Set how sure Curva must be (<code>min_confidence</code>). Below that, it says it isn't sure (<code>abstain: true</code>) and hands the case to a person.</p>
    </div>
    <aside class="cv-ho-cov">
      <h3>Or ask for a short list that contains the right answer 95% of the time.</h3>
      <p class="cv-ho-code"><code>coverage: 0.95</code></p>
      <ul class="cv-ho-sets">
        <li><span class="cv-ho-chips"><b>billing</b></span><span>One option: automate.</span></li>
        <li><span class="cv-ho-chips"><b>billing</b><b>account</b></span><span>Several: show them, or route to a person.</span></li>
      </ul>
    </aside>
  </div>
</section>`

export function init() {} // ponytail: static scene; motion.js calls init on every scene
