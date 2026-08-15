'use client'

import { useEffect, useState } from 'react'
import { Facebook } from 'lucide-react'
import { site } from '@/data/site'
import { getMessengerLink } from '@/lib/admin'
import { cn } from '@/lib/utils'

/**
 * Big "Order Now" CTA pinned to the bottom of the viewport, on top of the
 * scrolling video. Opens the business owner's Facebook Messenger thread so a
 * visitor can message their order. The link is modular: an admin can override
 * it in the control panel (stored in localStorage) and it falls back to the
 * default in `data/site.ts`.
 */
export function OrderNowButton({ visible }: { visible?: boolean }) {
  const [href, setHref] = useState(site.messenger)

  useEffect(() => {
    setHref(getMessengerLink() ?? site.messenger)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-6 z-40 flex justify-center px-6 transition-opacity duration-700 sm:bottom-8',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-3 rounded-full bg-gold px-10 py-5 text-[0.85rem] font-medium uppercase tracking-[0.2em] text-espresso transition-all duration-500 hover:bg-gold-light hover:shadow-[0_20px_60px_-12px_rgba(201,137,75,0.7)] shadow-[0_16px_48px_-12px_rgba(201,137,75,0.55)]"
      >
        <Facebook className="h-5 w-5" aria-hidden />
        Order Now
      </a>
    </div>
  )
}
