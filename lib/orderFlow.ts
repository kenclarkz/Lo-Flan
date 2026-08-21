/**
 * Conversational order flow for the Lo-Flan chatbot.
 *
 * Guides the customer step-by-step through placing an order:
 *   product (multi-select) → items_quantity (per item) → date → contact info → review → submit
 *
 * Pickup only — the bakery does not offer delivery.
 *
 * The flow is a pure state machine — no side effects, no server calls.
 * The ChatBot component reads the state and renders the appropriate UI.
 * Submission happens only when the customer confirms the review.
 */

import { products, formatPrice } from '@/data/chatbot'
import type { ProductInfo } from '@/data/chatbot'

/* ------------------------------------------------------------------ */
/* Order flow steps                                                    */
/* ------------------------------------------------------------------ */

export const ORDER_STEPS = [
  'product',
  'items_quantity',
  'date',
  'name',
  'phone',
  'review',
] as const

export type OrderStep = (typeof ORDER_STEPS)[number]

/* ------------------------------------------------------------------ */
/* Order data                                                          */
/* ------------------------------------------------------------------ */

export interface OrderItemEntry {
  product: ProductInfo
  quantity: number
}

export interface OrderData {
  items: OrderItemEntry[]
  date: string
  customerName: string
  phone: string
}

/** The bakery is pickup-only; every order is for pickup at the bakery. */
export const PICKUP_ONLY_METHOD = 'pickup' as const

export function emptyOrderData(): OrderData {
  return {
    items: [],
    date: '',
    customerName: '',
    phone: '',
  }
}

/* ------------------------------------------------------------------ */
/* Flow state                                                          */
/* ------------------------------------------------------------------ */

export interface OrderFlowState {
  active: boolean
  step: OrderStep
  data: OrderData
  submitted: boolean
  /** If true, the submission is in flight (async). */
  submitting: boolean
  /** If set, the order was successfully submitted. */
  submitResult: 'success' | 'error' | null
  /** Index into data.items for the current items_quantity prompt. */
  currentItemIndex: number
}

export function newOrderFlowState(): OrderFlowState {
  return {
    active: false,
    step: 'product',
    data: emptyOrderData(),
    submitted: false,
    submitting: false,
    submitResult: null,
    currentItemIndex: 0,
  }
}

/* ------------------------------------------------------------------ */
/* Step helpers                                                         */
/* ------------------------------------------------------------------ */

function stepIndex(step: OrderStep): number {
  return ORDER_STEPS.indexOf(step)
}

function prevStep(step: OrderStep): OrderStep | null {
  const i = stepIndex(step)
  return i > 0 ? ORDER_STEPS[i - 1] : null
}

function nextStep(step: OrderStep): OrderStep | null {
  const i = stepIndex(step)
  return i < ORDER_STEPS.length - 1 ? ORDER_STEPS[i + 1] : null
}

/* ------------------------------------------------------------------ */
/* Intent detection                                                    */
/* ------------------------------------------------------------------ */

const ORDER_INTENT_KEYWORDS = [
  'order', 'buy', 'purchase', 'want to order', 'like to order',
  'id like to order', 'i want to order', 'i would like to order',
  'can i order', 'place an order', 'get one', 'i want one',
  'id like one', 'i would like one', 'can i get', 'i want',
  'id like', 'i would like', 'one please', 'get a', 'buy a',
  'purchase a', 'take one', 'ill take', 'i will take',
]

const CANCEL_KEYWORDS = [
  'cancel', 'cancel order', 'nevermind', 'never mind',
  'stop', 'quit', 'exit', 'forget it', 'forget about it',
  'nvm', 'no thanks', 'no thank you', 'change my mind',
]

const BACK_KEYWORDS = [
  'go back', 'back', 'previous', 'change my answer',
  'redo', 'start over', 'change', 'different',
]

export function detectsOrderIntent(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return ORDER_INTENT_KEYWORDS.some((kw) => lower.includes(kw))
}

export function detectsCancelIntent(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return CANCEL_KEYWORDS.some((kw) => lower.includes(kw))
}

export function detectsBackIntent(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return BACK_KEYWORDS.some((kw) => lower.includes(kw))
}

/* ------------------------------------------------------------------ */
/* Product matching (from chatbot engine)                               */
/* ------------------------------------------------------------------ */

export function matchProduct(text: string): ProductInfo | null {
  const lower = text.toLowerCase().trim()
  let best: { product: ProductInfo; score: number } | null = null
  for (const product of products) {
    const keywords = [product.name.toLowerCase(), ...product.keywords.map((k) => k.toLowerCase())]
    let score = 0
    for (const kw of keywords) {
      if (kw.includes(' ') ? lower.includes(kw) : lower.split(/\s+/).includes(kw)) {
        score += 1
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { product, score }
    }
  }
  return best?.product ?? null
}

export function matchProducts(text: string): ProductInfo[] {
  const lower = text.toLowerCase().trim()
  const results: { product: ProductInfo; score: number }[] = []
  for (const product of products) {
    const keywords = [product.name.toLowerCase(), ...product.keywords.map((k) => k.toLowerCase())]
    let score = 0
    for (const kw of keywords) {
      if (kw.includes(' ') ? lower.includes(kw) : lower.split(/\s+/).includes(kw)) {
        score += 1
      }
    }
    if (score > 0) {
      results.push({ product, score })
    }
  }
  // Deduplicate by product id (keep highest score)
  const seen = new Map<string, { product: ProductInfo; score: number }>()
  for (const r of results) {
    const existing = seen.get(r.product.id)
    if (!existing || r.score > existing.score) seen.set(r.product.id, r)
  }
  return [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .map((r) => r.product)
}

/* ------------------------------------------------------------------ */
/* Quantity parsing                                                    */
/* ------------------------------------------------------------------ */

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  a: 1, an: 1, single: 1, double: 2, couple: 2,
}

export function parseQuantity(text: string): number | null {
  const trimmed = text.trim()
  const num = parseInt(trimmed, 10)
  if (Number.isFinite(num) && num > 0 && num <= 50) return num
  const lower = trimmed.toLowerCase()
  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower]
  if (lower.includes('one')) return 1
  if (lower.includes('two')) return 2
  if (lower.includes('three')) return 3
  return null
}

/* ------------------------------------------------------------------ */
/* Delivery intent detection (pickup-only policy)                      */
/* ------------------------------------------------------------------ */

const DELIVERY_REQUEST_PATTERN = /\b(deliver|delivery|deliveries|ship|shipping|shipped|bring it to|drop ?off)\b/

/**
 * True when the customer is asking for delivery/shipping, which the bakery
 * does not offer. Used to politely redirect them to pickup.
 */
export function detectsDeliveryRequest(text: string): boolean {
  return DELIVERY_REQUEST_PATTERN.test(text.toLowerCase())
}

/* ------------------------------------------------------------------ */
/* Phone number validation                                             */
/* ------------------------------------------------------------------ */

export function isValidPhone(text: string): boolean {
  const digits = text.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

/* ------------------------------------------------------------------ */
/* Date helpers (lead-time rules)                                      */
/* ------------------------------------------------------------------ */

/**
 * Flans are made fresh when ordered, so customers cannot get them the
 * same day or the next day. Orders must be scheduled at least
 * MIN_LEAD_DAYS days in the future.
 */
export const MIN_LEAD_DAYS = 2

export const ORDER_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Earliest date (midnight) that can be selected for an order. */
export function getMinOrderDate(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + MIN_LEAD_DAYS)
  return d
}

/** Resolve a month/day choice (no year in the UI) to a concrete Date. */
export function resolveOrderDate(month: number, day: number): Date | null {
  if (!(day >= 1 && day <= 31)) return null
  const now = new Date()
  // A month before the current one means the customer means next year.
  const year = month < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear()
  return new Date(year, month, day)
}

/** True when the given date is too soon (today or tomorrow). */
export function isOrderDateTooSoon(date: Date): boolean {
  return date.getTime() < getMinOrderDate().getTime()
}

const WEEKDAY_PATTERNS = [
  /\bsun(day)?\b/, /\bmon(day)?\b/, /\btue(sday)?\b/, /\bwed(nesday)?\b/,
  /\bthu(r(sday)?)?\b/, /\bfri(day)?\b/, /\bsat(urday)?\b/,
]

/**
 * Best-effort parse of a free-text date into a concrete Date.
 * Understands "today"/"tonight", "tomorrow", weekday names
 * ("this saturday"), month-name dates ("August 24") and numeric
 * dates ("8/24"). Returns null when nothing date-like is found.
 */
export function parseOrderDate(text: string): Date | null {
  const lower = text.toLowerCase().trim()

  if (/\b(today|tonight|tonite)\b/.test(lower)) return new Date(getTodayStart())
  if (/\b(tomorrow|tmrw|tomorow)\b/.test(lower)) {
    const d = new Date(getTodayStart())
    d.setDate(d.getDate() + 1)
    return d
  }

  // Month name + day, e.g. "August 24" / "Aug 24th"
  for (let m = 0; m < ORDER_MONTHS.length; m++) {
    const re = new RegExp(`\\b${ORDER_MONTHS[m].slice(0, 3)}[a-z]*\\.?\\s+(\\d{1,2})`, 'i')
    const match = lower.match(re)
    if (match) {
      const d = resolveOrderDate(m, Number(match[1]))
      if (d) return d
    }
  }

  // Numeric M/D or M-D, e.g. "8/24"
  const numeric = lower.match(/\b(\d{1,2})\s*[/-]\s*(\d{1,2})\b/)
  if (numeric) {
    const m = Number(numeric[1]) - 1
    if (m >= 0 && m <= 11) {
      const d = resolveOrderDate(m, Number(numeric[2]))
      if (d) return d
    }
  }

  // Weekday names, e.g. "this saturday" (next occurrence)
  for (let i = 0; i < WEEKDAY_PATTERNS.length; i++) {
    if (WEEKDAY_PATTERNS[i].test(lower)) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const delta = (i - now.getDay() + 7) % 7 || 7
      const d = new Date(now)
      d.setDate(d.getDate() + delta)
      return d
    }
  }

  return null
}

function getTodayStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/* ------------------------------------------------------------------ */
/* Step processing                                                     */
/* ------------------------------------------------------------------ */

export interface StepResult {
  /** The bot reply text. */
  reply: string
  /** The next step (null means flow is complete). */
  nextStep: OrderStep | null
  /** Option buttons to show (label → value). */
  options?: { label: string; value: string }[]
  /** Whether this step needs text input. */
  needsInput?: boolean
}

/**
 * Process a user message for the given step.
 * Returns the bot reply, the next step, and any UI hints.
 */
export function processStep(step: OrderStep, text: string, data: OrderData, currentItemIndex: number = 0): StepResult {
  switch (step) {
    case 'product':
      return processProduct(text, data)
    case 'items_quantity':
      return processItemsQuantity(text, data, currentItemIndex)
    case 'date':
      return processDate(text, data)
    case 'name':
      return processName(text, data)
    case 'phone':
      return processPhone(text, data)
    case 'review':
      return processReview(text, data)
    default:
      return { reply: 'Something went wrong. Let\'s start over.', nextStep: 'product' }
  }
}

function processProduct(text: string, data: OrderData): StepResult {
  // Try exact product name match first (handles checkbox selections precisely)
  const trimmed = text.trim()
  const exactSingle = products.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
  if (exactSingle) {
    data.items = [{ product: exactSingle, quantity: 1 }]
    return {
      reply: `Great choice — the ${exactSingle.name} is ${formatPrice(exactSingle.price)}! How many would you like?`,
      nextStep: 'items_quantity',
      needsInput: true,
    }
  }

  // Try multi-exact match for "A and B" style checkbox selections
  const andParts = trimmed.toLowerCase().split(/\s+and\s+/)
  if (andParts.length > 1) {
    const exactMatches = andParts
      .map((part) => products.find((p) => p.name.toLowerCase() === part.trim()))
      .filter((p): p is ProductInfo => p !== undefined)
    if (exactMatches.length === andParts.length) {
      data.items = exactMatches.map((p) => ({ product: p, quantity: 1 }))
      const names = exactMatches.map((p) => p.name).join(', ')
      return {
        reply: `Great picks — ${names}! Let's set the quantity for each.\n\nHow many ${exactMatches[0].name} would you like?`,
        nextStep: 'items_quantity',
        needsInput: true,
      }
    }
  }

  // Fall back to fuzzy matching for free-text input
  const matched = matchProducts(text)
  if (matched.length === 0) {
    const list = products.map((p) => `• ${p.name} — ${formatPrice(p.price)}`).join('\n')
    return {
      reply: `Which flan(s) would you like? You can select multiple! Here are our options:\n${list}\n\nUse the checkboxes below or tell me the name(s)!`,
      nextStep: 'product',
      needsInput: true,
    }
  }
  if (matched.length === 1) {
    data.items = [{ product: matched[0], quantity: 1 }]
    return {
      reply: `Great choice — the ${matched[0].name} is ${formatPrice(matched[0].price)}! How many would you like?`,
      nextStep: 'items_quantity',
      needsInput: true,
    }
  }
  // Multiple products selected
  data.items = matched.map((p) => ({ product: p, quantity: 1 }))
  const names = matched.map((p) => p.name).join(', ')
  return {
    reply: `Great picks — ${names}! Let's set the quantity for each.\n\nHow many ${matched[0].name} would you like?`,
    nextStep: 'items_quantity',
    needsInput: true,
  }
}

function processItemsQuantity(text: string, data: OrderData, currentItemIndex: number): StepResult {
  const qty = parseQuantity(text)
  if (!qty || qty < 1) {
    return {
      reply: 'How many would you like? You can say a number like "2" or a word like "one".',
      nextStep: 'items_quantity',
      needsInput: true,
    }
  }

  // Set the quantity for the current item
  if (currentItemIndex >= 0 && currentItemIndex < data.items.length) {
    data.items[currentItemIndex].quantity = qty
  }

  const currentItemName = data.items[currentItemIndex]?.product.name ?? 'item'

  // Check if there are more items to process
  if (currentItemIndex + 1 < data.items.length) {
    const nextItem = data.items[currentItemIndex + 1]
    return {
      reply: `Got it — ${qty}× ${currentItemName}. How many ${nextItem.product.name} would you like?`,
      nextStep: 'items_quantity',
      needsInput: true,
    }
  }

  // All items processed — move to date step
  return {
    reply: `Got it — ${qty}× ${currentItemName}. What date would you like to pick your order up at the bakery?\n\nYou can say something like "this Saturday" or "August 20".`,
    nextStep: 'date',
    needsInput: true,
  }
}

function processDate(text: string, data: OrderData): StepResult {
  const trimmed = text.trim()
  // The bakery is pickup-only — politely redirect delivery requests.
  if (detectsDeliveryRequest(trimmed)) {
    return {
      reply: 'Sorry, we don\'t offer delivery — pickup only! What date works for you to pick up your order? You can say something like "this Saturday" or "August 20".',
      nextStep: 'date',
      needsInput: true,
    }
  }
  if (trimmed.length < 2) {
    return {
      reply: 'What date works for you? You can say something like "this Saturday" or "August 20".',
      nextStep: 'date',
      needsInput: true,
    }
  }
  const parsed = parseOrderDate(trimmed)
  if (parsed && isOrderDateTooSoon(parsed)) {
    const min = getMinOrderDate()
    return {
      reply: `Our flans are made fresh when you order, so we can't do same-day or next-day. The earliest I can schedule is ${ORDER_MONTHS[min.getMonth()]} ${min.getDate()} — does that work for you?`,
      nextStep: 'date',
      needsInput: true,
    }
  }
  const itemSummary = data.items.map((it) => `${it.quantity}× ${it.product.name}`).join(', ')
  return {
    reply: `Sounds good — ${trimmed}. Your order (${itemSummary}) will be ready for pickup at the bakery. Now I just need your name.`,
    nextStep: 'name',
    needsInput: false,
  }
}

function processName(text: string, data: OrderData): StepResult {
  const name = text.trim()
  if (name.length < 2 || name.length > 80) {
    return {
      reply: 'Please enter your name (first and last).',
      nextStep: 'name',
      needsInput: true,
    }
  }
  return {
    reply: `Nice to meet you, ${name}! What\'s the best phone number to reach you at?`,
    nextStep: 'phone',
    needsInput: true,
  }
}

function processPhone(text: string, data: OrderData): StepResult {
  const phone = text.trim()
  if (!isValidPhone(phone)) {
    return {
      reply: 'Please enter a valid phone number (at least 7 digits).',
      nextStep: 'phone',
      needsInput: true,
    }
  }
  return {
    reply: '__REVIEW__',
    nextStep: 'review',
    needsInput: false,
  }
}

function processReview(text: string, data: OrderData): StepResult {
  const lower = text.toLowerCase().trim()
  if (/^(yes|confirm|correct|looks good|that looks|submit|ok|okay|yep|yeah|y)/i.test(lower)) {
    return { reply: '__SUBMIT__', nextStep: null }
  }
  if (/^(no|change|wrong|fix|edit|modify|update)/i.test(lower)) {
    return {
      reply: 'No problem! What would you like to change? Say "product", "quantity", "date", "name", or "phone" to jump to that step.',
      nextStep: 'review',
      needsInput: true,
    }
  }
  return {
    reply: 'Does everything above look correct? Say "yes" to confirm, or tell me what to change.',
    nextStep: 'review',
    needsInput: true,
  }
}

/* ------------------------------------------------------------------ */
/* Jump to step (for editing)                                          */
/* ------------------------------------------------------------------ */

const STEP_JUMP_KEYWORDS: Record<string, OrderStep> = {
  product: 'product',
  items: 'items_quantity',
  quantity: 'items_quantity',
  date: 'date',
  pickup: 'date',
  name: 'name',
  phone: 'phone',
}

export function findJumpTarget(text: string): OrderStep | null {
  const lower = text.toLowerCase().trim()
  for (const [kw, step] of Object.entries(STEP_JUMP_KEYWORDS)) {
    if (lower.includes(kw)) return step
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Review summary builder                                              */
/* ------------------------------------------------------------------ */

export function buildReviewSummary(data: OrderData): string {
  const lines: string[] = ['Here\'s your order summary:', '']

  if (data.items.length > 0) {
    lines.push('Items:')
    let subtotal = 0
    for (const item of data.items) {
      const lineTotal = item.product.price * item.quantity
      subtotal += lineTotal
      lines.push(`  • ${item.quantity}× ${item.product.name} — ${formatPrice(item.product.price)} each = ${formatPrice(lineTotal)}`)
    }
    lines.push(`Subtotal: ${formatPrice(subtotal)}`)
  }

  lines.push(`Date: ${data.date || 'Not specified'}`)
  lines.push('Method: Pickup at the bakery')
  lines.push(`Name: ${data.customerName}`)
  lines.push(`Phone: ${data.phone}`)
  lines.push('')
  lines.push('Does everything look correct?')
  return lines.join('\n')
}
