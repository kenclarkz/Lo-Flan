'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { makeSoftCircleTexture } from '@/lib/textures'

type SteamProps = {
  count?: number
  spread?: number
  height?: number
  speed?: number
  opacity?: number
  size?: number
  color?: string
}

/** Soft rising steam made of additive particles. */
export function Steam({
  count = 160,
  spread = 2,
  height = 2.4,
  speed = 0.5,
  opacity = 0.4,
  size = 0.18,
  color = 'rgba(255,255,255,0.85)',
}: SteamProps) {
  const ref = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
      velocities[i] = speed * (0.6 + Math.random() * 0.8)
    }
    return { positions, velocities }
  }, [count, spread, height, speed])

  const texture = useMemo(() => makeSoftCircleTexture(128, color), [color])

  useFrame((state, delta) => {
    const points = ref.current
    if (!points) return
    const attr = points.geometry.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const j = i * 3
      arr[j + 1] += velocities[i] * delta
      arr[j] += Math.sin(t * 0.8 + i * 0.37) * delta * 0.12
      arr[j + 2] += Math.cos(t * 0.6 + i * 0.53) * delta * 0.1
      if (arr[j + 1] > height) {
        arr[j + 1] = 0
        arr[j] = (Math.random() - 0.5) * spread
        arr[j + 2] = (Math.random() - 0.5) * spread
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        color="#ffffff"
      />
    </points>
  )
}
