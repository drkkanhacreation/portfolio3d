import React, { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Stars, AdaptiveDpr, Sky } from '@react-three/drei'
import { useGameStore } from '../store'
import Car from './Car'
import World from './World'
import Sections from './Sections'
import * as THREE from 'three'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerpColor(ref, target, speed, delta) {
  ref.lerp(target, 1 - Math.pow(1 - speed, delta * 60))
}
function lerpVal(current, target, speed, delta) {
  return current + (target - current) * (1 - Math.pow(1 - speed, delta * 60))
}

// ─── Scene Setup ─────────────────────────────────────────────────────────────

function SceneSetup({ cameraRef }) {
  const { camera } = useThree()
  const { setLoaded, setLoadingProgress } = useGameStore()

  useEffect(() => {
    cameraRef.current = camera
    camera.position.set(0, 8, 18)
    camera.fov = 65
    camera.updateProjectionMatrix()

    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 0.12
      setLoadingProgress(Math.min(p, 0.95))
      if (p >= 0.95) {
        clearInterval(interval)
        setTimeout(() => setLoaded(), 500)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return null
}

const NIGHT = {
  ambient:     new THREE.Color('#1a1c2e'),  ambientI: 0.4,
  sun:         new THREE.Color('#4466aa'),  sunI:     0.5,
  fill:        new THREE.Color('#0d1020'),  fillI:    0.3,
  ground:      new THREE.Color('#0a0c14'),  groundI:  0.2,
  fog:         new THREE.Color('#05060f'),  fogNear:  60,  fogFar: 220,
}

const DAY = {
  ambient:     new THREE.Color('#d4e8f5'),  ambientI: 0.8,
  sun:         new THREE.Color('#fff4d6'),  sunI:     2.5,
  fill:        new THREE.Color('#c8dde8'),  fillI:    0.6,
  ground:      new THREE.Color('#8abedc'),  groundI:  0.4,
  fog:         new THREE.Color('#c8dff0'),  fogNear:  80,  fogFar: 380,
}

function Environment() {
  const isDayMode = useGameStore((s) => s.isDayMode)

  const ambientRef  = useRef()
  const sunRef      = useRef()
  const fillRef     = useRef()
  const groundRef   = useRef()
  const fogRef      = useRef()

  // Pre-allocate target colors to avoid per-frame garbage
  const targets = useMemo(() => ({
    ambient: new THREE.Color(),
    sun:     new THREE.Color(),
    fill:    new THREE.Color(),
    ground:  new THREE.Color(),
    fog:     new THREE.Color(),
  }), [])

  useFrame((_, delta) => {
    const t = isDayMode ? DAY : NIGHT
    const s = 0.06 // lerp speed (smooth ≈ 1 second transition)

    // Ambient
    if (ambientRef.current) {
      targets.ambient.copy(t.ambient)
      lerpColor(ambientRef.current.color, targets.ambient, s, delta)
      ambientRef.current.intensity = lerpVal(ambientRef.current.intensity, t.ambientI, s, delta)
    }
    // Sun / main directional
    if (sunRef.current) {
      targets.sun.copy(t.sun)
      lerpColor(sunRef.current.color, targets.sun, s, delta)
      sunRef.current.intensity = lerpVal(sunRef.current.intensity, t.sunI, s, delta)
    }
    // Fill
    if (fillRef.current) {
      targets.fill.copy(t.fill)
      lerpColor(fillRef.current.color, targets.fill, s, delta)
      fillRef.current.intensity = lerpVal(fillRef.current.intensity, t.fillI, s, delta)
    }
    // Ground fill
    if (groundRef.current) {
      targets.ground.copy(t.ground)
      lerpColor(groundRef.current.color, targets.ground, s, delta)
      groundRef.current.intensity = lerpVal(groundRef.current.intensity, t.groundI, s, delta)
    }
    // Fog
    if (fogRef.current) {
      targets.fog.copy(t.fog)
      lerpColor(fogRef.current.color, targets.fog, s, delta)
      fogRef.current.near = lerpVal(fogRef.current.near, t.fogNear, s, delta)
      fogRef.current.far  = lerpVal(fogRef.current.far,  t.fogFar,  s, delta)
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.4} color="#1a1c2e" />

      <directionalLight
        ref={sunRef}
        position={[80, 120, 60]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        color="#fff4d6"
      />

      {/* Subtle bounce light from below */}
      <directionalLight ref={fillRef} position={[-60, 20, -60]} intensity={0.3} color="#c8dde8" />
      <directionalLight ref={groundRef} position={[0, -10, 0]} intensity={0.2} color="#8abedc" />

      <fog ref={fogRef} attach="fog" args={['#05060f', 60, 220]} />
    </>
  )
}

// ─── Realistic Sky ───────────────────────────────────────────────────────────

function RealisticSky() {
  const isDayMode = useGameStore((s) => s.isDayMode)
  const skyRef = useRef()
  const turbidity = useRef(8)
  const rayleigh = useRef(0.5)
  const sunPos = useRef([0.3, -0.1, 1])

  useFrame((_, delta) => {
    const targetTurbidity = isDayMode ? 8 : 20
    const targetRayleigh  = isDayMode ? 0.5 : 0.0
    const targetSunY      = isDayMode ? 0.4 : -0.4

    turbidity.current += (targetTurbidity - turbidity.current) * Math.min(delta * 2, 1)
    rayleigh.current  += (targetRayleigh  - rayleigh.current)  * Math.min(delta * 2, 1)
    sunPos.current[1]  += (targetSunY - sunPos.current[1])     * Math.min(delta * 2, 1)

    if (skyRef.current) {
      skyRef.current.material.uniforms.turbidity.value     = turbidity.current
      skyRef.current.material.uniforms.rayleigh.value      = rayleigh.current
      skyRef.current.material.uniforms.sunPosition.value.set(...sunPos.current)
    }
  })

  return <Sky ref={skyRef} distance={450000} turbidity={8} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} sunPosition={[0.3, 0.4, 1]} />
}

// ─── Animated Stars (Night Only) ─────────────────────────────────────────────

function AnimatedStars() {
  const isDayMode = useGameStore((s) => s.isDayMode)
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const target = isDayMode ? 0 : 1
    try {
      groupRef.current.traverse((obj) => {
        if (obj.material && typeof obj.material.opacity === 'number') {
          obj.material.opacity = lerpVal(obj.material.opacity, target, 0.04, delta)
          obj.material.transparent = true
        }
      })
    } catch (e) { /* ignore in headless */ }
  })

  return (
    <group ref={groupRef}>
      <Stars radius={180} depth={80} count={5000} factor={4} saturation={0.6} fade speed={0.3} />
    </group>
  )
}

// ─── Main Scene ──────────────────────────────────────────────────────────────

export default function Scene() {
  const cameraRef = useRef(null)
  const carPosRef = useRef([0, 0, 0])
  const { carPosition } = useGameStore()

  useEffect(() => {
    carPosRef.current = carPosition
  }, [carPosition])

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      style={{ background: '#05060f' }}
      camera={{ fov: 60, near: 0.1, far: 500 }}
    >
      <SceneSetup cameraRef={cameraRef} />
      <RealisticSky />
      <AnimatedStars />
      <Environment />

      <Suspense fallback={null}>
        <Physics gravity={[0, -20, 0]}>
          <Car cameraRef={cameraRef} />
          <World />
          <Sections carPosRef={carPosRef} />
        </Physics>
      </Suspense>

      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
