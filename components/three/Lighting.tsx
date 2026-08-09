'use client'

import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'

/** Warm studio lighting rig used across the 3D scenes. */
export function WarmLighting({
  intensity = 1,
  shadows = false,
}: {
  intensity?: number
  shadows?: boolean
}) {
  return (
    <>
      <ambientLight intensity={0.32 * intensity} color="#fff2e0" />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.7 * intensity}
        color="#ffd9a8"
        castShadow={shadows}
      />
      <directionalLight position={[-5, 2, -4]} intensity={0.55} color="#8fb7d9" />
      <pointLight position={[0, 1.4, 2.4]} intensity={0.5 * intensity} color="#ffbe7a" />
    </>
  )
}

/**
 * Offline environment-map reflections (no HDR download needed) that make the
 * glossy caramel, custard and glass read as "premium product photography".
 */
export function StudioEnv() {
  return (
    <Environment resolution={256}>
      <Lightformer
        intensity={1.5}
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
        color="#fff3e2"
      />
      <Lightformer
        intensity={0.7}
        position={[-5, 1.5, -1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[6, 2, 1]}
        color="#ffc87a"
      />
      <Lightformer
        intensity={0.5}
        position={[5, 1.5, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[6, 2, 1]}
        color="#cfe0ff"
      />
    </Environment>
  )
}

/** Opaque dark studio backdrop + fog so glass/transmission has depth to refract. */
export function StudioBackdrop({ color = '#191009' }: { color?: string }) {
  return (
    <>
      <mesh scale={60}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color={color} side={THREE.BackSide} />
      </mesh>
      <fog attach="fog" args={[color, 13, 34]} />
    </>
  )
}
