'use client'

import type { ReactNode } from 'react'
import { useAssetExists } from '@/lib/assets'
import { GlbModel } from './GlbModel'

/**
 * Renders a Blender-produced GLB when it exists in /public/assets,
 * otherwise renders the procedural placeholder.
 *
 *   <ModelOrFallback url="/assets/flan/flan.glb">
 *     <ProceduralFlan />
 *   </ModelOrFallback>
 */
export function ModelOrFallback({
  url,
  children,
  fallback = true,
}: {
  url?: string
  children: ReactNode
  fallback?: boolean
}) {
  const exists = useAssetExists(url)

  if (!url || exists === false || !fallback) return <>{children}</>
  if (exists === null) return <>{children}</>
  return <GlbModel url={url} />
}
