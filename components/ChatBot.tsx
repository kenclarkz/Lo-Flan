'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { getLocalChatReply } from '@/lib/chatbot'
import { cn } from '@/lib/utils'

type Bubble = { role: 'user' | 'bot'; text: string }

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
  const conversationId = useRef<string | undefined>(undefined)
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

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    setBubbles((b) => [...b, { role: 'user', text }])
    setInput('')
    setBusy(true)
    // Small pause so the "thinking" state reads naturally — replies are local.
    await new Promise((r) => setTimeout(r, 400))
    try {
      const reply = getLocalChatReply(text, conversationId.current)
      conversationId.current = reply.conversationId
      setBubbles((b) => [...b, { role: 'bot', text: reply.reply }])
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
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') send()
  }

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
                {busy ? 'Typing…' : 'Assistant · online'}
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

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 no-scrollbar">
            {bubbles.length === 0 && (
              <Bubble role="bot" text={WELCOME} />
            )}
            {bubbles.map((b, i) => (
              <Bubble key={i} role={b.role} text={b.text} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-cream/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                Assistant is thinking…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-cream/10 px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask or place an order…"
              className="flex-1 rounded-full bg-espresso-dark border border-cream/15 px-4 py-2.5 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
            <button
              onClick={send}
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

function Bubble({ role, text }: Bubble) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
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
