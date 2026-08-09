'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether a Blender-rendered GLB/PNG/MP4 asset exists in /public.
 * When an artist drops a real asset into the folder, these hooks return true
 * and the procedural placeholder is replaced automatically.
 */
export function useAssetExists(path: string | undefined) {
  const [exists, setExists] = useState<boolean | null>(null)

  useEffect(() => {
    if (!path || typeof window === 'undefined') {
      setExists(false)
      return
    }
    let cancelled = false
    fetch(path, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setExists(res.ok)
      })
      .catch(() => {
        if (!cancelled) setExists(false)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return exists
}

/** Detect coarse device capability for quality scaling. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return mobile
}
