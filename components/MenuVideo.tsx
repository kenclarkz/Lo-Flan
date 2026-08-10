'use client'

import { useEffect, useRef } from 'react'
import type { MenuProduct } from '@/data/products'

interface MenuVideoProps {
  product: MenuProduct
  className?: string
}

export function MenuVideo({ product, className }: MenuVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const p = video.play()
            if (p && typeof p.then === 'function') p.catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      poster={product.poster}
    >
      <source src={product.video} type="video/mp4" />
      <source src={product.fallbackVideo} type="video/mp4" />
    </video>
  )
}
