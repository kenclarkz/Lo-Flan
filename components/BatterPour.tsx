'use client'

import { useRef } from 'react'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'

export default function BatterPour() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 2.2 })

  useSceneText(sectionRef, progressRef)

  return (
    <SceneShell ref={sectionRef} id="pour" chapter="The Pour" extra={1.2}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-12 pb-16 text-center pointer-events-none sm:pt-20">
        <div>
          <p data-reveal className="eyebrow">Chapter 04 — The Pour</p>
          <h2 data-reveal data-reveal-delay="1" className="display mt-3 text-3xl sm:text-5xl font-light leading-[1.1] max-w-2xl">
            Poured with intention.
          </h2>
        </div>
        <p data-reveal data-fade="late" className="text-cream/50 text-sm uppercase tracking-[0.2em]">
          Into the mould&hellip;
        </p>
      </div>
    </SceneShell>
  )
}
