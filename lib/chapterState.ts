'use client'

let activeChapter = 0
const listeners = new Set<(index: number) => void>()

export function setActiveChapter(index: number) {
  if (index === activeChapter) return
  activeChapter = index
  listeners.forEach((fn) => fn(index))
}

export function getActiveChapter() {
  return activeChapter
}

export function subscribeActiveChapter(fn: (index: number) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
