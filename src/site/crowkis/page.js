// The Crowkis page as a scroll-driven motion piece. Every word is server-rendered (crawlers read all of
// it); each scene module owns its markup (`html`, Node) and its motion (`init`, browser, via ./motion.js).
import { scenes } from './scenes.js'

export const crowkisMain = (ctx) => `<div class="ck" data-ck>\n${scenes.map((s) => s.html(ctx)).join('\n')}\n</div>`

// Runs before first paint, so scenes can style their pre-motion state (under `html.ck-motion`) without a
// flash. If the motion bundle never starts (JS error, blocked), the class drops and the page shows as-is.
// The hero tagline is set large in the serif; preloading it stops the fallback font's swap from shifting the hero.
export const CK_HEAD = `<link rel="preload" href="/InstrumentSerif-Italic.woff2" as="font" type="font/woff2" crossorigin />
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('ck-motion');setTimeout(function(){if(!window.__ck)document.documentElement.classList.remove('ck-motion')},location.hostname==='localhost'?20000:4000)}</script>
`
