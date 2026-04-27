import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { useGameStore } from '../store'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lerpColor(ref, target, speed, delta) {
  ref.lerp(target, 1 - Math.pow(1 - speed, delta * 60))
}
function lerpVal(current, target, speed, delta) {
  return current + (target - current) * (1 - Math.pow(1 - speed, delta * 60))
}

// ─── Animated Material Hook ──────────────────────────────────────────────────
// Lerps a single meshStandardMaterial's color (and optionally emissive + intensity)
// between two presets based on isDayMode.

function useAnimatedMat(nightColor, dayColor, nightEmissive, dayEmissive, nightEmI, dayEmI) {
  const isDayMode = useGameStore((s) => s.isDayMode)
  const ref = useRef()
  const targets = useMemo(() => ({
    c: new THREE.Color(), e: new THREE.Color()
  }), [])

  useFrame((_, d) => {
    if (!ref.current) return
    const s = 0.06
    targets.c.set(isDayMode ? dayColor : nightColor)
    lerpColor(ref.current.color, targets.c, s, d)
    if (nightEmissive) {
      targets.e.set(isDayMode ? dayEmissive : nightEmissive)
      lerpColor(ref.current.emissive, targets.e, s, d)
      ref.current.emissiveIntensity = lerpVal(ref.current.emissiveIntensity, isDayMode ? dayEmI : nightEmI, s, d)
    }
  })
  return ref
}

// ─── Ground ──────────────────────────────────────────────────────────────────

function Ground({ position = [0, -0.5, 0], size = [200, 1, 200] }) {
  const matRef = useAnimatedMat('#04070d', '#3a6b3a')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={matRef} color="#04070d" roughness={0.85} metalness={0.1} />
      </mesh>
    </RigidBody>
  )
}

// ─── Road ────────────────────────────────────────────────────────────────────

function Road({ position, rotation = [0, 0, 0], size = [7, 0.12, 30], showLines = true }) {
  const roadMatRef = useAnimatedMat('#0b1018', '#444444')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={roadMatRef} color="#0b1018" roughness={0.65} metalness={0.25} />
      </mesh>
      {showLines && Array.from({ length: Math.floor(size[2] / 4) }).map((_, i) => (
        <LaneLine key={i} position={[position[0], position[1] + 0.07, position[2] - size[2] / 2 + i * 4 + 2]} rotation={rotation} />
      ))}
    </RigidBody>
  )
}

function LaneLine({ position, rotation }) {
  const matRef = useAnimatedMat('#3498db', '#ffffff', '#3498db', '#ffffff', 6, 0.3)
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.18, 0.01, 1.6]} />
      <meshStandardMaterial ref={matRef} color="#3498db" emissive="#3498db" emissiveIntensity={6} />
    </mesh>
  )
}

// ─── Wall ────────────────────────────────────────────────────────────────────

function Wall({ position, size = [0.5, 2.5, 10], color = '#08101a', metalness = 0.2 }) {
  const matRef = useAnimatedMat(color, '#8899aa')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={matRef} color={color} roughness={0.7} metalness={metalness} />
      </mesh>
    </RigidBody>
  )
}

// ─── Ramp ────────────────────────────────────────────────────────────────────

function Ramp({ position, rotation = [0.28, 0, 0], width = 5 }) {
  const matRef = useAnimatedMat('#1a2533', '#888888')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <boxGeometry args={[width, 0.22, 7]} />
        <meshStandardMaterial ref={matRef} color="#1a2533" roughness={0.7} metalness={0.2} />
      </mesh>
    </RigidBody>
  )
}

// ─── Platform ────────────────────────────────────────────────────────────────

function Platform({ position, size = [8, 0.4, 8] }) {
  const matRef = useAnimatedMat('#0a1525', '#99aabb')
  const trimRef = useAnimatedMat('#3498db', '#4488cc')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial ref={matRef} color="#0a1525" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[position[0], position[1] + size[1] / 2 + 0.01, position[2]]}>
        <boxGeometry args={[size[0] + 0.05, 0.04, size[2] + 0.05]} />
        <meshStandardMaterial ref={trimRef} color="#3498db" transparent opacity={0.8} />
      </mesh>
    </RigidBody>
  )
}

// ─── Pillar ──────────────────────────────────────────────────────────────────

function Pillar({ position, height = 4, radius = 0.35 }) {
  const matRef = useAnimatedMat('#08101a', '#667788')
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[position[0], position[1] + height / 2, position[2]]} castShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 10]} />
        <meshStandardMaterial ref={matRef} color="#08101a" roughness={0.6} metalness={0.35} />
      </mesh>
    </RigidBody>
  )
}

// ─── Environment Props ─────────────────────────────────────────────────────────

function InstancedTrees() {
  const trunkRef = useAnimatedMat('#2d221e', '#6b4c3b')
  const leavesRef = useAnimatedMat('#0c351b', '#2d8a4e')
  const topRef = useAnimatedMat('#0f4423', '#3aad5f')

  const treeData = useMemo(() => {
    // Valid organic grass regions (avoiding the roads at 0, +/-80)
    const regions = [[-170, -90], [-70, -10], [10, 70], [90, 170]]
    const instances = []

    // Generate ~150 trees natively
    for (let i = 0; i < 150; i++) {
      const regX = regions[Math.floor(Math.random() * regions.length)]
      const regZ = regions[Math.floor(Math.random() * regions.length)]
      const x = regX[0] + Math.random() * (regX[1] - regX[0])
      const z = regZ[0] + Math.random() * (regZ[1] - regZ[0])

      const scale = 0.6 + Math.random() * 0.8
      const rotation = [0, Math.random() * Math.PI * 2, 0]
      instances.push({ position: [x, 0, z], scale, rotation })
    }
    return instances
  }, [])

  return (
    <group>
      <Instances limit={200} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.4, 7]} />
        <meshStandardMaterial ref={trunkRef} color="#2d221e" roughness={0.95} />
        {treeData.map((t, i) => (
          <Instance key={`trunk-${i}`} position={[t.position[0], 1.2 * t.scale, t.position[2]]} scale={t.scale} rotation={t.rotation} />
        ))}
      </Instances>
      <Instances limit={200} castShadow receiveShadow>
        <coneGeometry args={[1.3, 3.2, 7]} />
        <meshStandardMaterial ref={leavesRef} color="#0c351b" roughness={0.8} />
        {treeData.map((t, i) => (
          <Instance key={`l1-${i}`} position={[t.position[0], 3.2 * t.scale, t.position[2]]} scale={t.scale} rotation={t.rotation} />
        ))}
      </Instances>
      <Instances limit={200} castShadow receiveShadow>
        <coneGeometry args={[0.95, 2.6, 7]} />
        <meshStandardMaterial ref={topRef} color="#0f4423" roughness={0.8} />
        {treeData.map((t, i) => (
          <Instance key={`l2-${i}`} position={[t.position[0], 4.8 * t.scale, t.position[2]]} scale={t.scale} rotation={t.rotation} />
        ))}
      </Instances>
    </group>
  )
}

function InstancedRocks() {
  const rockMatRef = useAnimatedMat('#1a1c22', '#5a6268')
  const rockData = useMemo(() => {
    const regions = [[-170, -90], [-70, -10], [10, 70], [90, 170]]
    const instances = []

    // Generate ~100 rocks natively
    for (let i = 0; i < 100; i++) {
      const regX = regions[Math.floor(Math.random() * regions.length)]
      const regZ = regions[Math.floor(Math.random() * regions.length)]
      const x = regX[0] + Math.random() * (regX[1] - regX[0])
      const z = regZ[0] + Math.random() * (regZ[1] - regZ[0])

      const scale = 0.5 + Math.random() * 1.5
      const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      instances.push({ position: [x, scale * 0.4, z], scale, rotation })
    }
    return instances
  }, [])

  return (
    <Instances limit={150} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial ref={rockMatRef} color="#1a1c22" roughness={0.9} />
      {rockData.map((r, i) => (
        <Instance key={i} position={r.position} scale={r.scale} rotation={r.rotation} />
      ))}
    </Instances>
  )
}

function Pond({ position, size = [15, 25], rotation = 0 }) {
  const matRef = useAnimatedMat('#113045', '#3498db')
  return (
    <group position={position}>
      {/* Main water body */}
      <mesh rotation={[-Math.PI / 2, 0, rotation]} position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[size[0], size[0], 0.01, 12]} />
        <meshStandardMaterial ref={matRef} color="#113045" metalness={0.8} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* Inner depth effect */}
      <mesh rotation={[-Math.PI / 2, 0, rotation]} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[size[0] - 2, size[0] - 2, 0.01, 12]} />
        <meshStandardMaterial color="#081824" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// ─── Street Light ────────────────────────────────────────────────────────────

function StreetLight({ position }) {
  const bulbRef = useAnimatedMat('#7eb4f5', '#ddddaa', '#7eb4f5', '#ddddaa', 8, 1)
  const poleRef = useAnimatedMat('#1a2530', '#667788')
  const armRef = useAnimatedMat('#1a2530', '#667788')

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.12, 4.5, 8]} />
        <meshStandardMaterial ref={poleRef} color="#1a2530" />
      </mesh>
      <mesh position={[0.7, 2.1, 0]} castShadow>
        <boxGeometry args={[1.4, 0.12, 0.12]} />
        <meshStandardMaterial ref={armRef} color="#1a2530" />
      </mesh>
      <mesh position={[0.7, 2.22, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial ref={bulbRef} color="#7eb4f5" emissive="#7eb4f5" emissiveIntensity={8} />
      </mesh>
    </group>
  )
}

// ─── Grass ───────────────────────────────────────────────────────────────────

function GrassPatch({ position, size = [14, 0.06, 14] }) {
  const matRef = useAnimatedMat('#071a0e', '#4a8b3f')
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={matRef} color="#071a0e" roughness={1} />
    </mesh>
  )
}

// ─── Section Zone ────────────────────────────────────────────────────────────

function SectionZone({ position, size, color, dayColor }) {
  const matRef = useAnimatedMat(color, dayColor)
  const glowRef = useAnimatedMat(color, dayColor, color, dayColor, 3, 0.6)
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial ref={matRef} color={color} roughness={0.95} />
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[size[0] - 0.5, 0.01, size[2] - 0.5]} />
        <meshStandardMaterial ref={glowRef} color={color} emissive={color} emissiveIntensity={3} />
      </mesh>
    </mesh>
  )
}

// ─── Main World ──────────────────────────────────────────────────────────────

export default function World() {
  return (
    <group>
      {/* ── GROUND ── */}
      <Ground position={[0, -0.5, 0]} size={[400, 1, 400]} />

      {/* ── MAIN ROADS (3x3 Grid) ── */}
      {[-80, 0, 80].map(x => (
        <Road key={`v-road-${x}`} position={[x, 0, 0]} size={[14, 0.12, 360]} />
      ))}
      {[-80, 0, 80].map(z => (
        <Road key={`h-road-${z}`} position={[0, 0, z]} rotation={[0, Math.PI / 2, 0]} size={[14, 0.12, 360]} showLines={false} />
      ))}

      {/* ── BOUNDARY WALLS ── */}
      <Wall position={[185, 2, 0]} size={[1, 5, 380]} />
      <Wall position={[-185, 2, 0]} size={[1, 5, 380]} />
      <Wall position={[0, 2, 185]} size={[380, 5, 1]} />
      <Wall position={[0, 2, -185]} size={[380, 5, 1]} />

      {/* ── GRASS PATCHES (16 City Parks) ── */}
      {[
        [-130, -130], [-40, -130], [40, -130], [130, -130],
        [-130, -40], [-40, -40], [40, -40], [130, -40],
        [-130, 40], [-40, 40], [40, 40], [130, 40],
        [-130, 130], [-40, 130], [40, 130], [130, 130]
      ].map(([x, z], i) => (
        <GrassPatch key={`grass-${i}`} position={[x, 0.01 + (i % 3) * 0.015, z]} size={[50, 0.06, 50]} />
      ))}

      {/* ── NATURAL ENVIRONMENT (Instanced & Organic) ── */}
      <InstancedTrees />
      <InstancedRocks />

      {/* Ponds in open park quadrants */}
      <Pond position={[-130, 0.01, -130]} size={[15, 25]} rotation={0.4} />
      <Pond position={[130, 0.01, 40]} size={[18, 25]} rotation={-0.6} />

      {/* ── STREET LIGHTS ── */}
      {/* 4 lights at every intersection */}
      {[-80, 0, 80].flatMap(x =>
        [-80, 0, 80].flatMap(z => [
          [x - 8, 0, z - 8],
          [x + 8, 0, z - 8],
          [x - 8, 0, z + 8],
          [x + 8, 0, z + 8]
        ])
      ).map(([x, y, z], i) => <StreetLight key={`light-${i}`} position={[x, y, z]} />)}
    </group>
  )
}
