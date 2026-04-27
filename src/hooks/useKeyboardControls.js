import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

const KEY_MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'backward', ArrowDown: 'backward',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'boost', ShiftRight: 'boost',
  KeyR: 'reset',
}

export function useKeyboardControls() {
  const setControl = useGameStore((s) => s.setControl)
  const phase = useGameStore((s) => s.phase)

  useEffect(() => {
    if (phase !== 'playing') return

    const onDown = (e) => {
      const action = KEY_MAP[e.code]
      if (action) {
        e.preventDefault()
        setControl(action, true)
      }
    }
    const onUp = (e) => {
      const action = KEY_MAP[e.code]
      if (action) setControl(action, false)
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [phase, setControl])
}
