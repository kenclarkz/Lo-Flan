'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Category } from '@/data/products'

interface CategoryFilterProps {
  categories: Category[]
  active: string
  onChange: (id: string) => void
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-3" role="tablist" aria-label="Product categories">
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(cat.id)}
          onMouseEnter={() => setHovered(cat.id)}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'px-5 py-2.5 rounded-full text-[0.7rem] uppercase tracking-[0.2em] font-medium transition-all duration-300',
            active === cat.id
              ? 'bg-gold text-espresso shadow-[0_4px_20px_-4px_rgba(201,137,75,0.5)]'
              : 'bg-cream/5 border border-cream/10 text-cream/70 hover:border-gold hover:text-gold'
          )}
        >
          {cat.label}
          {active === cat.id && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-espresso/30" />}
        </button>
      ))}
    </div>
  )
}