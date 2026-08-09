'use client'

import { useEffect, useRef } from 'react'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'

export default function BlenderScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 1.9 })

  useSceneText(sectionRef, progressRef)

  useEffect(() => {
    let raf = 0
    const upd = () => {
      const p = progressRef.current
      if (statusRef.current) {
        if (p < 0.15) statusRef.current.textContent = 'Adding ingredients\u2026'
        else if (p < 0.25) statusRef.current.textContent = 'Locking the lid\u2026'
        else if (p < 0.55) statusRef.current.textContent = 'Building the vortex\u2026'
        else if (p < 0.75) statusRef.current.textContent = 'Watching it get silky\u2026'
        else statusRef.current.textContent = 'Ready to pour\u2026'
      }
      if (barRef.current) {
        barRef.current.style.width = `${Math.min(100, Math.round(p * 100))}%`
      }
      raf = requestAnimationFrame(upd)
    }
    raf = requestAnimationFrame(upd)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <SceneShell ref={sectionRef} id="blend" chapter="The Blend" extra={0.9}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-12 pb-14 text-center pointer-events-none sm:pt-20">
        <div>
          <p data-reveal className="eyebrow">Chapter 03 — The Blend</p>
          <h2 data-reveal data-reveal-delay="1" className="display mt-3 text-3xl sm:text-5xl font-light leading-[1.1] max-w-2xl">
            Then comes the alchemy.
          </h2>
        </div>

        <div className="w-full max-w-md space-y-3" data-reveal data-fade="late">
          <p ref={statusRef} className="text-sm uppercase tracking-[0.25em] text-cream/70">
            Adding ingredients&hellip;
          </p>
          <div className="h-px w-full bg-cream/15 overflow-hidden">
            <div ref={barRef} className="h-px bg-gold" style={{ width: '0%' }} />
          </div>
        </div>
      </div>
    </SceneShell>
  )
}
