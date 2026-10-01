import './site.css'

// Diagrams ship as Mermaid source (readable without JS); render them only where a post has one.
const diagrams = document.querySelectorAll('pre.mermaid')
if (diagrams.length) {
  import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      fontFamily: 'Funnel Sans, system-ui, sans-serif',
      themeVariables: {
        primaryColor: '#ffffff',
        primaryBorderColor: '#161616',
        primaryTextColor: '#161616',
        lineColor: '#52555A',
        secondaryColor: '#f4f4f1',
        tertiaryColor: '#f4f4f1',
        fontSize: '15px',
      },
    })
    mermaid.run({ nodes: diagrams })
  })
}

// Footer: the landing's animated particle wordmark, mounted with the page (it sits below the fold,
// so it's ready before anyone scrolls to it). Reduced motion keeps the still dotted SVG.
const wordmark = document.querySelector('.foot-wordmark')
if (wordmark && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  Promise.all([
    import('react'),
    import('react-dom/client'),
    import('@designcodeio/threeui'),
    import('./footer.js'),
    import('@designcodeio/threeui/style.css'),
  ]).then(([{ createElement }, { createRoot }, { TextAnimationCollection }, { WORDMARK_PROPS }]) => {
    wordmark.textContent = ''
    createRoot(wordmark).render(createElement(TextAnimationCollection, WORDMARK_PROPS))
  })
}

// The Crowkis page's motion engine, only where its scenes are on the page.
const ck = document.querySelector('[data-ck]')
if (ck) import('./crowkis/motion.js').then((m) => m.start(ck))

// Copy buttons: a code block's source, or the URL in data-copy.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]')
  if (!btn) return
  const text = btn.dataset.copy || btn.closest('figure').querySelector('code').textContent
  navigator.clipboard.writeText(text).then(() => {
    btn.dataset.label ??= btn.textContent
    btn.textContent = 'Copied'
    setTimeout(() => (btn.textContent = btn.dataset.label), 1400)
  })
})
