'use client'

import { useEffect, useRef } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/data/products'
import { gsap } from '@/lib/anim'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el || typeof window === 'undefined') return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-product-card]'),
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [products.length])

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" data-product-grid>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          featured={product.featured && !product.seasonal}
        />
      ))}
      {products.length === 0 && (
        <div className="col-span-full text-center py-20 text-cream/50">
          <p className="font-serif text-xl mb-2">No flans found</p>
          <p className="text-sm">Try adjusting your filter or check back soon.</p>
        </div>
      )}
    </div>
  )
}