'use client'

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

type Options = {
  /** Total scroll length the chapter consumes, as a viewport multiplier, e.g. 2.4 */
  length?: number
}

/**
 * Tracks scroll progress (0 → 1) for a full-screen chapter section.
 *
 * Chapters are laid out as `position: sticky` full-viewport sections that stack
 * over each other while scrolling. ScrollTrigger `pin` is deliberately NOT used
 * because it wraps sections in `pin-spacer` nodes, which mutates the DOM and
 * causes React `insertBefore`/`NotFoundError` crashes. Progress is instead
 * derived per frame from the section's cached document offset.
 */
export function usePinnedScene(
  containerRef: RefObject<HTMLElement>,
  options: Options = {}
) {
  const progressRef = useRef(0)
  const offsetRef = useRef(0)
  const lengthRef = useRef(1)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || typeof window === 'undefined') return

    const measure = () => {
      offsetRef.current = el.getBoundingClientRect().top + window.scrollY
      const mobile = window.innerWidth < 768 ? 0.7 : 1
      lengthRef.current = Math.max(0.1, (options.length ?? 1) * mobile)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [containerRef, options.length])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const y = window.scrollY
      const total = window.innerHeight * lengthRef.current
      progressRef.current =
        total > 0 ? Math.min(1, Math.max(0, (y - offsetRef.current) / total)) : 0
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return { progressRef }
}

/**
 * Drives DOM overlays inside a scene from scroll progress.
 *
 * Elements opt in via data attributes:
 *   data-reveal            → fades/slides in during the first ~20%
 *   data-reveal-delay="2"  → stagger offset (index added automatically)
 *   data-visible           → starts fully visible at rest (no appear animation)
 *   data-fade="late"       → fades out before the scene ends
 *   data-cta               → interactive element, pointer events enabled only when visible
 */
export function useSceneText(
  containerRef: RefObject<HTMLElement>,
  progressRef: RefObject<number>
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof window === 'undefined') return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    let raf = 0
    let last = -1

    const update = () => {
      raf = requestAnimationFrame(update)
      const p = progressRef.current ?? 0
      if (Math.abs(p - last) < 0.001) return
      last = p

      targets.forEach((node, i) => {
        const delay = Number(node.dataset.revealDelay ?? 0) + i * 0.015
        const appear = easeOutInRange(p, 0.03 + delay, 0.16 + delay)
        let opacity = appear
        let ty = (1 - appear) * 54

        if (node.hasAttribute('data-visible')) {
          opacity = 1
          ty = 0
        }

        if (node.dataset.fade === 'late') {
          const keep = 1 - easeInOut(pInRange(p, 0.86, 0.97))
          opacity = Math.min(opacity, keep)
        }

        if (node.hasAttribute('data-cta')) {
          node.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        }

        node.style.opacity = String(Math.min(1, Math.max(0, opacity)))
        node.style.transform = `translateY(${ty.toFixed(2)}px)`
      })
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [containerRef, progressRef])
}

export const pInRange = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)))

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export const easeOutInRange = (p: number, a: number, b: number) =>
  easeOut(pInRange(p, a, b))
