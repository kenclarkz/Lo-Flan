'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Facebook, Instagram } from 'lucide-react'
import { site } from '@/data/site'
import { getSocialLink } from '@/lib/admin'
import { cn } from '@/lib/utils'

/**
 * Small circular Instagram & Facebook buttons pinned to the bottom-middle of
 * the viewport, directly under the chat box. Links are modular: an admin can
 * override them in the control panel (stored in localStorage) and they fall
 * back to the defaults in `data/site.ts`. On the homepage they fade in with
 * the chat CTA once the visitor starts scrolling.
 */
export function SocialButtons() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [links, setLinks] = useState({
    instagram: site.instagram,
    facebook: site.facebook,
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setLinks({
      instagram: getSocialLink('instagram') ?? site.instagram,
      facebook: getSocialLink('facebook') ?? site.facebook,
    })
  }, [])

  // On the homepage, fade in together with the chat launcher's CTA.
  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const visible = !isHome || scrolled

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-6 z-40 flex items-center justify-center gap-3 px-6 transition-opacity duration-700 sm:bottom-8',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <a
        href={links.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Instagram"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/30 bg-espresso/80 text-cream backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold"
      >
        <Instagram className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Facebook"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/30 bg-espresso/80 text-cream backdrop-blur-sm transition-all duration-300 hover:border-gold hover:text-gold"
      >
        <Facebook className="h-4 w-4" aria-hidden />
      </a>
    </div>
  )
}
