'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Check, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { getLocalChatReply } from '@/lib/chatbot'
import { submitChatOrder, getServerUrl, OrderSubmissionError } from '@/lib/chat'
import type { OrderFlowState } from '@/lib/orderFlow'
import { cn } from '@/lib/utils'
import { menu, formatPrice } from '@/data/products'

type Bubble = {
  role: 'user' | 'bot'
  text: string
  options?: { label: string; value: string }[]
  productSelect?: boolean
  quantityFor?: string
}

const WELCOME =
  "Hi, I'm Lo's Flan assistant! Ask me about our hours, menu, prices or delivery — or tell me what you'd like to order."

/**
 * Floating chat bot widget. On the home screen the launcher sits directly
 * above the big "Order Now" (Messenger) button; on every other page it docks
 * to the bottom-left corner.
 */
export function ChatBot() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [open, setOpen] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const conversationId = useRef<string | undefined>(undefined)
  const orderFlowRef = useRef<OrderFlowState | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fade the home-screen launcher in with the scrolling video CTA.
  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [bubbles, busy, open])

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || busy) return
    setBubbles((b) => [...b, { role: 'user', text }])
    if (!textOverride) setInput('')
    setBusy(true)

    // Small pause so the "thinking" state reads naturally — replies are local.
    await new Promise((r) => setTimeout(r, 400))

    try {
      const reply = getLocalChatReply(text, conversationId.current)
      conversationId.current = reply.conversationId

      const of = reply.orderFlow
      orderFlowRef.current = of ?? null

      // If the order flow says submitting, handle the async server call
      if (of?.active && of.submitted && of.submitting) {
        setBubbles((b) => [...b, { role: 'bot', text: reply.reply }])
        await handleSubmit(of)
      } else {
        // Determine what to show on the bot bubble
        const isProductStep = of?.active && of.step === 'product'
        const isItemsQtyStep = of?.active && of.step === 'items_quantity'

        let quantityFor: string | undefined
        if (isItemsQtyStep && of) {
          const idx = of.currentItemIndex
          if (idx >= 0 && idx < of.data.items.length) quantityFor = of.data.items[idx].product.name
        }

        setBubbles((b) => [
          ...b,
          {
            role: 'bot',
            text: reply.reply,
            options: undefined,
            productSelect: isProductStep,
            quantityFor,
          },
        ])

        // Reset selected products when entering the product step fresh
        if (isProductStep && of && of.data.items.length === 0) {
          setSelectedProducts(new Set())
        }

        // If the flow just started or is at the delivery step, add option buttons
        if (of?.active && of.step === 'delivery') {
          setBubbles((b) => [
            ...b.slice(0, -1),
            {
              ...b[b.length - 1],
              options: [
                { label: 'Pickup', value: 'pickup' },
                { label: 'Delivery', value: 'delivery' },
              ],
            },
          ])
        }
        // Show cancel option during order flow
        if (of?.active && of.step !== 'review') {
          setBubbles((b) => [
            ...b,
            { role: 'bot', text: 'Say "cancel" at any time to cancel your order.', options: undefined },
          ])
        }
      }
    } catch {
      setBubbles((b) => [
        ...b,
        {
          role: 'bot',
          text: "Sorry, I ran into a problem. Please try again in a moment, or use the Order Now button or call us — we will get back to you.",
        },
      ])
    } finally {
      setBusy(false)
    }
  }, [input, busy])

  const handleSubmit = async (of: OrderFlowState) => {
    const serverUrl = getServerUrl()
    const target = serverUrl || window.location.origin
    console.log(`[order] submitting to ${target}/api/orders${serverUrl ? '' : ' (same-origin)'}`)
    try {
      const items = of.data.items.map((it) => ({
        name: it.product.name,
        quantity: it.quantity,
      }))
      if (items.length === 0) {
        throw new Error('no_items_to_submit')
      }
      const order = await submitChatOrder(serverUrl, {
        items,
        customerName: of.data.customerName,
        phone: of.data.phone,
        deliveryMethod: of.data.deliveryMethod || undefined,
        deliveryAddress: of.data.deliveryAddress || undefined,
        pickupDate: of.data.date || undefined,
      })

      const isLocal = order.id.startsWith('local-')
      console.log('[order] success', order.id, isLocal ? '(saved locally)' : '(backend)')

      if (isLocal) {
        setBubbles((b) => [
          ...b,
          {
            role: 'bot',
            text: `Your order has been saved locally and will be synced when the server is available. You'll be contacted at ${of.data.phone} once it's confirmed. Thank you, ${of.data.customerName}!`,
          },
        ])
      } else {
        setBubbles((b) => [
          ...b,
          {
            role: 'bot',
            text: `Your order (${order.id}) has been submitted! The owner will review and approve it shortly. You'll be contacted at ${of.data.phone} once it's confirmed. Thank you, ${of.data.customerName}!`,
          },
        ])
      }
      orderFlowRef.current = { ...of, submitting: false, submitted: true, submitResult: 'success' }
    } catch (err) {
      console.error('[order] submission failed:', err)
      const isBackendRejection = err instanceof OrderSubmissionError
      const noServer = !getServerUrl()
      let msg: string
      if (isBackendRejection) {
        msg = 'The server rejected your order. Please check your details and try again, or call us to place your order directly.'
      } else if (noServer) {
        msg = "We couldn't reach the ordering server from this device. Your order hasn't been placed yet — please call us directly and we'll take care of it."
      } else {
        msg = "Something went wrong submitting your order. Please try again or call us to place your order directly."
      }
      setBubbles((b) => [
        ...b,
        {
          role: 'bot',
          text: msg,
        },
      ])
      orderFlowRef.current = { ...of, submitting: false, submitResult: 'error' }
    }
  }

  const handleOptionClick = (value: string) => {
    const label =
      value === 'pickup' ? 'Pickup' :
      value === 'delivery' ? 'Delivery' :
      value
    send(label)
  }

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleProductContinue = () => {
    if (selectedProducts.size === 0) return
    const names = menu
      .filter((p) => selectedProducts.has(p.id))
      .map((p) => p.name)
      .join(' and ')
    send(names)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send()
  }

  const isOrdering = orderFlowRef.current?.active === true

  return (
    <>
      {/* Launcher */}
      <div
        className={cn(
          'fixed z-40 transition-opacity duration-700',
          isHome
            ? 'inset-x-0 bottom-[7.5rem] flex justify-center px-6'
            : 'bottom-6 left-6'
        )}
        style={isHome ? { opacity: scrolled || open ? 1 : 0, pointerEvents: scrolled || open ? 'auto' : 'none' } : undefined}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close chat' : 'Open chat'}
          className={cn(
            'inline-flex items-center gap-2.5 rounded-full border px-6 py-3 text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-all duration-300',
            open
              ? 'border-gold bg-gold text-espresso'
              : 'border-cream/30 bg-espresso/80 text-cream backdrop-blur-sm hover:border-gold hover:text-gold'
          )}
        >
          {open ? <X className="h-4 w-4" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />}
          {open ? 'Close chat' : 'Chat with us'}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-cream/15 bg-espresso shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]',
            isHome
              ? 'inset-x-4 bottom-[11.5rem] mx-auto h-[58svh] max-h-[440px] max-w-sm'
              : 'bottom-24 left-6 h-[min(58svh,460px)] w-[min(calc(100vw-2rem),380px)]'
          )}
        >
          <div className="flex items-center gap-3 border-b border-cream/10 bg-cocoa/40 px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
              <MessageCircle className="h-4 w-4 text-gold" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base leading-tight">Lo&apos;s Flan</p>
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-sage">
                {busy ? 'Typing…' : isOrdering ? 'Placing order…' : 'Assistant · online'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-cream/50 hover:text-cream transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {bubbles.length === 0 && (
              <Bubble role="bot" text={WELCOME} />
            )}
            {bubbles.map((b, i) => {
              const isLastBubble = i === bubbles.length - 1
              const flowState = orderFlowRef.current
              const showQuantityButtons =
                b.quantityFor ||
                (isLastBubble && flowState?.active && flowState.step === 'items_quantity')
              const qtyItemName = showQuantityButtons
                ? (flowState?.data.items[flowState.currentItemIndex]?.product.name ?? '')
                : ''

              return (
              <div key={i}>
                <Bubble role={b.role} text={b.text} />
                {b.productSelect && (
                  <div className="mt-2 ml-2 space-y-1.5">
                    {menu.map((product) => (
                      <label
                        key={product.id}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer transition-all',
                          selectedProducts.has(product.id)
                            ? 'border-gold/60 bg-gold/15 text-gold'
                            : 'border-cream/15 bg-cream/5 text-cream/70 hover:border-cream/30'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                            selectedProducts.has(product.id)
                              ? 'border-gold bg-gold text-espresso'
                              : 'border-cream/30 bg-transparent'
                          )}
                        >
                          {selectedProducts.has(product.id) && <Check className="h-3 w-3" />}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{product.name}</span>
                          <span className="block text-[0.6rem] opacity-60">{formatPrice(product.price)}</span>
                        </span>
                      </label>
                    ))}
                    <button
                      onClick={handleProductContinue}
                      disabled={busy || selectedProducts.size === 0}
                      className="mt-1 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-colors disabled:opacity-40"
                    >
                      Continue with {selectedProducts.size} item{selectedProducts.size !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
                {showQuantityButtons && (
                  <div className="mt-2 ml-2 space-y-1.5">
                    {qtyItemName && (
                      <p className="text-[0.65rem] text-cream/50 ml-1">Qty for {qtyItemName}:</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          onClick={() => send(String(n))}
                          disabled={busy}
                          className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {b.options && b.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-2">
                    {b.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionClick(opt.value)}
                        disabled={busy}
                        className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )
            })}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-cream/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                Assistant is thinking…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-cream/10 px-3 py-3">
            {isOrdering && (
              <button
                onClick={() => {
                  send('cancel order')
                }}
                disabled={busy}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-400/30 text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                aria-label="Cancel order"
                title="Cancel order"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOrdering ? 'Type your answer…' : 'Ask or place an order…'}
              className="flex-1 rounded-full bg-espresso-dark border border-cream/15 px-4 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold text-espresso transition-all hover:bg-gold-light disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Bubble({ role, text }: { role: 'user' | 'bot'; text: string }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
          isUser
            ? 'rounded-br-sm bg-gold text-espresso'
            : 'rounded-bl-sm bg-cream/10 text-cream'
        )}
      >
        {text}
      </div>
    </div>
  )
}
