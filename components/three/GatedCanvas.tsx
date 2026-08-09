'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { CanvasProps } from '@react-three/fiber'
import {
  getActiveChapter,
  subscribeActiveChapter,
} from '@/lib/chapterState'

function FrameloopSetter({ active }: { active: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    setFrameloop(active ? 'always' : 'never')
  }, [active, setFrameloop])
  return null
}

/**
 * Canvas wrapper that pauses rendering the moment the scene leaves the
 * viewport — keeps the whole scroll experience at 60fps on mobile.
 *
 * Chapters stack via `position: sticky`, so covered sections still intersect
 * the viewport. Rendering is therefore gated on the *active* chapter (from the
 * scroll controller) rather than on viewport intersection alone.
 */
export function GatedCanvas({
  children,
  className,
  ...props
}: CanvasProps & { className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const indexRef = useRef(-1)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const section = el.closest('section[data-chapter]')
    const sections = Array.from(
      document.querySelectorAll('section[data-chapter]')
    )
    indexRef.current = section ? sections.indexOf(section) : -1

    const refresh = (index: number) => {
      const mine = indexRef.current
      setActive(mine < 0 || mine === index)
    }

    // Pause immediately when truly off-screen (never the case while stacked,
    // but guards non-scene pages and pre-paint moments).
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) refresh(getActiveChapter())
        else setActive(false)
      },
      { rootMargin: '15% 0px' }
    )
    io.observe(el)

    const unsub = subscribeActiveChapter(refresh)
    refresh(getActiveChapter())

    return () => {
      unsub()
      io.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        {...props}
      >
        <FrameloopSetter active={active} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
