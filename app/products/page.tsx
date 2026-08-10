'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/anim'
import { menu, formatPrice } from '@/data/products'
import { MenuVideo } from '@/components/MenuVideo'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(false)

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
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    })

    return () => mm.revert()
  }, [])

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
            Scroll to explore
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
      </section>
    </main>
  )
}
