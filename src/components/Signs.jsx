import { useRef, useState } from 'react'
import { Text, Html } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function FloatingText({ text, position, color = '#ffffff', size = 0.8, rotation = [0, 0, 0] }) {
  const ref = useRef()
  const t = useRef(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    t.current += delta
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t.current * 0.8) * 0.15
    }
  })

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <Text
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        outlineWidth={0.03}
        outlineColor="#000000"
        castShadow
      >
        {text}
      </Text>
    </group>
  )
}

export function NameTitle({ position = [0, 3.5, 8] }) {
  const ref = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * 0.5
    if (ref.current) {
      ref.current.rotation.y = Math.sin(t.current * 0.3) * 0.08
      ref.current.position.y = position[1] + Math.sin(t.current * 0.6) * 0.1
    }
  })

  return (
    <group ref={ref} position={position}>
      <Text
        fontSize={1.2}
        color="#ff3366"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        outlineWidth={0.05}
        outlineColor="#220011"
        maxWidth={20}
        textAlign="center"
        castShadow
      >
        SWADHINJIT{'\n'}SAHOO
      </Text>
      <Text
        position={[0, -1.6, 0]}
        fontSize={0.35}
        color="#aaaaff"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        outlineWidth={0.02}
        outlineColor="#000033"
      >
        {'< Drive around to explore >'}
      </Text>
    </group>
  )
}

function SectionPillar({ color, label, icon }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 3, 8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.3} />
      </mesh>
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  )
}

export function SectionMarker({ position, label, color, onEnter, id }) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const ref = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'auto' }}
          onClick={() => { setActive(!active); onEnter?.(id) }}
          castShadow
        >
          <boxGeometry args={[2.5, 0.3, 2.5]} />
          <meshStandardMaterial
            color={hovered ? '#ffffff' : color}
            emissive={color}
            emissiveIntensity={hovered ? 0.8 : 0.2}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      </RigidBody>

      {/* Animated ring */}
      <group ref={ref} position={[0, 2, 0]}>
        <mesh>
          <torusGeometry args={[1.2, 0.06, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      </group>

      <SectionPillar color={color} label={label} />
    </group>
  )
}

export function InfoBoard({ position, title, lines, color = '#0066ff', rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Board backing */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6, 4, 0.2]} />
          <meshStandardMaterial color="#111122" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Border */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[6.2, 4.2, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>
      <Text
        position={[0, 1.3, 0.2]}
        fontSize={0.38}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        outlineWidth={0.02}
        outlineColor="#000033"
        maxWidth={5}
        textAlign="center"
      >
        {title}
      </Text>
      {lines.map((line, i) => (
        <Text
          key={i}
          position={[0, 0.5 - i * 0.55, 0.2]}
          fontSize={0.22}
          color="#ccccff"
          anchorX="center"
          anchorY="middle"
          maxWidth={5.2}
          textAlign="center"
          font="https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nRivN.woff"
        >
          {line}
        </Text>
      ))}
    </group>
  )
}
