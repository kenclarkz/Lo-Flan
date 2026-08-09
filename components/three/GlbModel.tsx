'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { GroupProps } from '@react-three/fiber'

/**
 * Loads a GLB/GLTF produced in Blender and exports it to Three.js.
 * Use useGLTF.preload('/assets/...') during development to warm the cache.
 */
export function GlbModel({ url, ...props }: { url: string } & GroupProps) {
  const { scene } = useGLTF(url)

  const clone = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return copy
  }, [scene])

  return <primitive object={clone} {...props} />
}

export function preloadGlb(urls: string[]) {
  urls.forEach((url) => useGLTF.preload(url))
}
