'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { usePathname } from 'next/navigation'
import { asset, BASE_PATH } from '@/lib/paths'
import { Menu, X, ShoppingBag, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()
  // usePathname includes the GitHub Pages basePath, but nav hrefs don't.
  const current = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || '/' : pathname
  const { count, open, setOpen } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const navLinks = [
    { label: 'The Experience', href: '/' },
    { label: 'The Menu', href: '/products' },
    { label: 'Our Story', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-espresso/95 backdrop-blur-md border-b border-cream/10'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 z-10"
            aria-label="Lo's Flan home"
          >
            <Image
              src={asset('/assets/brand/logo.png')}
              alt="Lo's Flan logo"
              width={40}
              height={40}
              className="rounded-full object-cover"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-[0.72rem] uppercase tracking-[0.18em] font-medium transition-colors duration-300',
                  current === link.href
                    ? 'text-gold'
                    : 'text-cream/70 hover:text-gold'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Cart button */}
            <button
              onClick={() => setOpen(!open)}
              className="relative p-2 text-cream/70 hover:text-gold transition-colors lg:p-3"
              aria-label={`Cart${count > 0 ? `, ${count} items` : ', empty'}`}
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold text-espresso text-[0.55rem] font-medium px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-cream/70 hover:text-gold transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden overflow-hidden transition-all duration-500 ease-expo bg-espresso border-t border-cream/10">
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block text-lg uppercase tracking-[0.18em] font-medium transition-colors',
                    current === link.href ? 'text-gold' : 'text-cream/70'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-cream/10 flex items-center justify-between">
                <span className="text-cream/70">Cart</span>
                <button
                  onClick={() => { setMobileOpen(false); setOpen(true); }}
                  className="text-gold font-medium"
                >
                  {count > 0 ? `${count} items` : 'Empty'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}