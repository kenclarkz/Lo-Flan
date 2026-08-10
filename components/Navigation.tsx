'use client'

import Link from 'next/link'
import Image from 'next/image'
import { asset } from '@/lib/paths'

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex justify-center pt-8">
        <Link
          href="/"
          className="pointer-events-auto"
          aria-label="Lo's Flan home"
        >
          <Image
            src={asset('/assets/brand/logo.png')}
            alt="Lo's Flan logo"
            width={96}
            height={96}
            className="rounded-full object-cover shadow-lg shadow-black/30"
            priority
          />
        </Link>
      </div>
    </nav>
  )
}