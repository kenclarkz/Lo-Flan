'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/anim'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once,
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [delay, y, once])

  return <div ref={ref} className={cn(className)} style={{ opacity: 0 }}>{children}</div>
}