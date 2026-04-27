import { useEffect, useRef } from 'react'

export function useControls() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    boost: false,
  })

  useEffect(() => {
    const onDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.forward  = true; break
        case 'KeyS': case 'ArrowDown':  keys.current.backward = true; break
        case 'KeyA': case 'ArrowLeft':  keys.current.left     = true; break
        case 'KeyD': case 'ArrowRight': keys.current.right    = true; break
        case 'Space':                   keys.current.jump     = true; e.preventDefault(); break
        case 'ShiftLeft': case 'ShiftRight': keys.current.boost = true; break
      }
    }
    const onUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    keys.current.forward  = false; break
        case 'KeyS': case 'ArrowDown':  keys.current.backward = false; break
        case 'KeyA': case 'ArrowLeft':  keys.current.left     = false; break
        case 'KeyD': case 'ArrowRight': keys.current.right    = false; break
        case 'Space':                   keys.current.jump     = false; break
        case 'ShiftLeft': case 'ShiftRight': keys.current.boost = false; break
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return keys
}
