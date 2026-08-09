'use client'

export type ProcessTransition = { from: number; to: number }

const listeners = new Set<(t: ProcessTransition) => void>()

export function startProcessTransition(from: number, to: number) {
  listeners.forEach((fn) => fn({ from, to }))
}

export function subscribeProcessTransition(
  fn: (t: ProcessTransition) => void
) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
