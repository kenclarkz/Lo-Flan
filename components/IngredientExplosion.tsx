'use client'

import { useRef } from 'react'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'

export default function IngredientExplosion() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 1.8 })

  useSceneText(sectionRef, progressRef)

  return (
    <SceneShell ref={sectionRef} id="ingredients" chapter="Ingredients" extra={0.8}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-6 pt-12 pb-16 text-center pointer-events-none sm:pt-20">
        <div>
          <p data-reveal className="eyebrow">Chapter 02 — The Ingredients</p>
          <h2 data-reveal data-reveal-delay="1" className="display mt-3 text-3xl sm:text-5xl font-light leading-[1.1] max-w-2xl">
            Six ingredients.<br />One obsession.
          </h2>
        </div>
        <p data-reveal data-fade="late" className="text-cream/50 text-sm uppercase tracking-[0.2em]">
          They move toward the blender&hellip;
        </p>
      </div>
    </SceneShell>
  )
}
