import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, useRapier } from '@react-three/rapier'
import { useControls } from '../hooks/useControls'
import { useGameStore } from '../store'
import * as THREE from 'three'

const BOOST_MULT = 1.8
const TURN_SPEED = 1.2
const JUMP_FORCE = 7
const MAX_VEL = 30
const BASE_FOV = 65
const NAV_SPEED_MULT = 0.65
const NAV_APPROACH_DIST = 10
const NAV_ARRIVE_DIST = 6.0

// Smart boost thresholds
const BOOST_ANGLE_THRESHOLD = 0.25   // rad — boost only when turn angle < this (nearly straight)
const BOOST_RAMP_UP = 2.5            // how fast boost engages (per second)
const BOOST_RAMP_DOWN = 4.0          // how fast boost disengages (per second)

// ─── Auto-drive waypoints (loops through the checkpoints) ────────────────────
const WAYPOINTS = [
  { x: -80, z: -160 }, // About
  { x: -80, z: -80 },
  { x: 80, z: -80 },
  { x: 80, z: -160 }, // Awards
  { x: 80, z: -80 },
  { x: 160, z: -80 },  // Projects
  { x: 80, z: -80 },
  { x: 80, z: 80 },
  { x: 160, z: 80 },  // Milestones
  { x: 80, z: 80 },
  { x: 80, z: 160 }, // Contact
  { x: 80, z: 80 },
  { x: -80, z: 80 },
  { x: -80, z: 160 }, // Experience
  { x: -80, z: 80 },
  { x: -160, z: 80 }, // Map Hub
  { x: -80, z: 80 },
  { x: -80, z: -80 },
  { x: -160, z: -80 }, // Skills
  { x: -80, z: -80 },
]

// ─── Section destinations & road-following paths ─────────────────────────────
const SECTION_DEST = {
  about: { x: -80, z: -160 },
  awards: { x: 80, z: -160 },
  experience: { x: -80, z: 160 },
  contact: { x: 80, z: 160 },
  projects: { x: 160, z: -80 },
  milestones: { x: 160, z: 80 },
  skills: { x: -160, z: -80 },
  map: { x: -160, z: 80 },
}

// Manhattan router for 3x3 grid (roads at -80, 0, 80)
function buildNavPath(fromX, fromZ, section) {
  const dest = SECTION_DEST[section]
  if (!dest) return []

  const validRoads = [-80, 0, 80]
  const path = []

  // Snap to nearest road
  const nearestRoadX = validRoads.reduce((a, b) => Math.abs(b - fromX) < Math.abs(a - fromX) ? b : a)
  const nearestRoadZ = validRoads.reduce((a, b) => Math.abs(b - fromZ) < Math.abs(a - fromZ) ? b : a)

  let cx = fromX, cz = fromZ
  const onXRoad = Math.abs(cx - nearestRoadX) < 6
  const onZRoad = Math.abs(cz - nearestRoadZ) < 6

  // 1. Move to nearest road if we are off-road
  if (!onXRoad && !onZRoad) {
    if (Math.abs(cx - nearestRoadX) < Math.abs(cz - nearestRoadZ)) {
      cx = nearestRoadX; path.push({ x: cx, z: cz })
    } else {
      cz = nearestRoadZ; path.push({ x: cx, z: cz })
    }
  } else {
    if (onXRoad) cx = nearestRoadX
    if (onZRoad) cz = nearestRoadZ
  }

  // 2. We are now on a valid road. Navigate to destination intersection.
  const destIsXRoad = validRoads.includes(dest.x)

  if (destIsXRoad) {
    if (cx !== dest.x) {
      if (!validRoads.includes(cz)) {
        cz = nearestRoadZ
        path.push({ x: cx, z: cz })
      }
      cx = dest.x
      path.push({ x: cx, z: cz })
    }
    path.push({ x: dest.x, z: dest.z })
  } else {
    if (cz !== dest.z) {
      if (!validRoads.includes(cx)) {
        cx = nearestRoadX
        path.push({ x: cx, z: cz })
      }
      cz = dest.z
      path.push({ x: cx, z: cz })
    }
    path.push({ x: dest.x, z: dest.z })
  }

  return path
}

// ─── Car Models ──────────────────────────────────────────────────────────────

function CyberCar() {
  return (
    <group>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.4, 0.4, 2.6]} />
        <meshStandardMaterial color="#0b0e14" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh castShadow position={[0, 0.45, -0.2]}>
        <boxGeometry args={[1.1, 0.3, 1.4]} />
        <meshStandardMaterial color="#050811" metalness={1} roughness={0} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.45, 0.41, 2.65]} />
        <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[1.3, 0.05, 2.5]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={6} />
      </mesh>
      {[[-0.75, -0.15, 0.8], [0.75, -0.15, 0.8], [-0.75, -0.15, -0.8], [0.75, -0.15, -0.8]].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          <mesh position={[x + (x > 0 ? 0.13 : -0.13), y, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
            <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={4} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.45, 0.15, 1.31]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={8} />
      </mesh>
      <mesh position={[0.45, 0.15, 1.31]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={8} />
      </mesh>
      <mesh position={[-0.45, 0.2, -1.31]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={6} />
      </mesh>
      <mesh position={[0.45, 0.2, -1.31]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={6} />
      </mesh>
      <pointLight position={[0, 0.5, 1.5]} color="#00ffcc" intensity={4} distance={20} />
    </group>
  )
}

function ModernCar() {
  return (
    <group>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.3, 0.45, 2.4]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.6, -0.1]}>
        <boxGeometry args={[1.0, 0.35, 1.2]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0.5]}>
        <boxGeometry args={[0.95, 0.3, 0.05]} />
        <meshStandardMaterial color="#34495e" transparent opacity={0.8} />
      </mesh>
      {[[-0.7, -0.1, 0.75], [0.7, -0.1, 0.75], [-0.7, -0.1, -0.75], [0.7, -0.1, -0.75]].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 16]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <mesh position={[x + (x > 0 ? 0.1 : -0.1), y, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
            <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.45, 0.15, 1.21]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0.45, 0.15, 1.21]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[-0.45, 0.2, -1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.45, 0.2, -1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 0.5, 1.5]} color="#fff" intensity={3} distance={15} />
    </group>
  )
}

function SportyCar() {
  return (
    <group>
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[1.6, 0.35, 2.5]} />
        <meshStandardMaterial color="#ff3300" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.45, -0.3]}>
        <boxGeometry args={[1.2, 0.35, 1.1]} />
        <meshStandardMaterial color="#cc2900" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.4, -1.1]}>
        <boxGeometry args={[1.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[-0.6, 0.25, -1.1]}>
        <boxGeometry args={[0.05, 0.3, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh castShadow position={[0.6, 0.25, -1.1]}>
        <boxGeometry args={[0.05, 0.3, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.4, 0.02, 2.51]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[[-0.85, -0.1, 0.8], [0.85, -0.1, 0.8], [-0.85, -0.1, -0.8], [0.85, -0.1, -0.8]].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.25, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <mesh position={[x + (x > 0 ? 0.13 : -0.13), y, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 10]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.55, 0.15, 1.26]}>
        <boxGeometry args={[0.35, 0.1, 0.05]} />
        <meshStandardMaterial color="#e0f7fa" emissive="#e0f7fa" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0.55, 0.15, 1.26]}>
        <boxGeometry args={[0.35, 0.1, 0.05]} />
        <meshStandardMaterial color="#e0f7fa" emissive="#e0f7fa" emissiveIntensity={5} />
      </mesh>
      <mesh position={[-0.55, 0.15, -1.26]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0.55, 0.15, -1.26]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} />
      </mesh>
      <pointLight position={[0, 0.5, 1.5]} color="#e0f7fa" intensity={4} distance={18} />
    </group>
  )
}

// ─── Speed Lines (rendered in 3D space around the car) ───────────────────────

function SpeedLines({ meshRef }) {
  const linesRef = useRef()
  const currentSpeed = useGameStore((s) => s.currentSpeed)

  useFrame((_, delta) => {
    if (!linesRef.current || !meshRef.current) return
    const opacity = Math.max(0, Math.min((currentSpeed - 12) / 15, 0.6))
    try {
      linesRef.current.children.forEach((child) => {
        if (child.material && typeof child.material.opacity === 'number') {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, opacity, delta * 5)
        }
      })
    } catch (e) { /* ignore */ }
    linesRef.current.rotation.y = meshRef.current.rotation.y
  })

  const lines = React.useMemo(() => {
    const arr = []
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      const r = 1.8 + Math.random() * 1.2
      arr.push([Math.cos(angle) * r, 0.2 + Math.random() * 0.6, -1.5 - Math.random() * 2])
    }
    return arr
  }, [])

  return (
    <group ref={linesRef}>
      {lines.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.02, 0.02, 0.5 + Math.random() * 0.8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Main Car Component ──────────────────────────────────────────────────────

export default function Car({ cameraRef }) {
  const bodyRef = useRef()
  const meshRef = useRef()
  const fillLightRef = useRef()
  const keys = useControls()
  const store = useGameStore
  const { resetKey, setCarPosition, carSpeed, selectedCar, isDayMode, autoDrive, cameraMode, setCurrentSpeed } = useGameStore()
  const navTarget = useGameStore((s) => s.navTarget)
  const isNavigating = useGameStore((s) => s.isNavigating)
  const { rapier, world } = useRapier()
  const carAngle = useRef(0)
  const isGrounded = useRef(false)
  const jumpCooldown = useRef(0)
  const lookAtTarget = useRef(new THREE.Vector3())
  const waypointIdx = useRef(0)
  const currentFov = useRef(BASE_FOV)

  // Smart boost state
  const boostFactor = useRef(0) // 0 = no boost, 1 = full boost

  // Navigation state (refs to avoid re-renders)
  const navPath = useRef([])
  const navIdx = useRef(0)
  const prevNavTarget = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.setTranslation({ x: 0, y: 1, z: 0 }, true)
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    carAngle.current = 0
  }, [resetKey])

  // Keyboard shortcuts + cancel nav on any WASD press
  useEffect(() => {
    const handler = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'c') {
        const modes = ['follow', 'topdown', 'cinematic']
        const cur = store.getState().cameraMode
        store.getState().setCameraMode(modes[(modes.indexOf(cur) + 1) % modes.length])
      }
      if (k === 't') store.getState().toggleAutoDrive()
      // Cancel navigation if user presses movement keys
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (store.getState().isNavigating) store.getState().clearNav()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useFrame((state, delta) => {
    if (!bodyRef.current) return
    const body = bodyRef.current
    const vel = body.linvel()
    const pos = body.translation()
    const curSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
    setCarPosition([pos.x, pos.y, pos.z])
    setCurrentSpeed(curSpeed)

    // Ground check
    const ray = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, { x: 0, y: -1, z: 0 })
    const hit = world.castRay(ray, 1.2, true)
    isGrounded.current = hit !== null

    // ── Build nav path when navTarget changes ──
    if (navTarget && navTarget !== prevNavTarget.current) {
      navPath.current = buildNavPath(pos.x, pos.z, navTarget)
      navIdx.current = 0
      prevNavTarget.current = navTarget
    } else if (!navTarget) {
      prevNavTarget.current = null
    }

    // ── Helper: compute smart boost factor ──
    const computeBoost = (angleDiff, dist, isApproaching) => {
      const absTurn = Math.abs(angleDiff)
      // Boost when steering is nearly straight
      const wantBoost = absTurn < BOOST_ANGLE_THRESHOLD && !isApproaching
      if (wantBoost) {
        boostFactor.current = Math.min(boostFactor.current + BOOST_RAMP_UP * delta, 1)
      } else {
        boostFactor.current = Math.max(boostFactor.current - BOOST_RAMP_DOWN * delta, 0)
      }
      return boostFactor.current
    }

    // ── INTELLIGENT NAVIGATION ──
    if (isNavigating && navPath.current.length > 0 && isGrounded.current) {
      const wp = navPath.current[navIdx.current]
      if (!wp) { store.getState().clearNav(); return }

      const dx = wp.x - pos.x
      const dz = wp.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const isLastWp = navIdx.current === navPath.current.length - 1

      // Smooth steering
      const targetAngle = Math.atan2(-dx, -dz)
      let angleDiff = targetAngle - carAngle.current
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      carAngle.current += angleDiff * delta * 3.0

      // Smart boost: boost on straights, brake near destination
      const isApproaching = isLastWp && dist < NAV_APPROACH_DIST
      const bf = computeBoost(angleDiff, dist, isApproaching)
      let speed = carSpeed * (NAV_SPEED_MULT + bf * (BOOST_MULT - NAV_SPEED_MULT))

      // Approach easing on final waypoint
      if (isApproaching) {
        speed *= Math.max(dist / NAV_APPROACH_DIST, 0.15)
      }

      const fx = Math.sin(carAngle.current) * speed * -1
      const fz = Math.cos(carAngle.current) * speed * -1
      if (curSpeed < MAX_VEL) body.applyImpulse({ x: fx * delta * 2, y: 0, z: fz * delta * 2 }, true)

      // Advance or arrive
      if (isLastWp && dist < NAV_ARRIVE_DIST) {
        body.setLinvel({ x: vel.x * 0.8, y: vel.y, z: vel.z * 0.8 }, true)
        const section = navTarget
        store.getState().clearNav()
        boostFactor.current = 0
        setTimeout(() => store.getState().setActiveSection(section), 300)
      } else if (!isLastWp && dist < 5) {
        navIdx.current++
      }
    }
    // ── AUTO-DRIVE (loop mode) ──
    else if (autoDrive && !isNavigating && isGrounded.current) {
      const wp = WAYPOINTS[waypointIdx.current]
      const dx = wp.x - pos.x
      const dz = wp.z - pos.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const targetAngle = Math.atan2(-dx, -dz)
      let angleDiff = targetAngle - carAngle.current
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      carAngle.current += angleDiff * delta * 2.5

      // Smart boost: full boost on straights, ease off on turns
      const bf = computeBoost(angleDiff, dist, false)
      const speed = carSpeed * (1.0 + bf * (BOOST_MULT - 1.0))

      const fx = Math.sin(carAngle.current) * speed * -1
      const fz = Math.cos(carAngle.current) * speed * -1
      if (curSpeed < MAX_VEL) body.applyImpulse({ x: fx * delta * 2, y: 0, z: fz * delta * 2 }, true)
      if (dist < 6) waypointIdx.current = (waypointIdx.current + 1) % WAYPOINTS.length
    }
    // ── MANUAL DRIVE ──
    else if (!isNavigating) {
      const speed = keys.current.boost ? carSpeed * BOOST_MULT : carSpeed
      const { forward, backward, left, right } = keys.current
      if ((forward || backward) && isGrounded.current) {
        const dir = forward ? 1 : -1
        carAngle.current += left ? TURN_SPEED * delta * dir : 0
        carAngle.current -= right ? TURN_SPEED * delta * dir : 0
      }
      if ((forward || backward) && isGrounded.current) {
        const dir = forward ? -1 : 1
        const fx = Math.sin(carAngle.current) * speed * dir
        const fz = Math.cos(carAngle.current) * speed * dir
        if (curSpeed < MAX_VEL) body.applyImpulse({ x: fx * delta * 2, y: 0, z: fz * delta * 2 }, true)
      }
      if (isGrounded.current && !forward && !backward) {
        body.setLinvel({ x: vel.x * 0.95, y: vel.y, z: vel.z * 0.95 }, true)
      }
      jumpCooldown.current -= delta
      if (keys.current.jump && isGrounded.current && jumpCooldown.current <= 0) {
        body.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true)
        jumpCooldown.current = 0.5
      }
    }

    // Lateral grip (all modes)
    const lateralDir = new THREE.Vector3(Math.cos(carAngle.current), 0, -Math.sin(carAngle.current))
    const v3vel = new THREE.Vector3(vel.x, 0, vel.z)
    const lateralVel = lateralDir.dot(v3vel)
    const newVel = body.linvel()
    body.setLinvel({ x: newVel.x - lateralDir.x * lateralVel * 0.85, y: newVel.y, z: newVel.z - lateralDir.z * lateralVel * 0.85 }, true)

    // Visual rotation
    if (meshRef.current) meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, carAngle.current, delta * 10)

    // Respawn
    if (pos.y < -20) { body.setTranslation({ x: 0, y: 2, z: 0 }, true); body.setLinvel({ x: 0, y: 0, z: 0 }, true) }

    // Camera
    if (cameraRef && cameraRef.current) {
      const cam = cameraRef.current
      let targetPos, targetLook
      if (cameraMode === 'follow') {
        const d = 16, h = 9
        targetPos = new THREE.Vector3(pos.x + Math.sin(carAngle.current) * d, pos.y + h, pos.z + Math.cos(carAngle.current) * d)
        targetLook = new THREE.Vector3(pos.x, pos.y + 0.5, pos.z)
      } else if (cameraMode === 'topdown') {
        targetPos = new THREE.Vector3(pos.x, pos.y + 40, pos.z + 2)
        targetLook = new THREE.Vector3(pos.x, pos.y, pos.z)
      } else if (cameraMode === 'cinematic') {
        const o = Math.sin(state.clock.elapsedTime * 0.3) * 6
        targetPos = new THREE.Vector3(pos.x + 14, pos.y + 4, pos.z + o)
        targetLook = new THREE.Vector3(pos.x, pos.y + 1, pos.z)
      }
      cam.position.lerp(targetPos, delta * 2.5)
      lookAtTarget.current.lerp(targetLook, delta * 5)
      cam.lookAt(lookAtTarget.current)
      // FOV
      const sr = Math.min(curSpeed / MAX_VEL, 1)
      currentFov.current = THREE.MathUtils.lerp(currentFov.current, BASE_FOV + sr * 18, delta * 3)
      cam.fov = currentFov.current; cam.updateProjectionMatrix()
    }

    // Fill light
    if (fillLightRef.current) {
      const ti = isDayMode ? 0.3 : 1.5
      fillLightRef.current.intensity += (ti - fillLightRef.current.intensity) * Math.min(delta * 3, 1)
    }
  })

  return (
    <RigidBody ref={bodyRef} position={[0, 1, 0]} colliders="cuboid" mass={1.5} linearDamping={0.5} angularDamping={8} lockRotations>
      <group ref={meshRef}>
        <pointLight ref={fillLightRef} position={[0, 2, 0]} color="#b5c4f5" intensity={1.5} distance={20} />
        {selectedCar === 'cyber' && <CyberCar />}
        {selectedCar === 'modern' && <ModernCar />}
        {selectedCar === 'sporty' && <SportyCar />}
      </group>
      <SpeedLines meshRef={meshRef} />
    </RigidBody>
  )
}
