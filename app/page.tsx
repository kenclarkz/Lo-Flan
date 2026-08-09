'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { asset } from '@/lib/paths'

const Experience = dynamic(() => import('@/components/Experience'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso" aria-hidden="true">
      <div className="text-center">
        <Image
          src={asset('/assets/brand/logo.png')}
          alt=""
          width={72}
          height={72}
          className="mx-auto mb-6 rounded-full object-cover animate-pulse"
        />
        <p className="font-serif text-2xl text-cream">Lo&apos;s Flan</p>
        <p className="mt-2 text-sm text-cream/50 uppercase tracking-[0.2em]">The Journey of a Perfect Flan</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return <Experience />
}