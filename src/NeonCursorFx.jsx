import { useEffect } from 'react'

// Purely visual, app-wide "neon touch" effect: on every click/tap anywhere
// in the app, spawns a small glowing ripple at the pointer position. Uses
// direct DOM manipulation (not React state) so it never triggers re-renders
// and works identically across the landing page and the chat screen.
export default function NeonCursorFx() {
  useEffect(() => {
    function handlePointerDown(e) {
      const x = e.clientX
      const y = e.clientY
      if (x === undefined || y === undefined) return

      const ripple = document.createElement('div')
      ripple.className = 'ym-neon-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      document.body.appendChild(ripple)

      const remove = () => ripple.remove()
      ripple.addEventListener('animationend', remove)
      // Safety net in case the animationend event doesn't fire
      setTimeout(remove, 800)
    }

    document.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return null
}
