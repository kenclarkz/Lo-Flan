'use client'

import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ModelOrFallback } from './ModelOrFallback'
import { MeshDistortMaterial } from '@react-three/drei'
import { asset } from '@/lib/paths'

type PanProps = {
  /** Batter fill 0–1 (driven externally via ref) */
  fill?: RefObject<number>
  /** Distort on surface (driven externally via ref) */
  distort?: RefObject<number>
  /** Tilt for pouring (driven externally via ref) */
  tilt?: RefObject<number>
}

const METAL = '#3a3a3e'
const BATTER = '#e6c87a'
const MAX_FILL_HEIGHT = 0.16

export function PanModel({ fill, distort, tilt }: PanProps) {
  const batterRef = useRef<THREE.Mesh>(null)
  const batterTopRef = useRef<any>(null)

  useFrame(() => {
    const f = fill?.current ?? 0

    // Grow the batter from the pan bottom
    if (batterRef.current) {
      const h = Math.max(0.01, f) * MAX_FILL_HEIGHT
      batterRef.current.scale.y = f > 0.001 ? Math.max(0.01, f) : 0.0001
      batterRef.current.position.y = 0.05 + h / 2
    }

    // Keep the distort surface riding on top of the batter
    if (batterTopRef.current) {
      const h = Math.max(0.01, f) * MAX_FILL_HEIGHT
      batterTopRef.current.position.y = 0.05 + h
      const mat = batterTopRef.current.material
      if (mat?.uniforms?.distort) {
        mat.uniforms.distort.value = distort?.current ?? 0
      }
    }
  })

  const t = tilt?.current ?? 0

  return (
    <ModelOrFallback url={asset('/assets/blender/pan.glb')}>
      <group rotation={[t, 0, 0]}>
        {/* Pan body */}
        <mesh receiveShadow position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.22, 64]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.03, 64]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Batter inside (scaled in useFrame) */}
        <mesh ref={batterRef} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.82, 0.82, MAX_FILL_HEIGHT, 48]} />
          <meshPhysicalMaterial
            color={BATTER}
            roughness={0.25}
            clearcoat={0.8}
            clearcoatRoughness={0.12}
          />
        </mesh>

        {/* Surface with subtle distort */}
        <mesh ref={batterTopRef} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.02, 48]} />
          <MeshDistortMaterial
            distort={0}
            speed={3}
            color={BATTER}
            roughness={0.2}
            clearcoat={0.9}
            clearcoatRoughness={0.08}
          />
        </mesh>
      </group>
    </ModelOrFallback>
  )
}
