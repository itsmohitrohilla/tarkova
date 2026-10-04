import './global.css'
import './App.css'
import './index.css'

// The hero is plain HTML (index.html), styled by the stylesheets above. Everything below it is rendered from
// here and loaded after the hero, so its script never competes with the hero's photo and styles.
Promise.all([import('react'), import('react-dom/client'), import('./App.jsx')]).then(([{ StrictMode, createElement }, { createRoot }, { default: App }]) => {
  createRoot(document.getElementById('root')).render(createElement(StrictMode, null, createElement(App)))
})
