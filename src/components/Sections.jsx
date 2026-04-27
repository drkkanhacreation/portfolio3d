import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useGameStore } from '../store'
import * as THREE from 'three'

// ─── Proximity hook (shared by all checkpoints) ─────────────────────────────
function useProximity(position, carPosRef, radius = 5.5) {
  const [nearCar, setNearCar] = useState(false)
  const cooldown = useRef(false)
  const { setActiveSection, isNavigating } = useGameStore()

  const check = (section) => {
    if (!carPosRef?.current) return
    const cp = carPosRef.current
    const dx = cp[0] - position[0], dz = cp[2] - position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const isNear = dist < radius
    if (isNear !== nearCar) setNearCar(isNear)
    if (isNear && !cooldown.current && !isNavigating) {
      cooldown.current = true
      setTimeout(() => {
        setActiveSection(section)
        setTimeout(() => { cooldown.current = false }, 3000)
      }, 400)
    } else if (!isNear) { cooldown.current = false }
  }
  return { nearCar, check }
}

// ─── Floating Label (shared) ─────────────────────────────────────────────────
function FloatingLabel({ label, icon, color, nearCar, y = 7.5 }) {
  return (
    <Billboard position={[0, y, 0]}>
      <Text fontSize={nearCar ? 1.0 : 0.8} color="white" anchorX="center" anchorY="middle"
        outlineWidth={0.05} outlineColor="#000000">
        {icon}  {label}
      </Text>
      {nearCar && (
        <Text position={[0, -1.0, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
          ▶  ENTERING...
        </Text>
      )}
    </Billboard>
  )
}

// ─── Ground Glow (shared) ────────────────────────────────────────────────────
function GroundGlow({ color, nearCar, radius = 5 }) {
  const ref = useRef()
  useFrame((s) => { if (ref.current) ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 2.5) * 0.06) })
  return (
    <group>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={nearCar ? 0.2 : 0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius - 0.5, radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={nearCar ? 0.6 : 0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 HEAD OFFICE — About (North, blue)
// ═══════════════════════════════════════════════════════════════════════════════
function OfficeZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  useFrame(() => check('about'))
  const accent = '#3498db'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      {/* Main building */}
      <mesh castShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[6, 5, 4]} />
        <meshStandardMaterial color="#c8d6e5" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Glass windows */}
      {[-1.8, 0, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 3, 2.01]}>
          <boxGeometry args={[1, 1.8, 0.05]} />
          <meshStandardMaterial color="#1a5276" emissive="#1a5276" emissiveIntensity={nearCar ? 2 : 0.5} metalness={0.8} roughness={0.1} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Entrance */}
      <mesh position={[0, 1, 2.01]}>
        <boxGeometry args={[1.5, 2, 0.06]} />
        <meshStandardMaterial color="#2c3e50" emissive="#2c3e50" emissiveIntensity={0.3} />
      </mesh>
      {/* Rooftop accent */}
      <mesh position={[0, 5.05, 0]}>
        <boxGeometry args={[6.2, 0.1, 4.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={nearCar ? 1.5 : 0.4} />
      </mesh>
      {/* Sign */}
      <mesh position={[0, 4, 2.05]}>
        <boxGeometry args={[3, 0.5, 0.05]} />
        <meshStandardMaterial color="#0a1128" emissive={accent} emissiveIntensity={nearCar ? 2 : 0.6} />
      </mesh>
      <pointLight position={[0, 3, 3]} color="#f5f0e0" intensity={nearCar ? 6 : 2} distance={12} />
      <FloatingLabel label="ABOUT ME" icon="🏢" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚓 POLICE STATION — Projects (East, red)
// ═══════════════════════════════════════════════════════════════════════════════
function PoliceZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  const lightRef = useRef()
  useFrame((s) => {
    check('projects')
    if (lightRef.current) lightRef.current.intensity = 3 + Math.sin(s.clock.elapsedTime * 4) * 2
  })
  const accent = '#e74c3c'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      {/* Station building */}
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[7, 4, 5]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[7.3, 0.2, 5.3]} />
        <meshStandardMaterial color="#1a252f" />
      </mesh>
      {/* Alert lights */}
      <mesh position={[-2, 4.4, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={4} />
      </mesh>
      <mesh position={[2, 4.4, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={4} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 4.5, 0]} color="#e74c3c" intensity={3} distance={15} />
      {/* Barriers */}
      {[-2.5, 2.5].map((x, i) => (
        <group key={i} position={[x, 0, 3.5]}>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.15, 1, 0.15]} /><meshStandardMaterial color="#f1c40f" /></mesh>
          <mesh position={[0, 1.05, 0]}><boxGeometry args={[1.2, 0.12, 0.12]} /><meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={1} /></mesh>
        </group>
      ))}
      {/* Badge */}
      <mesh position={[0, 3.2, 2.51]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 6]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={nearCar ? 2 : 0.5} metalness={0.8} />
      </mesh>
      <FloatingLabel label="PROJECTS" icon="🚓" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏥 HOSPITAL — Skills (West, green)
// ═══════════════════════════════════════════════════════════════════════════════
function HospitalZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  useFrame(() => check('skills'))
  const accent = '#2ecc71'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      {/* Main building */}
      <mesh castShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[6, 5, 5]} />
        <meshStandardMaterial color="#ecf0f1" metalness={0.1} roughness={0.6} />
      </mesh>
      {/* Cross sign (vertical) */}
      <mesh position={[0, 4, 2.51]}>
        <boxGeometry args={[0.4, 1.6, 0.06]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={nearCar ? 3 : 1} />
      </mesh>
      <mesh position={[0, 4, 2.51]}>
        <boxGeometry args={[1.6, 0.4, 0.06]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={nearCar ? 3 : 1} />
      </mesh>
      {/* Windows */}
      {[-1.5, 1.5].map((x, i) => [-1, 1].map((row, j) => (
        <mesh key={`${i}-${j}`} position={[x, 2 + row * 1.5, 2.51]}>
          <boxGeometry args={[0.8, 1, 0.05]} />
          <meshStandardMaterial color="#aed6f1" emissive="#aed6f1" emissiveIntensity={nearCar ? 1 : 0.2} transparent opacity={0.8} />
        </mesh>
      )))}
      {/* Entrance canopy */}
      <mesh position={[0, 1.8, 3]}>
        <boxGeometry args={[2.5, 0.1, 1.5]} />
        <meshStandardMaterial color="#bdc3c7" />
      </mesh>
      {/* Soft calm lighting */}
      <pointLight position={[0, 3, 4]} color="#aed6f1" intensity={nearCar ? 5 : 2} distance={12} />
      <FloatingLabel label="SKILLS" icon="🏥" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💼 TECH LAB — Contact (South, orange/cyber)
// ═══════════════════════════════════════════════════════════════════════════════
function TechLabZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  const panelRef = useRef()
  useFrame((s) => {
    check('contact')
    if (panelRef.current) panelRef.current.emissiveIntensity = 2 + Math.sin(s.clock.elapsedTime * 3) * 1
  })
  const accent = '#e67e22'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color="#00ffcc" nearCar={nearCar} />
      {/* Main structure */}
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[6, 4, 5]} />
        <meshStandardMaterial color="#0a0e17" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Neon frame */}
      <mesh position={[0, 2, 2.51]}>
        <boxGeometry args={[5.8, 3.8, 0.04]} />
        <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.4} />
      </mesh>
      {/* Glowing panels */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 2.52]}>
          <boxGeometry args={[1, 1.5, 0.03]} />
          <meshStandardMaterial ref={i === 1 ? panelRef : undefined} color="#00ffcc" emissive="#00ffcc" emissiveIntensity={nearCar ? 3 : 1} transparent opacity={0.7} />
        </mesh>
      ))}
      {/* Antenna */}
      <mesh position={[2, 4.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
      </mesh>
      <mesh position={[2, 5.6, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={4} />
      </mesh>
      {/* Neon lighting */}
      <pointLight position={[0, 3, 4]} color="#00ffcc" intensity={nearCar ? 6 : 2} distance={14} />
      <FloatingLabel label="CONTACT" icon="💼" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ MAP HUB — Central Control Room (West Mid, orange)
// ═══════════════════════════════════════════════════════════════════════════════
function MapHubZone({ position, carPosRef }) {
  const { setShowMap, isNavigating } = useGameStore()
  const { nearCar, check } = useProximity(position, carPosRef)
  const ringRef = useRef()

  useFrame((s) => {
    check('map')
    if (ringRef.current) {
      ringRef.current.rotation.y = s.clock.elapsedTime * 0.5
    }
    // Only open map if near, not on cooldown, not navigating
    if (nearCar && !isNavigating) {
      // The proximity hook sets activeSection='map', but we want to intercept it
      // Actually we just use the hook for visuals, but we'll manually trigger showMap
    }
  })

  // We need to override the default check behavior since 'map' isn't a normal modal.
  const customCheck = () => {
    if (!carPosRef?.current) return
    const cp = carPosRef.current
    const dx = cp[0] - position[0], dz = cp[2] - position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const isNear = dist < 5.5
    if (isNear !== nearCar) {
      // Need a way to set state without infinite loop, we do it via a ref locally
    }
  }

  // Let's use the normal hook, but intercept in a useEffect? No, easier to just write custom for map.
  const [isNearMap, setIsNearMap] = useState(false)
  const mapCooldown = useRef(false)

  useFrame(() => {
    if (!carPosRef?.current) return
    const cp = carPosRef.current
    const dx = cp[0] - position[0], dz = cp[2] - position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const isNear = dist < 5.5
    if (isNear !== isNearMap) setIsNearMap(isNear)

    if (isNear && !mapCooldown.current && !isNavigating) {
      mapCooldown.current = true
      setTimeout(() => {
        setShowMap(true)
        setTimeout(() => { mapCooldown.current = false }, 3000)
      }, 400)
    } else if (!isNear) { mapCooldown.current = false }

    if (ringRef.current) ringRef.current.rotation.y += 0.02
  })

  const accent = '#f39c12'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={isNearMap} />
      {/* Control center building */}
      <mesh castShadow position={[0, 2, 0]}>
        <cylinderGeometry args={[4, 4.5, 4, 12]} />
        <meshStandardMaterial color="#1a1c23" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Rotating radar ring */}
      <group ref={ringRef} position={[0, 4.5, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 2.5, 12]} />
          <meshBasicMaterial color={accent} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Hologram dome */}
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.3} />
      </mesh>
      <pointLight position={[0, 4, 4]} color={accent} intensity={isNearMap ? 6 : 2} distance={15} />
      <FloatingLabel label="MAP HUB" icon="🗺️" color={accent} nearCar={isNearMap} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 AWARDS ZONE (North Mid, golden)
// ═══════════════════════════════════════════════════════════════════════════════
function AwardsZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  useFrame(() => check('awards'))
  const accent = '#f1c40f'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      <mesh castShadow position={[0, 2.5, 0]}>
        <cylinderGeometry args={[3, 3.5, 5, 8]} />
        <meshStandardMaterial color="#fffbe6" metalness={0.2} roughness={0.2} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={nearCar ? 2 : 0.5} metalness={1} />
      </mesh>
      <pointLight position={[0, 4, 4]} color={accent} intensity={nearCar ? 6 : 2} distance={15} />
      <FloatingLabel label="AWARDS" icon="🏆" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📜 EXPERIENCE ZONE (South Mid, silver/professional)
// ═══════════════════════════════════════════════════════════════════════════════
function ExperienceZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  useFrame(() => check('experience'))
  const accent = '#bdc3c7'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      <mesh castShadow position={[0, 3, 0]}>
        <boxGeometry args={[5, 6, 4]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.5} />
      </mesh>
      {[-1, 0, 1].map((x) => (
        <mesh key={x} position={[x, 3, 2.05]}>
          <boxGeometry args={[0.5, 4, 0.1]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={nearCar ? 1.5 : 0.2} />
        </mesh>
      ))}
      <pointLight position={[0, 3, 4]} color={accent} intensity={nearCar ? 6 : 2} distance={15} />
      <FloatingLabel label="EXPERIENCE" icon="📜" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MILESTONES ZONE (East Mid, purple/tech)
// ═══════════════════════════════════════════════════════════════════════════════
function MilestonesZone({ position, carPosRef }) {
  const { nearCar, check } = useProximity(position, carPosRef)
  useFrame(() => check('milestones'))
  const accent = '#9b59b6'
  return (
    <group position={[position[0], 0, position[2]]}>
      <GroundGlow color={accent} nearCar={nearCar} />
      <mesh castShadow position={[0, 2, 0]}>
        <cylinderGeometry args={[2, 4, 4, 4]} />
        <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[1.5, 3, 4]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={nearCar ? 2 : 0.5} />
      </mesh>
      <pointLight position={[0, 4, 4]} color={accent} intensity={nearCar ? 6 : 2} distance={15} />
      <FloatingLabel label="MILESTONES" icon="🚀" color={accent} nearCar={nearCar} />
    </group>
  )
}

// ─── Animated hero title ────────────────────────────────────────────────────
function NameTitle() {
  const groupRef = useRef()
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 3.2 + Math.sin(state.clock.elapsedTime * 0.7) * 0.12
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.06
    }
  })
  return (
    <group ref={groupRef} position={[0, 3.2, 9]}>
      <mesh position={[0, 0.3, -0.3]}>
        <planeGeometry args={[18, 5]} />
        <meshBasicMaterial color="#000814" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.1, 0]}><boxGeometry args={[14, 0.06, 0.06]} /><meshBasicMaterial color="#f4d03f" /></mesh>
      <Text fontSize={1.9} color="#f4d03f" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000" letterSpacing={0.06} maxWidth={22} textAlign="center">
        SWADHINJIT SAHOO
      </Text>
      <Text position={[0, -1.5, 0]} fontSize={0.52} color="#aaaacc" anchorX="center" anchorY="middle" letterSpacing={0.18}>
        FULL STACK DEVELOPER  ·  CREATIVE TECHNOLOGIST
      </Text>
      <Text position={[0, -2.5, 0]} fontSize={0.32} color="#555577" anchorX="center" anchorY="middle" letterSpacing={0.12}>
        [ Drive to the themed zones to explore ]
      </Text>
      <mesh position={[0, -1.05, 0]}><boxGeometry args={[14, 0.06, 0.06]} /><meshBasicMaterial color="#f4d03f" /></mesh>
    </group>
  )
}

// ─── Floating atmosphere particles (Dust/Fireflies) ───────────────────────────
function Particles() {
  const pts = useRef()
  const count = 800
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 400
      arr[i * 3 + 1] = Math.random() * 25 + 1
      arr[i * 3 + 2] = (Math.random() - 0.5) * 400
    }
    return arr
  })
  useFrame((state) => { if (pts.current) pts.current.rotation.y = state.clock.elapsedTime * 0.015 })
  return (
    <points ref={pts}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.16} color="#f4d03f" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

// ─── Direction signs ────────────────────────────────────────────────────────
function DirectionSign({ position, label, color, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 1, 0]}><cylinderGeometry args={[0.07, 0.09, 2.5, 8]} /><meshStandardMaterial color="#444" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 2.6, 0]}><boxGeometry args={[2.4, 0.65, 0.12]} /><meshStandardMaterial color="#111122" roughness={0.5} metalness={0.3} /></mesh>
      <mesh position={[0, 2.6, 0.07]}><boxGeometry args={[2.42, 0.67, 0.02]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} /></mesh>
      <Billboard position={[0, 2.6, 0.12]}>
        <Text fontSize={0.25} color={color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
          ▶ {label}
        </Text>
      </Billboard>
    </group>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function Sections({ carPosRef }) {
  const signs = [
    { position: [0, 0, -35], label: 'NORTH DISTRICT', color: '#3498db', rotation: [0, Math.PI, 0] },
    { position: [35, 0, 0], label: 'EAST DISTRICT', color: '#e74c3c', rotation: [0, -Math.PI / 2, 0] },
    { position: [-35, 0, 0], label: 'WEST DISTRICT', color: '#2ecc71', rotation: [0, Math.PI / 2, 0] },
    { position: [0, 0, 35], label: 'SOUTH DISTRICT', color: '#e67e22', rotation: [0, 0, 0] },
  ]

  return (
    <group>
      <NameTitle />
      <Particles />

      {/* North Edge */}
      <OfficeZone position={[-80, 1, -160]} carPosRef={carPosRef} /> {/* About */}
      <AwardsZone position={[80, 1, -160]} carPosRef={carPosRef} /> {/* Awards */}

      {/* East Edge */}
      <PoliceZone position={[160, 1, -80]} carPosRef={carPosRef} /> {/* Projects */}
      <MilestonesZone position={[160, 1, 80]} carPosRef={carPosRef} /> {/* Milestones */}

      {/* South Edge */}
      <ExperienceZone position={[-80, 1, 160]} carPosRef={carPosRef} /> {/* Experience */}
      <TechLabZone position={[80, 1, 160]} carPosRef={carPosRef} /> {/* Contact */}

      {/* West Edge */}
      <HospitalZone position={[-160, 1, -80]} carPosRef={carPosRef} /> {/* Skills */}
      <MapHubZone position={[-160, 1, 80]} carPosRef={carPosRef} /> {/* Map Hub */}

      {signs.map((s, i) => <DirectionSign key={i} {...s} />)}
    </group>
  )
}
