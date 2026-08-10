'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/anim'
import { getLenis } from '@/lib/lenis'
import { menu, formatPrice } from '@/data/products'
import { MenuVideo } from '@/components/MenuVideo'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MenuPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const [reduced, setReduced] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  }, [])

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      const track = trackRef.current
      const section = sectionRef.current
      if (!track || !section) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const distance = () => track.scrollWidth - window.innerWidth

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActive(Math.round(self.progress * (menu.length - 1)))
          },
        },
      })
      stRef.current = tween.scrollTrigger ?? null

      return () => {
        stRef.current = null
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    })

    return () => mm.revert()
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
      setActive(Math.max(0, Math.min(menu.length - 1, i)))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(menu.length - 1, index))
    const track = trackRef.current
    if (!track) return

    if (stRef.current) {
      const st = stRef.current
      const top = st.start + (st.end - st.start) * (target / (menu.length - 1))
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(top, { duration: 1.2 })
      else window.scrollTo({ top, behavior: 'smooth' })
    } else {
      track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen bg-black text-cream">
      <section ref={sectionRef} className="relative bg-black">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-6 px-6 pt-24 sm:px-10 sm:pt-28 lg:px-16 lg:pt-32">
          <div>
            <p className="eyebrow">The Menu</p>
            <h1 className="display mt-2 text-3xl font-light sm:text-4xl">
              Our Flans
            </h1>
          </div>
          <p className="hidden text-[0.62rem] uppercase tracking-[0.3em] text-cream/50 sm:block">
            Use the arrows to explore
          </p>
        </header>

        <div
          ref={trackRef}
          className={cn(
            'no-scrollbar flex h-[100svh] snap-x snap-mandatory',
            reduced ? 'overflow-x-auto' : 'overflow-x-auto md:overflow-hidden'
          )}
        >
          {menu.map((product, i) => (
            <article
              key={product.id}
              data-panel
              className="relative flex h-full w-screen shrink-0 snap-start items-end overflow-hidden bg-black"
            >
              <MenuVideo
                product={product}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

              <div className="relative z-10 w-full p-6 pb-16 sm:p-10 sm:pb-20 lg:p-16 lg:pb-24">
                <p className="eyebrow mb-4">
                  {String(i + 1).padStart(2, '0')} /{' '}
                  {String(menu.length).padStart(2, '0')}
                </p>
                <h2 className="display text-5xl font-light leading-none sm:text-7xl lg:text-8xl">
                  {product.name}
                </h2>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                  <span className="text-2xl font-medium text-gold sm:text-3xl">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-[0.68rem] uppercase tracking-[0.25em] text-cream/60">
                    {product.tagline}
                  </span>
                </div>
                <p className="mt-4 max-w-md text-cream/70 sm:text-lg">
                  {product.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 sm:bottom-10 sm:right-10 lg:bottom-16 lg:right-16">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous flan"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-cream/25 text-cream transition-all duration-300 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === menu.length - 1}
            aria-label="Next flan"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-cream/25 text-cream transition-all duration-300 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  )
}
