'use client'

import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/anim'

let instance: Lenis | null = null

export function initLenis() {
  if (instance) return instance

  instance = new Lenis({
    duration: 0.75,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.8,
    wheelMultiplier: 1.8,
  })

  instance.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => instance?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => ScrollTrigger.refresh())
  }

  return instance
}

export function getLenis() {
  return instance
}

export function scrollToTop() {
  instance?.scrollTo(0, { immediate: true })
}
