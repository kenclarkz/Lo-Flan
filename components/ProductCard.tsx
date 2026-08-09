'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { Plus, Minus, Heart, ShoppingBag, Tag, Sparkles, Truck, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, Product } from '@/data/products'
import { PriceDisplay } from '@/components/PriceDisplay'

interface ProductCardProps {
  product: Product
  featured?: boolean
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const { add } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [showQuickView, setShowQuickView] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    add({
      id: product.id,
      name: product.name,
      price: product.sizePrice?.[selectedSize] ?? product.price,
      size: selectedSize,
      image: product.image,
    })
  }

  const badgeContent = product.badge
    ? product.badge
    : product.isNew
    ? 'New'
    : product.seasonal
    ? 'Seasonal'
    : product.featured
    ? 'Featured'
    : null

  return (
    <article className={cn(
      'group relative overflow-hidden rounded-3xl bg-cream/[0.03] border border-cream/10 transition-all duration-700 hover:border-gold/30',
      featured && 'lg:col-span-2'
    )}>
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.featured && (
            <span className="px-3 py-1 bg-gold/20 text-gold text-[0.6rem] uppercase tracking-[0.2em] rounded-full">
              Featured
            </span>
          )}
          {product.seasonal && (
            <span className="px-3 py-1 bg-blush/20 text-blush text-[0.6rem] uppercase tracking-[0.2em] rounded-full">
              Seasonal
            </span>
          )}
          {product.isNew && (
            <span className="px-3 py-1 bg-sage/20 text-sage text-[0.6rem] uppercase tracking-[0.2em] rounded-full">
              New
            </span>
          )}
        </div>
        {/* Wishlist */}
        <button className="absolute top-4 right-4 p-2 rounded-full bg-espresso/80 backdrop-blur text-cream/70 hover:text-gold hover:bg-espresso transition-all" aria-label="Add to wishlist">
          <Heart className="w-5 h-5" strokeWidth={1.5} />
        </button>
        {/* Quick view */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 btn-ghost px-6 py-2.5 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
          Quick View
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow text-[0.6rem]">{product.category.replace('-', ' ')}</p>
          <PriceDisplay price={product.sizePrice?.[selectedSize] ?? product.price} compareAt={product.compareAt} />
        </div>

        <h3 className="font-serif text-2xl font-light leading-tight group-hover:text-gold transition-colors">
          <Link href={`/products/${product.id}`} onClick={(e) => e.stopPropagation()}>
            {product.name}
          </Link>
        </h3>

        <p className="text-cream/60 text-sm line-clamp-2">{product.tagline}</p>

        {/* Ingredients */}
        <div className="flex flex-wrap gap-1.5" aria-label="Key ingredients">
          {product.ingredients.slice(0, 4).map((ing, i) => (
            <span key={i} className="px-2.5 py-1 bg-cream/5 border border-cream/10 rounded-full text-[0.6rem] text-cream/70">
              {ing}
            </span>
          ))}
          {product.ingredients.length > 4 && (
            <span className="px-2.5 py-1 bg-cream/5 border border-cream/10 rounded-full text-[0.6rem] text-cream/50">
              +{product.ingredients.length - 4} more
            </span>
          )}
        </div>

        {/* Size selector + Add to cart */}
        {product.sizes.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[0.65rem] uppercase tracking-[0.15em] transition-all',
                  selectedSize === size
                    ? 'bg-gold text-espresso shadow-[0_4px_16px_-4px_rgba(201,137,75,0.5)]'
                    : 'bg-cream/5 border border-cream/10 text-cream/70 hover:border-gold hover:text-gold'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleAdd}
          className="btn-primary w-full mt-4 group relative overflow-hidden"
        >
          <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-1" strokeWidth={2} />
          Add to Order
        </button>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </article>
  )
}

function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { add } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [qty, setQty] = useState(1)

  const handleAdd = () => {
    add({
      id: product.id,
      name: product.name,
      price: product.sizePrice?.[selectedSize] ?? product.price,
      size: selectedSize,
      image: product.image,
      quantity: qty,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="qv-title">
      <div className="bg-espresso border border-cream/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="eyebrow mb-2">{product.category.replace('-', ' ')}</p>
              <h2 id="qv-title" className="font-serif text-3xl font-light">{product.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 text-cream/50 hover:text-gold transition-colors rounded-full hover:bg-cream/5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-cream/5 relative">
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="50vw" />
            </div>
            <div className="space-y-4">
              <PriceDisplay price={product.sizePrice?.[selectedSize] ?? product.price} compareAt={product.compareAt} className="text-2xl" />
              <p className="text-cream/70">{product.description}</p>

              <div>
                <p className="eyebrow mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm uppercase tracking-[0.1em] transition-all',
                        selectedSize === size
                          ? 'bg-gold text-espresso'
                          : 'bg-cream/5 border border-cream/10 text-cream/70 hover:border-gold hover:text-gold'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="eyebrow mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 rounded bg-cream/5 text-cream/70 hover:text-gold">
                    <Minus className="w-5 h-5" strokeWidth={2} />
                  </button>
                  <span className="w-12 text-center text-lg font-medium">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="p-2 rounded bg-cream/5 text-cream/70 hover:text-gold">
                    <Plus className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-cream/10">
                <button onClick={handleAdd} className="btn-primary flex-1 min-w-[160px]">
                  <ShoppingBag className="w-5 h-5 mr-2" strokeWidth={2} />
                  Add to Order
                </button>
                <button className="btn-ghost flex-1 min-w-[160px]">
                  <Tag className="w-5 h-5 mr-2" strokeWidth={2} />
                  Gift This
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-cream/50 border-t border-cream/10 pt-4">
                <div className="flex items-center gap-2"><Truck className="w-4 h-4" strokeWidth={2} /> Free shipping on $100+</div>
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" strokeWidth={2} /> Secure checkout</div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <details className="group border-t border-cream/10 pt-6">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="eyebrow">Key Ingredients</span>
              <svg className="w-5 h-5 text-cream/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.ingredients.map((ing, i) => (
                <span key={i} className="px-3 py-1.5 bg-cream/5 border border-cream/10 rounded-full text-sm text-cream/80">
                  {ing}
                </span>
              ))}
            </div>
            {product.allergens && product.allergens.length > 0 && (
              <p className="mt-3 text-sm text-cream/50">
                <span className="font-medium">Allergens:</span> {product.allergens.join(', ')}
              </p>
            )}
          </details>
        </div>
      </div>
    </div>
  )
}