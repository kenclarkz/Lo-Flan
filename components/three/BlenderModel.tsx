'use client'

import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ModelOrFallback } from './ModelOrFallback'
import { lerp, easeInOutCubic } from './math'
import { MeshDistortMaterial } from '@react-three/drei'

type BlenderProps = {
  /** Inner batter fill 0–1 (driven externally via ref) */
  batterLevel?: RefObject<number>
  /** Tilt in radians for pouring (driven externally via ref) */
  tilt?: RefObject<number>
  /** Show animated lid (otherwise use static lid) */
  animateLid?: boolean
  lidProgress?: RefObject<number>
  /** Battery motor intensity 0–1 (driven externally via ref) */
  motor?: RefObject<number>
  /** Distort intensity for batter surface */
  distort?: RefObject<number>
  /** Array refs for dropping ingredients */
  dropsRef?: RefObject<THREE.Group[]>
  /** Camera ref for inside-blender shots */
  camInsideRef?: RefObject<THREE.Group>
}

const GLASS = '#dfe8ee'
const BATTER = '#e6c887'
const RIM = '#3a3a3e'
const BASE = '#2b2b2f'

export function BlenderModel({
  batterLevel,
  tilt,
  animateLid = false,
  lidProgress,
  motor,
  distort,
  dropsRef,
  camInsideRef,
  ...props
}: BlenderProps) {
  const rootRef = useRef<THREE.Group>(null)
  const jarRef = useRef<THREE.Group>(null)
  const lidRef = useRef<THREE.Group>(null)
  const bladeRef = useRef<THREE.Group>(null)
  const batterRef = useRef<THREE.Group>(null)
  const batterTopRef = useRef<any>(null)
  const dropsGroup = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    // Tilt the pour group (everything above base)
    if (jarRef.current) {
      jarRef.current.rotation.x = tilt?.current ?? 0
    }

    // Animate lid closing
    if (animateLid && lidRef.current && lidProgress) {
      const t = easeInOutCubic(lidProgress.current ?? 0)
      lidRef.current.position.y = lerp(2.0, 0.95, t)
      lidRef.current.rotation.z = lerp(0.35, 0, t)
    }

    // Spin blades
    if (bladeRef.current) {
      bladeRef.current.rotation.y += delta * (2 + (motor?.current ?? 0) * 60)
    }

    // Batter fill level
    const level = batterLevel?.current ?? 0
    if (batterRef.current) {
      const h = 0.85 * level
      batterRef.current.scale.y = Math.max(0.01, h / 0.6)
      batterRef.current.position.y = 0.5 + h / 2
    }

    // Distort surface
    if (batterTopRef.current) {
      const mat = batterTopRef.current.material
      if (mat?.uniforms?.distort) {
        mat.uniforms.distort.value = distort?.current ?? 0
      }
    }

    // Drop ingredients (children added externally via dropsGroup)
    if (dropsRef?.current && dropsGroup.current) {
      const p = (motor?.current ?? 0) > 0 ? 1 : 0
      dropsGroup.current.children.forEach((g, i) => {
        if (!g) return
        g.position.y = lerp(2.6, 0.9, p)
        g.visible = p > 0.01
      })
    }

    // Internal camera position for "inside blender" shot
    if (camInsideRef?.current) {
      camInsideRef.current.position.set(0, 1.3, 1.0)
    }
  })

  return (
    <group ref={rootRef} {...props}>
      {/* Base */}
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[0.58, 0.5, 0.36, 48]} />
        <meshStandardMaterial color={BASE} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.52, 0.58, 0.08, 48]} />
        <meshStandardMaterial color="#1f1f22" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.44, 0.4]} receiveShadow>
        <boxGeometry args={[0.08, 0.06, 0.06]} />
        <meshStandardMaterial color="#d9a36a" emissive="#d9a36a" emissiveIntensity={0.6} />
      </mesh>

      {/* Jar + inner contents (tilted together) */}
      <group ref={jarRef} position={[0, 0.5, 0]}>
        {/* Glass jar */}
        <mesh position={[0, 0.6, 0]} receiveShadow>
          <cylinderGeometry args={[0.42, 0.5, 1.2, 48, 1, true]} />
          <meshPhysicalMaterial
            color={GLASS}
            roughness={0.05}
            metalness={0}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner batter */}
        <group ref={batterRef} position={[0, 0.62, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.48, 0.6, 48]} />
            <meshPhysicalMaterial color={BATTER} roughness={0.3} clearcoat={0.7} />
          </mesh>
          {/* Top surface with distort */}
          <mesh ref={batterTopRef} position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.02, 48]} />
            <MeshDistortMaterial
              distort={0}
              speed={2}
              color={BATTER}
              roughness={0.2}
              clearcoat={0.8}
            />
          </mesh>
        </group>

        {/* Blades */}
        <group ref={bladeRef} position={[0, 0.55, 0]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 20]} />
            <meshStandardMaterial color="#8a8a90" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.06]} />
            <meshStandardMaterial color="#c0c0c8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.42, 0.02, 0.06]} />
            <meshStandardMaterial color="#c0c0c8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Rim */}
        <mesh position={[0, 1.22, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.05, 48]} />
          <meshStandardMaterial color={RIM} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Animated lid */}
        <group ref={lidRef} position={[0, 1.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.44, 0.44, 0.14, 48]} />
            <meshStandardMaterial color="#333338" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.12, 24]} />
            <meshStandardMaterial color="#333338" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>

        {/* Falling ingredient drops (managed externally) */}
        <group ref={dropsGroup} position={[0, 0, 0]} />
        <group ref={camInsideRef} position={[0, 0, 0]} />
      </group>
    </group>
  )
}
