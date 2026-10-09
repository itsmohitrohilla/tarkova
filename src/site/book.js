// Book a demo + the contact form: one section for every page that carries it. The static pages render it in
// Node (pages.js) and wire it from site.js; the landing renders the same markup from React (App.jsx).
// Styles are in book.css; the form posts to api/contact.js.
import { runDots } from '../dots.js'

const CAL = 'https://cal.com/mohit-rohilla-s5pftm/30min'

// A shape drawn in dots, as the grid draws everything: 'x' is a lit dot. Its columns light in turn, left to right.
const dots = (rows, cls) =>
  `<svg class="book-dots ${cls}" viewBox="0 0 ${rows[0].length * 5} ${rows.length * 5}" aria-hidden="true">${rows
    .map((row, j) => [...row].map((on, i) => (on === 'x' ? `<circle cx="${i * 5 + 2.5}" cy="${j * 5 + 2.5}" r="1.7" style="animation-delay:${i / 10}s"/>` : '')).join(''))
    .join('')}</svg>`
const ARROW = dots(['....x..', '.....x.', 'xxxxxxx', '.....x.', '....x..'], 'book-arrow')
const TICK = dots(['.......x', '......x.', '.....x..', 'x...x...', '.x.x....', '..x.....'], 'book-tick')

// title and line are our own copy (HTML allowed). band: the section brings its dark ground, for the pages that
// are not dark. blend: the page above ends in colour, which fades into that ground (book.css).
// page: it is the whole page (/contact/). level: the heading level of its title.
export function bookHTML({ title = 'Book your demo <em>today.</em>', line = 'A 30 minute call. Bring your stack and your questions.', band = false, blend = false, page = false, level = 2 } = {}) {
  return `<section class="book${band ? ' band' : ''}${blend ? ' blend' : ''}${page ? ' page' : ''}" aria-labelledby="book-h">
<canvas class="book-art" aria-hidden="true"></canvas>
<div class="book-copy">
  <h${level} class="book-title" id="book-h">${title}</h${level}>
  <p>${line}</p>
  <a class="book-cta" href="${CAL}" target="_blank" rel="noopener">Pick a time ${ARROW}</a>
</div>
<form class="book-form" method="post">
  <h${level + 1} class="book-or">Or write to us.</h${level + 1}>
  <label><span>Hi, I'm</span><input name="name" placeholder="your name" required maxlength="120" autocomplete="name" /></label>
  <label><span>Reach me at</span><input name="email" type="email" placeholder="you@company.com" required maxlength="200" autocomplete="email" /></label>
  <label class="book-msg"><span>I'd like to talk about</span><textarea name="message" placeholder="what you're building" required maxlength="4000" rows="3"></textarea></label>
  <input class="sr" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" />
  ${TICK}
  <div class="book-send"><p class="book-note" role="status"></p><button><span>Send</span>${ARROW}</button></div>
</form>
</section>`
}

// Starts the moving grid and wires the form inside `root`. Returns a function that undoes both.
export function mountBook(root) {
  const stop = runDots(root.querySelector('.book-art'), 'week')
  const form = root.querySelector('.book-form'), note = form.querySelector('.book-note'), button = form.querySelector('button'), label = button.firstChild

  const send = async (e) => {
    e.preventDefault()
    const body = JSON.stringify(Object.fromEntries(new FormData(form)))
    button.disabled = true
    label.textContent = 'Sending…'
    note.className = 'book-note'
    note.textContent = ''
    // The trailing slash matters: vercel.json's trailingSlash answers /api/contact with a redirect first.
    const res = await fetch('/api/contact/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => null)
    if (res?.ok) {
      form.classList.add('sent') // book.css swaps the letter for the tick
      note.textContent = "Thanks. We'll reply by email."
      return
    }
    // The server's own words when it has some (a field to fix, or how long to wait); textContent, so never markup.
    const out = await res?.json().catch(() => null)
    button.disabled = false
    label.textContent = 'Send'
    note.className = 'book-note error'
    note.textContent = out?.error || 'That did not send. Please try again.'
  }

  form.addEventListener('submit', send)
  return () => { stop(); form.removeEventListener('submit', send) }
}
