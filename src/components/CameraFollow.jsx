import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const CAM_OFFSET = new THREE.Vector3(0, 6, -12)
const CAM_LOOK_OFFSET = new THREE.Vector3(0, 1, 0)
const tmp = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()

export function CameraFollow({ carRef }) {
  const { camera } = useThree()
  const currentPos = useRef(new THREE.Vector3(0, 6, -12))
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, delta) => {
    if (!carRef?.current) return
    const pos = carRef.current.getPosition?.()
    const rot = carRef.current.getRotation?.()
    if (!pos || !rot) return

    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z)
    const carQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)

    // Desired camera position: offset rotated by car yaw
    const offset = CAM_OFFSET.clone().applyQuaternion(carQuat)
    const desired = carPos.clone().add(offset)

    // Smooth lerp
    const lerpFactor = 1 - Math.pow(0.01, delta)
    currentPos.current.lerp(desired, lerpFactor * 5)
    currentLook.current.lerp(carPos.clone().add(CAM_LOOK_OFFSET), lerpFactor * 6)

    camera.position.copy(currentPos.current)
    camera.lookAt(currentLook.current)
  })

  return null
}
