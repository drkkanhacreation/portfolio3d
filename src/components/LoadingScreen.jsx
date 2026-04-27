import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store'

export default function LoadingScreen() {
  const { loaded, loadingProgress } = useGameStore()
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (loaded) {
      setTimeout(() => setFadeOut(true), 500)
      setTimeout(() => setVisible(false), 1500)
    }
  }, [loaded])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0d0d1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 1s ease',
      opacity: fadeOut ? 0 : 1,
      pointerEvents: fadeOut ? 'none' : 'all',
    }}>
      {/* Animated car icon */}
      <div style={{ fontSize: 64, marginBottom: 24, animation: 'bounce 1s infinite' }}>🚗</div>

      <div style={{
        fontFamily: '"Courier New", monospace',
        color: '#f4d03f',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 6,
        marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        SWADHINJIT SAHOO
      </div>

      <div style={{
        color: '#888',
        fontSize: 12,
        letterSpacing: 4,
        marginBottom: 48,
        textTransform: 'uppercase',
      }}>
        Interactive Portfolio
      </div>

      {/* Progress bar */}
      <div style={{
        width: 280,
        height: 4,
        background: '#222',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        <div style={{
          width: `${Math.max(loadingProgress * 100, loaded ? 100 : 5)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #f4d03f, #e67e22)',
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ color: '#555', fontSize: 11, letterSpacing: 3 }}>
        LOADING{dots}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
