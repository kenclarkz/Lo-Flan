'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart'
import { X, Plus, Minus, Trash2, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/data/products'

export function CartDrawer() {
  const { items, subtotal, count, open, setOpen, updateQty, remove } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside className="fixed right-0 top-0 z-70 h-full w-full max-w-md bg-espresso border-l border-cream/10 flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-cream/10">
          <h2 className="font-serif text-2xl font-light">Your Order</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-cream/50 hover:text-gold transition-colors rounded-full hover:bg-cream/5"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-cream/50">
              <svg className="w-16 h-16 mb-4 text-cream/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7m12 0l-4 4m4-4l-4-4m-8 8v4a2 2 0 002 2h8a2 2 0 002-2v-4M4 7h16" />
              </svg>
              <p className="font-serif text-lg">Your cart is empty</p>
              <p className="text-sm mt-1">Add a flan to begin your order</p>
            </div>
          ) : (
            <>
              <ul className="space-y-4" role="list" aria-label="Cart items">
                {items.map((item) => (
                  <li key={`${item.id}-${item.size}`} className="flex gap-4">
                    {item.image && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-cream/5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cream truncate">{item.name}</p>
                      <p className="text-sm text-cream/50">{item.size}</p>
                      <p className="text-gold font-medium mt-1">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(item.id, item.size, item.quantity - 1)}
                          className="p-1 rounded bg-cream/5 text-cream/70 hover:text-gold hover:bg-cream/10 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-cream">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.size, item.quantity + 1)}
                          className="p-1 rounded bg-cream/5 text-cream/70 hover:text-gold hover:bg-cream/10 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => remove(item.id, item.size)}
                          className="ml-auto p-1 rounded text-cream/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-cream/10 pt-6 space-y-4">
                <div className="flex justify-between text-cream/70">
                  <span>Subtotal ({count} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-cream/50">Shipping calculated at checkout.</p>

                <button
                  onClick={() => {
                    setCheckingOut(true)
                    setTimeout(() => {
                      setCheckingOut(false)
                      alert('Stripe checkout coming soon! Your order would be processed here.')
                    }, 1200)
                  }}
                  disabled={checkingOut}
                  className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingOut ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" strokeWidth={2} />
                      Proceed to Checkout
                    </>
                  )}
                </button>

                <button
                  onClick={() => setOpen(false)}
                  className="btn-ghost w-full py-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" strokeWidth={2} />
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

// Add keyframe for slide-in animation
// This is handled by Tailwind's animate-slide-in which we'll add to globals