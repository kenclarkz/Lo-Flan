'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

export function AdminButton() {
  return (
    <Link
      href="/admin"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center w-8 h-8 rounded-full bg-espresso/40 text-cream/30 backdrop-blur-sm border border-cream/10 hover:text-gold/60 hover:border-gold/30 transition-colors"
      aria-label="Admin login"
    >
      <Lock className="w-3.5 h-3.5" aria-hidden />
    </Link>
  )
}
