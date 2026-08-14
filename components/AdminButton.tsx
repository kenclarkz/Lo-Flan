'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

export function AdminButton() {
  return (
    <Link
      href="/admin"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full bg-espresso/70 px-3 py-2 text-xs uppercase tracking-[0.1em] text-cream/70 backdrop-blur-sm border border-cream/15 hover:text-gold hover:border-gold/50 transition-colors"
      aria-label="Admin login"
    >
      <Lock className="w-3 h-3" aria-hidden />
      Admin
    </Link>
  )
}
