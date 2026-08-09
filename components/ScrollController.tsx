'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { initLenis, getLenis, scrollToTop } from '@/lib/lenis'
import { gsap, ScrollTrigger } from '@/lib/anim'
import { setActiveChapter as setActiveChapterStore } from '@/lib/chapterState'
import { chapters } from '@/data/site'
import { cn } from '@/lib/utils'

export default function ScrollController({
  children,
}: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [activeChapter, setActiveChapter] = useState(0)
  const rafRef = useRef(0)
  const sectionsRef = useRef<HTMLElement[]>([])
  const offsetsRef = useRef<number[]>([])
  const pathname = usePathname()

  // Init Lenis + GSAP integration
  useEffect(() => {
    const lenis = initLenis()

    const measure = () => {
      sectionsRef.current = Array.from(
        document.querySelectorAll('section[data-chapter]')
      ) as HTMLElement[]
      offsetsRef.current = sectionsRef.current.map(
        (s) => s.getBoundingClientRect().top + window.scrollY
      )
    }
    measure()
    window.addEventListener('resize', measure)

    const onLoad = () => {
      measure()
      ScrollTrigger.refresh()
    }
    window.addEventListener('load', onLoad)

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY
        const h = document.documentElement.scrollHeight - window.innerHeight

        // Update progress bar without re-rendering the scenes
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${h > 0 ? y / h : 0})`
        }

        // Determine active chapter from cached section offsets
        let idx = 0
        const offs = offsetsRef.current
        for (let i = 0; i < offs.length; i++) {
          if (y >= offs[i]) idx = i
        }
        setActiveChapter(idx)
        setActiveChapterStore(idx)

        rafRef.current = 0
      })
    }

    lenis.on('scroll', onScroll)

    return () => {
      window.removeEventListener('load', onLoad)
      window.removeEventListener('resize', measure)
      lenis.off('scroll', onScroll)
    }
  }, [])

  // Reset scroll on route change
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    getLenis()?.scrollTo(0, { immediate: true })
    setTimeout(() => ScrollTrigger.refresh(), 0)
  }, [pathname])

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed left-0 top-0 z-[70] h-[2px] w-full bg-cream/10">
        <div
          ref={progressBarRef}
          className="h-full origin-left bg-gold"
          style={{ transform: 'scaleX(0)' }}
          aria-hidden
        />
      </div>

      {/* Chapter rail (desktop only) */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-[60] flex-col items-end gap-5 pointer-events-none">
        {chapters.map((ch, i) => (
          <div
            key={ch.id}
            className={cn(
              'flex items-center gap-3 opacity-40 transition-all duration-500',
              i === activeChapter && 'opacity-100'
            )}
            aria-hidden
          >
            <span
              className="eyebrow text-right whitespace-nowrap"
              style={{ transformOrigin: 'right center' }}
            >
              {ch.label}
            </span>
            <div
              className="w-14 h-px bg-cream/20 relative overflow-hidden"
              style={{ transformOrigin: 'right center' }}
            >
              <div
                className="absolute right-0 top-0 h-full bg-gold transition-all duration-500 ease-expo"
                style={{
                  width:
                    i === activeChapter
                      ? '100%'
                      : i < activeChapter
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <main ref={mainRef} className="relative">
        {children}
      </main>
    </>
  )
}