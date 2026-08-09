'use client'

import { forwardRef, type CSSProperties, type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

/**
 * Full-viewport chapter section laid out with `position: sticky` so chapters
 * stack over each other while scrolling — the ScrollTrigger-`pin`-free
 * alternative that keeps React's DOM intact.
 *
 * `extra` adds trailing scroll room (as a viewport multiplier) so the scene's
 * animation has the same breathing room its original pin used to give it.
 * The room is scaled down on small screens so the journey scrolls faster on
 * mobile.
 */
export const SceneShell = forwardRef<
  HTMLElement,
  PropsWithChildren<{
    id?: string
    chapter?: string
    className?: string
    extra?: number
  }>
>(({ children, id, chapter, className, extra }, ref) => (
  <>
    <section
      ref={ref}
      id={id}
      data-chapter={chapter}
      className={cn(
        'sticky top-0 h-[100svh] w-full overflow-hidden',
        className
      )}
    >
      {children}
    </section>
    {typeof extra === 'number' && extra > 0 ? (
      <div
        style={{ '--extra': extra } as CSSProperties}
        className="scene-scroll-room"
        aria-hidden
      />
    ) : null}
  </>
))

SceneShell.displayName = 'SceneShell'
