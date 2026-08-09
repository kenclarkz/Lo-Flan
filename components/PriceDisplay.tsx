import { cn } from '@/lib/utils'
import { formatPrice } from '@/data/products'

interface PriceDisplayProps {
  price: number
  compareAt?: number
  className?: string
  showCurrency?: boolean
}

/**
 * Formats and displays a price with optional strikethrough for sale pricing.
 */
export function PriceDisplay({ price, compareAt, className, showCurrency = true }: PriceDisplayProps) {
  const displayPrice = formatPrice(price)
  const displayCompare = compareAt ? formatPrice(compareAt) : null

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      {displayCompare && (
        <span className="text-cream/40 line-through text-sm">{displayCompare}</span>
      )}
      <span className={cn('text-gold font-medium', showCurrency ? 'text-xl' : 'text-lg')}>
        {displayPrice}
      </span>
    </div>
  )
}