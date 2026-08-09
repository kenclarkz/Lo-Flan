'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { SceneShell } from '@/components/SceneShell'
import { usePinnedScene, useSceneText } from '@/lib/usePinnedScene'

export default function HeroFlan() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { progressRef } = usePinnedScene(sectionRef, { length: 2.4 })

  useSceneText(sectionRef, progressRef)

  return (
    <SceneShell ref={sectionRef} id="flan" chapter="The Flan" extra={1.4}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <p data-reveal data-visible className="eyebrow">Maison de Flan</p>

        <div className="relative mt-6 flex items-center justify-center">
          <div
            data-reveal
            data-visible
            className="absolute inset-0 m-auto rounded-full bg-espresso/45 blur-3xl"
            style={{ width: 'min(80vmin, 720px)', height: 'min(80vmin, 720px)' }}
          />
          <Image
            src="/assets/brand/logo.png"
            alt=""
            width={560}
            height={560}
            priority
            data-reveal
            data-visible
            className="absolute inset-0 m-auto rounded-full"
            style={{ width: 'min(70vmin, 640px)', height: 'auto' }}
          />
          <h1
            data-reveal
            data-visible
            data-reveal-delay="1"
            className="display relative text-[clamp(3.25rem,15vw,9.5rem)] font-light leading-[0.95] tracking-tight text-shadow-soft"
          >
            Lo&apos;s
            <br />
            Flan
          </h1>
        </div>

        <p data-reveal data-visible data-reveal-delay="2" className="mt-8 max-w-xl text-lg sm:text-xl text-cream/85 leading-relaxed">
          Handcrafted flan, made fresh from simple ingredients.
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none opacity-0" data-reveal data-visible data-fade="late">
        <span className="text-[0.62rem] uppercase tracking-[0.3em] text-cream/50">Scroll to begin</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold animate-bounce" style={{animationDuration: '1.8s'}}>
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </div>
    </SceneShell>
  )
}
