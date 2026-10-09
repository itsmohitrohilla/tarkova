import './global.css'
import './App.css'
import './index.css'
import { painted } from './paint.js'

// The hero is plain HTML (index.html), styled by the stylesheets above. Everything below it is rendered from
// here, and only once the hero is on the screen (paint.js). Started any earlier, the app's stylesheets and
// scripts can finish before the first paint and hold it back until the whole app has loaded (seconds on a slow phone).
painted.then(() =>
  Promise.all([import('react'), import('react-dom/client'), import('./App.jsx')]).then(([{ StrictMode, createElement }, { createRoot }, { default: App }]) => {
    createRoot(document.getElementById('root')).render(createElement(StrictMode, null, createElement(App)))
  }),
)
