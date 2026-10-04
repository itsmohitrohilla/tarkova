import './music.css'

// Background music on every page, with one mute button. Each page load is a fresh document, so the track
// position and the mute choice are saved and restored: the music picks up where it left off instead of restarting.
// Browsers block sound until the visitor interacts, so playback starts on the first click, tap or key press.
const SOUND = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a3.5 3.5 0 0 1 0 6"/><path d="M18.5 6.5a7 7 0 0 1 0 11"/></svg>'
const MUTED = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>'

// Storage can throw (private mode, blocked site data); music must still work without it.
const read = (store, key) => { try { return store.getItem(key) } catch { return null } }
const write = (store, key, v) => { try { store.setItem(key, v) } catch {} }

export function mountMusic() {
  if (document.querySelector('.mute')) return
  // The track is 3.9 MB, so it is fetched only once it will be heard: on the first click, tap or key press,
  // or straight away on later pages of a visit where it was already playing.
  const audio = Object.assign(new Audio('/music.mp3'), { loop: true, preload: 'none' })
  let muted = read(localStorage, 'tk-muted') === '1'
  audio.muted = muted
  const at = Number(read(sessionStorage, 'tk-music-t')) || 0
  audio.addEventListener('loadedmetadata', () => { if (at < audio.duration) audio.currentTime = at }, { once: true })

  const btn = document.createElement('button')
  btn.className = 'mute'
  const paint = () => {
    btn.innerHTML = muted ? MUTED : SOUND
    btn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music')
    btn.setAttribute('aria-pressed', String(muted))
  }
  paint()
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    muted = !muted
    audio.muted = muted
    write(localStorage, 'tk-muted', muted ? '1' : '0')
    paint()
    if (!muted) audio.play().catch(() => {})
  })
  document.body.append(btn)

  const play = () => audio.play().catch(() => {})
  if (read(sessionStorage, 'tk-music-t') !== null) play()
  const onGesture = () => { play(); removeEventListener('pointerdown', onGesture); removeEventListener('keydown', onGesture) }
  addEventListener('pointerdown', onGesture)
  addEventListener('keydown', onGesture)
  // Save the position when leaving, so the next page resumes from here.
  addEventListener('pagehide', () => write(sessionStorage, 'tk-music-t', String(audio.currentTime)))
}
