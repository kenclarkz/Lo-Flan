'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Clock, ArrowRight, Instagram, Lock } from 'lucide-react'
import { asset } from '@/lib/paths'
import { site } from '@/data/site'
import { cn } from '@/lib/utils'

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('submitting')
    await new Promise((r) => setTimeout(r, 1000))
    setStatus('success')
    setEmail('')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 bg-cream/5 border border-cream/20 rounded-full text-cream placeholder-cream/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
        disabled={status === 'submitting' || status === 'success'}
      />
      <button
        type="submit"
        disabled={status === 'submitting' || status === 'success'}
        className="btn-primary px-6"
      >
        {status === 'submitting' ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        ) : status === 'success' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
        ) : (
          <ArrowRight className="w-5 h-5" strokeWidth={2} />
        )}
      </button>
    </form>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-espresso-dark border-t border-cream/10">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6" aria-label="Lo's Flan home">
              <Image
                src={asset('/assets/brand/logo.png')}
                alt="Lo's Flan logo"
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            </Link>
            <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
              Handcrafted flans made from six honest ingredients. Born in Santa Barbara, shared with the world.
            </p>
            <div className="mt-6 flex gap-4">
              {site.social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-cream/50 hover:text-gold transition-colors" aria-label={s.label}>
                  {s.label === 'Instagram' ? (
                    <Instagram className="w-5 h-5" />
                  ) : (
                    <span className="w-5 h-5 flex items-center justify-center text-xs font-semibold uppercase tracking-wide">{s.label[0]}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h3 className="eyebrow mb-4">Explore</h3>
            <ul className="space-y-3">
              {site.nav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream/70 hover:text-gold transition-colors text-sm uppercase tracking-[0.1em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <address className="not-italic">
            <h3 className="eyebrow mb-4">Visit Us</h3>
            <dl className="space-y-4 text-sm text-cream/70">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <dd>{site.address}</dd>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <dd><a href={`tel:${site.phone.replace(/\D/g, '')}`} className="hover:text-gold transition-colors">{site.phone}</a></dd>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" aria-hidden />
                <dd><a href={`mailto:${site.email}`} className="hover:text-gold transition-colors">{site.email}</a></dd>
              </div>
            </dl>
            <h3 className="eyebrow mt-8 mb-4">Hours</h3>
            <dl className="space-y-2 text-sm text-cream/60">
              {site.hours.map((h, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <dt className="text-cream/50">{h.day}</dt>
                  <dd className="text-cream/80 whitespace-nowrap">{h.time}</dd>
                </div>
              ))}
            </dl>
          </address>

          {/* Newsletter */}
          <div>
            <h3 className="eyebrow mb-4">Stay Sweet</h3>
            <p className="text-cream/60 text-sm mb-6 leading-relaxed">
              Seasonal flavours, early access, and a little sweetness in your inbox.
            </p>
            <NewsletterForm />
            <p className="mt-4 text-xs text-cream/40">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/40 text-sm">
            &copy; {currentYear} Lo&apos;s Flan. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-cream/40">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gold transition-colors">Terms</Link>
            <Link href="/accessibility" className="hover:text-gold transition-colors">Accessibility</Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
              aria-label="Admin login"
            >
              <Lock className="w-3 h-3" aria-hidden />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}