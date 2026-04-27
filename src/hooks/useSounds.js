import { useRef, useCallback } from 'react'

// Synthesise simple sounds with Web Audio API — no external files needed
export function useSounds() {
  const ctx = useRef(null)

  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }

  const playTone = useCallback((freq, type, dur, vol = 0.3, detune = 0) => {
    try {
      const c = getCtx()
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, c.currentTime)
      osc.detune.setValueAtTime(detune, c.currentTime)
      gain.gain.setValueAtTime(vol, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
      osc.start(c.currentTime)
      osc.stop(c.currentTime + dur)
    } catch (e) {}
  }, [])

  const playEngine = useCallback((speed) => {
    try {
      const c = getCtx()
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(80 + speed * 40, c.currentTime)
      gain.gain.setValueAtTime(0.05, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1)
      osc.start(c.currentTime)
      osc.stop(c.currentTime + 0.1)
    } catch (e) {}
  }, [])

  const playHit = useCallback(() => {
    playTone(200, 'square', 0.15, 0.4)
    playTone(100, 'sawtooth', 0.2, 0.3)
  }, [playTone])

  const playJump = useCallback(() => {
    try {
      const c = getCtx()
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, c.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      osc.start(c.currentTime)
      osc.stop(c.currentTime + 0.15)
    } catch (e) {}
  }, [])

  const playCollect = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.2, 0.25), i * 60)
    })
  }, [playTone])

  const playBoost = useCallback(() => {
    playTone(150, 'sawtooth', 0.3, 0.2)
    playTone(300, 'sawtooth', 0.3, 0.1)
  }, [playTone])

  return { playEngine, playHit, playJump, playCollect, playBoost }
}
