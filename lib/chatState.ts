'use client'

type Listener = (open: boolean) => void

let chatOpen = false
const listeners = new Set<Listener>()

export function getChatOpen() {
  return chatOpen
}

export function setChatOpen(open: boolean) {
  if (chatOpen === open) return
  chatOpen = open
  listeners.forEach((fn) => fn(open))
}

export function onChatOpenChange(fn: Listener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
