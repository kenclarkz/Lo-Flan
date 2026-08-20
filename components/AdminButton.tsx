'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { onChatOpenChange } from '@/lib/chatState'

export function AdminButton() {
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    return onChatOpenChange(setChatOpen)
  }, [])

  return (
    <Link
      href="/admin"
      className={`fixed bottom-4 z-50 inline-flex items-center justify-center w-8 h-8 rounded-full bg-espresso/40 text-cream/30 backdrop-blur-sm border border-cream/10 hover:text-gold/60 hover:border-gold/30 transition-all duration-300 ${chatOpen ? 'left-4' : 'right-4'}`}
      aria-label="Admin login"
    >
      <Lock className="w-3.5 h-3.5" aria-hidden />
    </Link>
  )
}
