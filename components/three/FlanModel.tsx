'use client'

import { useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ModelOrFallback } from './ModelOrFallback'
import { asset } from '@/lib/paths'
import { lerp } from './math'

const CARAMEL = '#A65A1E'
const CARAMEL_TOP = '#C97B2C'
const CUSTARD = '#F4DCAB'
const CERAMIC = '#EFE6D6'

const DRIPS = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2 + 0.3
  return {
    angle,
    length: 0.34 + (i % 4) * 0.13,
    radius: 0.055 + (i % 3) * 0.016,
  }
})

function ProceduralFlan({ dripRef }: { dripRef: RefObject<number> }) {
  const dripGroup = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!dripGroup.current || !dripRef.current) return
    const target = 0.55 + dripRef.current * 0.75
    dripGroup.current.scale.y = lerp(dripGroup.current.scale.y, target, 0.08)
  })

  return (
    <group>
      {/* plate */}
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.55, 1.35, 0.12, 80]} />
        <meshPhysicalMaterial
          color={CERAMIC}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <torusGeometry args={[1.42, 0.09, 16, 80]} />
        <meshPhysicalMaterial
          color={CERAMIC}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* custard dome */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <sphereGeometry args={[0.98, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshPhysicalMaterial
          color={CUSTARD}
          roughness={0.3}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.97, 0.97, 0.26, 64]} />
        <meshPhysicalMaterial
          color={CUSTARD}
          roughness={0.3}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* caramel cap + dripping caramel */}
      <group ref={dripGroup}>
        <mesh position={[0, 0.82, 0]} castShadow>
          <cylinderGeometry args={[0.68, 0.72, 0.3, 48]} />
          <meshPhysicalMaterial
            color={CARAMEL}
            roughness={0.14}
            clearcoat={0.95}
            clearcoatRoughness={0.08}
          />
        </mesh>
        <mesh position={[0, 0.87, 0]}>
          <cylinderGeometry args={[0.62, 0.68, 0.16, 48]} />
          <meshPhysicalMaterial
            color={CARAMEL_TOP}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </mesh>
        {DRIPS.map((d, i) => {
          const x = Math.cos(d.angle) * 0.69
          const z = Math.sin(d.angle) * 0.69
          const y = 0.8 - d.length / 2
          return (
            <mesh
              key={i}
              position={[x, y, z]}
              rotation={[Math.cos(d.angle) * 0.16, 0, -Math.sin(d.angle) * 0.16]}
              castShadow
            >
              <capsuleGeometry args={[d.radius, d.length]} />
              <meshPhysicalMaterial
                color={CARAMEL}
                roughness={0.12}
                clearcoat={1}
                clearcoatRoughness={0.06}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function FlanModel({
  dripRef = { current: 1 } as RefObject<number>,
  ...props
}: { dripRef?: RefObject<number> } & JSX.IntrinsicElements['group']) {
  return (
    <ModelOrFallback url={asset('/assets/flan/flan.glb')}>
      <group {...props}>
        <ProceduralFlan dripRef={dripRef} />
      </group>
    </ModelOrFallback>
  )
}
