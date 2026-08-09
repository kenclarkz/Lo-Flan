'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'
import Flan3D from '@/components/Flan3D'

export default function FinalProduct() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 1.6 })

  useSceneText(sectionRef, progressRef)

  return (
    <SceneShell ref={sectionRef} id="reveal" chapter="The Reveal" extra={1.6}>
      <div data-reveal className="absolute inset-0 pointer-events-none">
        <Flan3D className="h-full w-full pointer-events-none" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-14 text-center pointer-events-none sm:pb-20">
        <p data-reveal className="eyebrow">Chapter 06 — The Reveal</p>
        <h2 data-reveal data-reveal-delay="1" className="display mt-3 text-4xl sm:text-6xl font-light leading-[1.05]">
          Lo&apos;s flan,
          <br />
          ready for you.
        </h2>
        <p data-reveal data-reveal-delay="2" className="mt-5 max-w-xl text-lg text-cream/80 leading-relaxed">
          Every batch is handmade in small quantities. When it&apos;s gone, it&apos;s gone.
        </p>
        <div data-reveal data-reveal-delay="3" data-cta className="mt-8 pointer-events-auto">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-espresso transition-colors hover:bg-cream"
          >
            Order yours
          </Link>
        </div>
      </div>
    </SceneShell>
  )
}
