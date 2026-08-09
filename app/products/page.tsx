'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { products, CATEGORIES, formatPrice, Product } from '@/data/products'
import { ProductGrid } from '@/components/ProductGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
import { ProductCard } from '@/components/ProductCard'
import { PriceDisplay } from '@/components/PriceDisplay'
import { Reveal } from '@/components/Reveal'
import { asset } from '@/lib/paths'
import { cn } from '@/lib/utils'
import { Sparkles, Tag, Shield, Truck, Heart } from 'lucide-react'

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured')

  const filteredProducts = useMemo(() => {
    let result = activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory)

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'newest':
        result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      default: // featured first
        result = [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return result
  }, [activeCategory, sortBy])

  const featuredProducts = useMemo(() =>
    products.filter((p) => p.featured && !p.seasonal).slice(0, 2),
  [])

  const seasonalProducts = useMemo(() =>
    products.filter((p) => p.seasonal),
  [])

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso via-espresso to-espresso-dark" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("${asset('/assets/brand/hero-pattern.svg')}")` }} />
        <div className="relative z-10 max-w-4xl text-center">
          <Reveal className="eyebrow">The Menu</Reveal>
          <Reveal delay={0.1} className="display mt-3 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-6">
            Handcrafted flans,<br />made to order.
          </Reveal>
          <Reveal delay={0.2} className="text-lg sm:text-xl text-cream/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Every flan begins with six honest ingredients. Choose your favourite,
            select a size, and we&apos;ll bake it fresh for delivery or pickup.
          </Reveal>
          <Reveal delay={0.3} className="flex flex-wrap items-center justify-center gap-3">
            <span className="flex items-center gap-2 text-cream/60 text-sm">
              <Truck className="w-5 h-5" strokeWidth={2} /> Free shipping on $100+
            </span>
            <span className="flex items-center gap-2 text-cream/60 text-sm">
              <Shield className="w-5 h-5" strokeWidth={2} /> Secure checkout
            </span>
          </Reveal>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 py-10 border-y border-cream/10 bg-espresso/50 backdrop-blur sticky top-20 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CategoryFilter
              categories={CATEGORIES.filter(c => c.id !== 'all')}
              active={activeCategory}
              onChange={setActiveCategory}
            />
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-cream/50 text-sm uppercase tracking-[0.15em]">Sort</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-cream/5 border border-cream/10 rounded-full text-cream text-sm uppercase tracking-[0.1em] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold appearance-none bg-no-repeat bg-right pr-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23C9A96A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")` }}
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hero Product */}
      {activeCategory === 'all' && featuredProducts.length > 0 && (
        <section className="px-6 py-10">
          <div className="max-w-7xl mx-auto">
            <Reveal className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
                <img
                  src={featuredProducts[0].image}
                  alt={featuredProducts[0].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                  <span className="px-3 py-1 bg-gold/20 text-gold text-[0.6rem] uppercase tracking-[0.2em] rounded-full self-start">
                    Best Seller
                  </span>
                  <h3 className="font-serif text-3xl font-light text-cream">{featuredProducts[0].name}</h3>
                  <p className="text-cream/70">{featuredProducts[0].tagline}</p>
                  <PriceDisplay price={featuredProducts[0].price} className="text-2xl self-start" />
                </div>
              </div>
              <div className="space-y-6">
                <Reveal delay={0.1} className="eyebrow">Chef&apos;s Recommendation</Reveal>
                <Reveal delay={0.2}>
                  <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-4">
                    {featuredProducts[0].description}
                  </h2>
                </Reveal>
                <Reveal delay={0.3} className="flex flex-wrap gap-2">
                  {featuredProducts[0].ingredients.map((ing, i) => (
                    <span key={i} className="px-3 py-1.5 bg-cream/5 border border-cream/10 rounded-full text-sm text-cream/80">
                      {ing}
                    </span>
                  ))}
                </Reveal>
                <Reveal delay={0.4} className="flex gap-3">
                  <button className="btn-primary">
                    Order {featuredProducts[0].name}
                  </button>
                  <button className="btn-ghost">
                    View Details
                  </button>
                </Reveal>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Seasonal Banner */}
      {activeCategory === 'all' && seasonalProducts.length > 0 && (
        <section className="px-6 py-6 bg-gradient-to-r from-caramel/10 to-gold/5 border-y border-cream/10">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-gold" strokeWidth={2} />
              <span className="font-serif text-lg">Seasonal Flavours</span>
              <span className="px-2 py-1 bg-blush/20 text-blush text-[0.6rem] uppercase tracking-[0.2em] rounded-full">
                Limited Time
              </span>
            </div>
            <div className="flex items-center gap-4">
              {seasonalProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-2 px-4 py-2 bg-cream/5 border border-cream/10 rounded-full text-sm hover:border-gold hover:text-gold transition-colors">
                  <img src={p.image} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                  <span>{p.name}</span>
                  <PriceDisplay price={p.price} showCurrency={false} className="text-sm" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Grid */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Reveal className="eyebrow">Available Now</Reveal>
              <Reveal delay={0.1}>
                <h2 className="font-serif text-3xl sm:text-4xl font-light">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'flan' : 'flans'} found
                </h2>
              </Reveal>
            </div>
          </div>
          <ProductGrid products={filteredProducts} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-espresso-dark border-t border-cream/10">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal className="eyebrow">Need Something Special?</Reveal>
          <Reveal delay={0.1} className="display mt-3 text-3xl sm:text-4xl font-light leading-tight mb-6">
            Custom cakes, catering orders & corporate gifts
          </Reveal>
          <Reveal delay={0.2} className="text-cream/60 mb-8 max-w-xl mx-auto">
            Planning an event? We create bespoke flan towers, branded gift boxes,
            and wholesale orders for cafés. Minimum 48 hours notice.
          </Reveal>
          <Reveal delay={0.3} className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="btn-primary">Start a Custom Order</Link>
            <a href="mailto:hola@flandeoro.com" className="btn-ghost">Email Us</a>
          </Reveal>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-6 py-12 border-t border-cream/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Truck, label: 'Free Shipping', desc: 'On orders over $100' },
            { icon: Shield, label: 'Secure Checkout', desc: 'Stripe encrypted payments' },
            { icon: Heart, label: 'Made Fresh', desc: 'Baked to order daily' },
            { icon: Tag, label: 'Gift Ready', desc: 'Beautiful packaging included' },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.1} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-cream/5 flex items-center justify-center text-gold">
                <item.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-cream">{item.label}</p>
              <p className="text-sm text-cream/50">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}