'use client'

import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { subscribeProcessTransition } from '@/lib/processState'
import { chapters } from '@/data/site'
import { cn } from '@/lib/utils'

const SHOW_MS = 2100
const FILL_MS = 1.15

/**
 * Badge that pops in during a photo burn transition, showing which step of the
 * flan process the viewer is entering. A gold line fills as the fire burns, and
 * the dots below highlight the current position along the journey.
 */
export default function ProcessIndicator() {
  const [active, setActive] = useState<{ from: number; to: number } | null>(
    null
  )
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribeProcessTransition((t) => {
      setActive(t)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setActive(null), SHOW_MS)
    })
    return () => {
      unsub()
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const step = active ? active.to : -1

  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 bottom-[18vh] z-[55] pointer-events-none transition-opacity duration-500',
        active ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden
    >
      <div
        className="flex flex-col items-center gap-3"
        style={
          active
            ? { animation: 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }
            : undefined
        }
      >
        <div className="flex items-center gap-3 rounded-full border border-gold/40 bg-espresso/80 px-5 py-2.5 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(201,137,75,0.55)]">
          <Flame
            className="h-5 w-5 text-[#ff9a3c]"
            style={{ animation: 'flame-flicker 0.55s ease-in-out infinite' }}
          />
          <span className="eyebrow text-[0.78rem] text-gold">
            Step {String(step + 1).padStart(2, '0')} / 06
          </span>
          <span className="h-3.5 w-px bg-cream/20" />
          <span className="eyebrow text-[0.78rem] text-cream">
            {step >= 0 ? chapters[step].label : ''}
          </span>
        </div>

        <div className="h-[2px] w-44 overflow-hidden rounded-full bg-cream/15">
          {active && (
            <div
              key={`${active.from}-${active.to}`}
              className="h-full origin-left bg-gold"
              style={{
                animation: `fill-grow ${FILL_MS}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {chapters.map((c, i) => (
            <span
              key={c.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === step
                  ? 'w-6 bg-gold animate-[dot-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]'
                  : i < step
                    ? 'w-1.5 bg-gold/50'
                    : 'w-1.5 bg-cream/25'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
