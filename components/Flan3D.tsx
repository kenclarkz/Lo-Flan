'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { GatedCanvas } from '@/components/three/GatedCanvas'
import { WarmLighting, StudioEnv } from '@/components/three/Lighting'
import { asset } from '@/lib/paths'

const MODEL_URL = asset('/assets/flan/flan.glb')
const TARGET_SIZE = 2.3

function FlanModel() {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  const [model, setModel] = useState<THREE.Group | null>(null)

  useEffect(() => {
    const clone = scene.clone(true)

    // Center on the bounding box and scale to a consistent size regardless of
    // the Blender scene units.
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    clone.position.sub(center)
    const max = Math.max(size.x, size.y, size.z)
    if (max > 0) clone.scale.multiplyScalar(TARGET_SIZE / max)

    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })

    setModel(clone)
  }, [scene])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.25
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.06
  })

  return (
    <group ref={groupRef}>{model ? <primitive object={model} /> : null}</group>
  )
}

/**
 * Hyper zoom-in on activation, then a continuous 360° orbit around the flan.
 */
function OrbitRig() {
  useFrame((state) => {
    const cam = state.camera
    const t = state.clock.elapsedTime
    const zoomT = Math.min(1, t / 2.5)
    const eased = 1 - Math.pow(1 - zoomT, 3)
    const radius = THREE.MathUtils.lerp(8, 4.4, eased)
    const angle = t * 0.75
    const y = 1.9 + Math.sin(t * 0.8) * 0.22
    cam.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
    cam.lookAt(0, 0.9, 0)
  })
  return null
}

/**
 * Full-screen 3D flan backdrop for the final "reveal" chapter. The Blender GLB
 * floats in a dark studio and the camera orbits around it.
 *
 * The canvas is transparent (alpha) so the fixed fire/burn layer shows through
 * behind the flan — the oven photo burns away and reveals the orbiting dessert.
 */
export default function Flan3D({ className }: { className?: string }) {
  return (
    <GatedCanvas
      className={className}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      camera={{ position: [0, 1.9, 8], fov: 40 }}
    >
      <WarmLighting />
      <StudioEnv />
      <FlanModel />
      <OrbitRig />
    </GatedCanvas>
  )
}
