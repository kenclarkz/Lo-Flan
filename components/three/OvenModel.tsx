'use client'

import { useRef, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ModelOrFallback } from './ModelOrFallback'
import { asset } from '@/lib/paths'
import { lerp, easeInOutCubic } from './math'
import { Sparkles } from '@react-three/drei'

type OvenProps = {
  /** Door open progress 0–1 (driven externally via ref) */
  doorOpen?: RefObject<number>
  /** Pan slide progress (0 outside → 1 on rack) */
  panIn?: RefObject<number>
  /** Heat/baking intensity 0–1 */
  heat?: RefObject<number>
  /** Pan group ref for external control */
  panRef?: MutableRefObject<THREE.Group | null>
  /** Door group ref for external control */
  doorRef?: RefObject<THREE.Group>
}

const BODY = '#26221c'
const CAVITY = '#0f0c09'
const RACK = '#4a4a50'
const HANDLE = '#c9a96a'
const METAL = '#3a3a3e'

export function OvenModel({
  doorOpen,
  panIn,
  heat,
  panRef,
  doorRef,
  ...props
}: OvenProps) {
  const heatLightRef = useRef<THREE.PointLight>(null)
  const sparklesRef = useRef<THREE.Group>(null)
  const panGroupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const door = doorOpen?.current ?? 0
    const pan = panIn?.current ?? 0
    const heatVal = heat?.current ?? 0

    // Door hinge animation
    if (doorRef?.current) {
      doorRef.current.rotation.y = door * 0.85
    }

    // Pan slide
    if (panGroupRef.current) {
      // Start outside (z = 1.2), slide to rack (z = 0.1)
      const z = lerp(1.15, 0.1, easeInOutCubic(pan))
      panGroupRef.current.position.z = z
    }

    // Heat light pulse
    if (heatLightRef.current) {
      heatLightRef.current.intensity = 0.3 + heatVal * 2.4 + Math.sin(t * 2.2) * 0.25
    }

    // Sparkles rise and fade with heat
    const points = sparklesRef.current?.children?.[0] as THREE.Points | undefined
    if (points?.geometry) {
      const attrs = points.geometry.attributes
      const pos = attrs.position.array as Float32Array
      const size = attrs.size.array as Float32Array
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += delta * 0.6 * (0.3 + heatVal)
        pos[i] += Math.sin(t * 3 + i) * delta * 0.08
        size[i / 3] = (0.15 + heatVal * 0.1) * (1 - pos[i + 1] / 1.2)
        if (pos[i + 1] > 1.2) {
          pos[i + 1] = -0.2
          pos[i] = (Math.random() - 0.5) * 1.4
        }
      }
      attrs.position.needsUpdate = true
      attrs.size.needsUpdate = true
    }

    // Sync external refs
    if (panRef) panRef.current = panGroupRef.current
  })

  return (
    <ModelOrFallback url={asset('/assets/oven/oven.glb')}>
      <group {...props}>
        {/* Oven body */}
        <mesh position={[0, 0.85, 0]} receiveShadow>
          <boxGeometry args={[2.5, 1.9, 1.5]} />
          <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.15} />
        </mesh>

        {/* Cavity */}
        <mesh position={[0, 0.85, 0.05]} receiveShadow>
          <boxGeometry args={[1.9, 1.35, 1.2]} />
          <meshStandardMaterial color={CAVITY} roughness={0.9} />
        </mesh>

        {/* Rack */}
        <mesh position={[0, 0.42, 0.15]}>
          <boxGeometry args={[1.8, 0.02, 1.0]} />
          <meshStandardMaterial color={RACK} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Door */}
        <group ref={doorRef} position={[-1.22, 0.85, 0.74]}>
          <group position={[1.22, 0, 0]}>
            <mesh position={[0, 0, 0.02]} receiveShadow>
              <boxGeometry args={[2.5, 1.5, 0.06]} />
              <meshStandardMaterial color="#312b24" metalness={0.3} roughness={0.4} />
            </mesh>
            {/* Glass window */}
            <mesh position={[0, 0.05, 0.03]}>
              <planeGeometry args={[1.9, 1.05]} />
              <meshPhysicalMaterial
                color="#0d0a07"
                roughness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0, -0.06]}>
              <boxGeometry args={[0.9, 0.05, 0.05]} />
              <meshStandardMaterial color={HANDLE} metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Legs */}
        <mesh position={[-1.05, -0.1, -0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={RACK} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[1.05, -0.1, -0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={RACK} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-1.05, -0.1, 0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={RACK} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[1.05, -0.1, 0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          <meshStandardMaterial color={RACK} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Pan on rack */}
        <group ref={panGroupRef} position={[0, 0.42, 0.15]}>
          <mesh position={[0, 0.11, 0]} receiveShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.22, 64]} />
            <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.03, 64]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.35} />
          </mesh>
        </group>

        {/* Heat sparkles */}
        <group ref={sparklesRef} position={[0, -0.1, 0]}>
          <Sparkles
            count={140}
            scale={[2, 1.2, 1.6]}
            size={0.12}
            speed={0.4}
            color="#ff8c2e"
            opacity={0.6}
          />
        </group>

        {/* Interior glow */}
        <pointLight
          ref={heatLightRef}
          position={[0, 0.8, -0.45]}
          color="#ff8c2e"
          intensity={0.3}
          distance={3}
          decay={2}
        />
      </group>
    </ModelOrFallback>
  )
}