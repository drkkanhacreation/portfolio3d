import React, { Suspense } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingScreen />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <HUD />
    </div>
  )
}
