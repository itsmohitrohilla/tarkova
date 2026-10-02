// The Curva page: a "calibration lab" piece. Same contract as the Crowkis page — every word is
// server-rendered; each scene owns its markup (`html`, Node) and motion (`init`, browser, via ./motion.js).
import { scenes } from './scenes.js'

// Page-level copy, sourced from curva/Content Box (claim rules there apply to every line).
export const CV_META = {
  title: 'Curva: typed decisions with calibrated probabilities, from any LLM',
  description: 'Send your data and a typed question. Get back one of your labels and a probability for every option, never free text. Free to use, on your own servers, with any model.',
}

export const curvaMain = (ctx) => `<div class="cv" data-cv>\n${scenes.map((s) => s.html(ctx)).join('\n')}\n</div>`

// Set before first paint so scenes can style pre-motion states (under `html.cv-motion`) without a flash;
// dropped after 4s if the motion bundle never starts.
export const CV_HEAD = `<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('cv-motion');setTimeout(function(){if(!window.__cv)document.documentElement.classList.remove('cv-motion')},4000)}</script>
`
