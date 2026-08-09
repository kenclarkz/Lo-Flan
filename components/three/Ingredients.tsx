'use client'

import { useMemo } from 'react'
import { ModelOrFallback } from './ModelOrFallback'

export type IngredientDef = {
  id: string
  label: string
  sub: string
  pos: [number, number, number]
  scale: number
}

export const INGREDIENT_LAYOUT: IngredientDef[] = [
  { id: 'eggs', label: 'Free-Range Eggs', sub: 'Pasture raised', pos: [-2.4, 0.55, 0.5], scale: 1 },
  { id: 'milk', label: 'Whole Milk', sub: 'Small-farm creamery', pos: [2.4, 0.15, -0.3], scale: 1 },
  { id: 'sugar', label: 'Golden Sugar', sub: 'Unrefined cane', pos: [0.6, -0.45, -2.4], scale: 1 },
  { id: 'vanilla', label: 'Madagascar Vanilla', sub: 'Hand-split pods', pos: [-0.7, 1.05, -2.2], scale: 1 },
  { id: 'cream', label: 'Heavy Cream', sub: '35% rich & silky', pos: [2.55, 0.85, 1.25], scale: 1 },
  { id: 'caramel', label: 'Burnt Caramel', sub: 'Cooked until amber', pos: [-2.5, 0.0, 1.4], scale: 1 },
]

export function Ingredient({ id }: { id: string }) {
  return (
    <ModelOrFallback url={`/assets/ingredients/${id}.glb`}>
      {renderPlaceholder(id)}
    </ModelOrFallback>
  )
}

function renderPlaceholder(id: string) {
  switch (id) {
    case 'eggs':
      return <Eggs />
    case 'milk':
      return <Milk />
    case 'sugar':
      return <Sugar />
    case 'vanilla':
      return <Vanilla />
    case 'cream':
      return <Cream />
    case 'caramel':
      return <CaramelBottle />
    default:
      return null
  }
}

function Eggs() {
  return (
    <group>
      <mesh position={[-0.16, 0.08, 0.06]} rotation={[0.2, 0.4, 0.3]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.22, 24, 20]} />
        <meshPhysicalMaterial color="#fbf6ee" roughness={0.3} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.16, 0.04, -0.05]} rotation={[-0.1, -0.3, 0.15]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.19, 24, 20]} />
        <meshPhysicalMaterial color="#f6efe4" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.3, 0.04, 0.2]} rotation={[0.5, 0.9, 0.2]} scale={[1, 1.12, 1]}>
        <sphereGeometry args={[0.14, 24, 20]} />
        <meshPhysicalMaterial color="#fbf6ee" roughness={0.3} clearcoat={0.6} />
      </mesh>
    </group>
  )
}

function Milk() {
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.5, 28]} />
        <meshPhysicalMaterial
          color="#eef2f5"
          roughness={0.08}
          clearcoat={0.9}
          transparent
          opacity={0.42}
        />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.105, 0.13, 0.46, 28]} />
        <meshBasicMaterial color="#fdf9f0" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.045, 0.09, 0.16, 20]} />
        <meshPhysicalMaterial color="#eef2f5" roughness={0.08} clearcoat={0.9} />
      </mesh>
    </group>
  )
}

function Sugar() {
  const cubes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        pos: [
          (Math.random() - 0.5) * 0.32,
          0.2 + Math.random() * 0.1,
          (Math.random() - 0.5) * 0.32,
        ] as [number, number, number],
        rot: [Math.random(), Math.random(), Math.random()],
      })),
    []
  )
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.22, 0.2, 28]} />
        <meshPhysicalMaterial color="#8a6a4f" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 28]} />
        <meshPhysicalMaterial color="#a9886a" roughness={0.5} />
      </mesh>
      {cubes.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={c.rot as [number, number, number]}>
          <boxGeometry args={[0.09, 0.09, 0.09]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

function Vanilla() {
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0.5]} scale={[0.15, 1, 0.15]}>
        <capsuleGeometry args={[0.06, 0.55, 8, 16]} />
        <meshPhysicalMaterial color="#3c2415" roughness={0.5} />
      </mesh>
      <mesh position={[0.42, 0.3, 0]} rotation={[0, 0, -0.35]} scale={[0.12, 1, 0.12]}>
        <capsuleGeometry args={[0.05, 0.4, 8, 16]} />
        <meshPhysicalMaterial color="#4a2e1c" roughness={0.5} />
      </mesh>
      <mesh position={[-0.3, -0.25, 0]} rotation={[0.6, 0.2, -0.6]} scale={[0.1, 1, 0.1]}>
        <capsuleGeometry args={[0.04, 0.35, 8, 16]} />
        <meshPhysicalMaterial color="#5a3a24" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Cream() {
  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.18, 0.13, 0.36, 28]} />
        <meshPhysicalMaterial color="#f4ead8" roughness={0.25} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.05, 0.13, 0.08, 20]} />
        <meshPhysicalMaterial color="#f4ead8" roughness={0.25} clearcoat={0.8} />
      </mesh>
      <mesh position={[0.16, 0.42, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.2, 0.05, 0.11]} />
        <meshPhysicalMaterial color="#f4ead8" roughness={0.25} clearcoat={0.8} />
      </mesh>
    </group>
  )
}

function CaramelBottle() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.16, 0.13, 0.4, 28]} />
        <meshPhysicalMaterial
          color="#b9742f"
          roughness={0.12}
          clearcoat={0.9}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.36, 28]} />
        <meshBasicMaterial color="#7a3e12" transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 20]} />
        <meshPhysicalMaterial color="#5a3818" roughness={0.3} />
      </mesh>
    </group>
  )
}
