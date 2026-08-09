'use client'

import { useEffect, useRef } from 'react'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'

export default function OvenScene() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const heatRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 1.9 })

  useSceneText(sectionRef, progressRef)

  useEffect(() => {
    let raf = 0
    const upd = () => {
      const p = progressRef.current
      if (statusRef.current) {
        if (p < 0.2) statusRef.current.textContent = 'Heating the oven\u2026'
        else if (p < 0.4) statusRef.current.textContent = 'Setting up the water bath\u2026'
        else if (p < 0.6) statusRef.current.textContent = 'Baking low & slow\u2026'
        else if (p < 0.85) statusRef.current.textContent = 'Almost there\u2026'
        else statusRef.current.textContent = 'Golden & set'
      }
      if (heatRef.current) {
        const heat = Math.min(100, Math.round(((p - 0.1) / 0.8) * 100))
        heatRef.current.style.width = `${Math.max(0, heat)}%`
      }
      if (flashRef.current) {
        const glow = p > 0.55 && p < 0.95 ? 0.5 - Math.abs(p - 0.75) * 2 : 0
        flashRef.current.style.opacity = `${Math.max(0, glow * 0.9).toFixed(2)}`
      }
      raf = requestAnimationFrame(upd)
    }
    raf = requestAnimationFrame(upd)
    return () => cancelAnimationFrame(raf)
  }, [progressRef])

  return (
    <SceneShell ref={sectionRef} id="oven" chapter="The Bake" extra={0.9}>
      {/* Warm glow while baking */}
      <div
        ref={flashRef}
        className="absolute inset-0 bg-gradient-to-t from-[#ff9a3c]/20 via-transparent to-transparent opacity-0 pointer-events-none"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-12 pb-14 text-center pointer-events-none sm:pt-20">
        <div>
          <p data-reveal className="eyebrow">Chapter 05 — The Bake</p>
          <h2 data-reveal data-reveal-delay="1" className="display mt-3 text-3xl sm:text-5xl font-light leading-[1.1] max-w-2xl">
            Patience is the secret ingredient.
          </h2>
        </div>

        <div className="w-full max-w-md space-y-3" data-reveal data-fade="late">
          <p ref={statusRef} className="text-sm uppercase tracking-[0.25em] text-cream/70">
            Heating the oven&hellip;
          </p>
          <div className="h-px w-full bg-cream/15 overflow-hidden">
            <div ref={heatRef} className="h-px bg-gold" style={{ width: '0%' }} />
          </div>
        </div>
      </div>
    </SceneShell>
  )
}
