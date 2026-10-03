import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Rendered synchronously, so the page exists (with its styles) before it is revealed below.
const root = createRoot(document.getElementById('root'))
flushSync(() => root.render(
  <StrictMode>
    <App />
  </StrictMode>,
))

// Reveal once the hero photo is ready too (at most 0.7 s), so the page fades in whole; see index.html.
const hero = document.querySelector('.bg')
Promise.race([hero?.decode(), new Promise((r) => setTimeout(r, 700))])
  .catch(() => {})
  .finally(() => document.documentElement.classList.add('ready'))
