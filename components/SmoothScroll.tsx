'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initLenis, getLenis } from '@/lib/lenis'
import { ScrollTrigger } from '@/lib/anim'

/**
 * Boots the global Lenis smooth-scroll instance so every page scrolls
 * continuously instead of stepping with discrete native scroll deltas.
 * Renders nothing.
 */
export function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    initLenis()
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [])

  // Reset scroll on route change
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    getLenis()?.scrollTo(0, { immediate: true })
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [pathname])

  return null
}
