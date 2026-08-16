/**
 * Conversational order flow for the Lo-Flan chatbot.
 *
 * Guides the customer step-by-step through placing an order:
 *   product → quantity → date → delivery/pickup → contact info → review → submit
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
  'quantity',
  'date',
  'delivery',
  'delivery_info',
  'name',
  'phone',
  'review',
] as const

export type OrderStep = (typeof ORDER_STEPS)[number]

/* ------------------------------------------------------------------ */
/* Order data                                                          */
/* ------------------------------------------------------------------ */

export interface OrderData {
  product: ProductInfo | null
  quantity: number
  date: string
  deliveryMethod: '' | 'pickup' | 'delivery'
  deliveryAddress: string
  customerName: string
  phone: string
}

export function emptyOrderData(): OrderData {
  return {
    product: null,
    quantity: 1,
    date: '',
    deliveryMethod: '',
    deliveryAddress: '',
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
}

export function newOrderFlowState(): OrderFlowState {
  return {
    active: false,
    step: 'product',
    data: emptyOrderData(),
    submitted: false,
    submitting: false,
    submitResult: null,
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
/* Delivery method detection                                           */
/* ------------------------------------------------------------------ */

export function parseDeliveryMethod(text: string): 'pickup' | 'delivery' | null {
  const lower = text.toLowerCase().trim()
  if (/pick\s*up|pickup|collect|in[\s-]store/.test(lower)) return 'pickup'
  if (/deliver|delivery|ship|bring/.test(lower)) return 'delivery'
  return null
}

/* ------------------------------------------------------------------ */
/* Phone number validation                                             */
/* ------------------------------------------------------------------ */

export function isValidPhone(text: string): boolean {
  const digits = text.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
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
export function processStep(step: OrderStep, text: string, data: OrderData): StepResult {
  switch (step) {
    case 'product':
      return processProduct(text, data)
    case 'quantity':
      return processQuantity(text, data)
    case 'date':
      return processDate(text, data)
    case 'delivery':
      return processDelivery(text, data)
    case 'delivery_info':
      return processDeliveryInfo(text, data)
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
  const product = matchProduct(text)
  if (!product) {
    const list = products.map((p) => `• ${p.name} — ${formatPrice(p.price)}`).join('\n')
    return {
      reply: `Which flan would you like? Here are our options:\n${list}\n\nJust tell me the name!`,
      nextStep: 'product',
      needsInput: true,
    }
  }
  return {
    reply: `Great choice — the ${product.name} is ${formatPrice(product.price)}! How many would you like?`,
    nextStep: 'quantity',
    needsInput: true,
  }
}

function processQuantity(text: string, data: OrderData): StepResult {
  const qty = parseQuantity(text)
  if (!qty || qty < 1) {
    return {
      reply: 'How many would you like? You can say a number like "2" or a word like "one".',
      nextStep: 'quantity',
      needsInput: true,
    }
  }
  return {
    reply: `Got it — ${qty} ${qty === 1 ? (data.product?.name ?? 'flan') : (data.product?.name ?? 'flans') + 's'}. What date would you like to pick them up or have them delivered?\n\nYou can say something like "this Saturday" or "August 20".`,
    nextStep: 'date',
    needsInput: true,
  }
}

function processDate(text: string, data: OrderData): StepResult {
  const trimmed = text.trim()
  if (trimmed.length < 2) {
    return {
      reply: 'What date works for you? You can say something like "this Saturday" or "August 20".',
      nextStep: 'date',
      needsInput: true,
    }
  }
  return {
    reply: `Sounds good — ${trimmed}. Would you like pickup or delivery?`,
    nextStep: 'delivery',
    options: [
      { label: 'Pickup', value: 'pickup' },
      { label: 'Delivery', value: 'delivery' },
    ],
    needsInput: true,
  }
}

function processDelivery(text: string, data: OrderData): StepResult {
  const method = parseDeliveryMethod(text)
  if (!method) {
    return {
      reply: 'Would you like to pick up your order or have it delivered?',
      nextStep: 'delivery',
      options: [
        { label: 'Pickup', value: 'pickup' },
        { label: 'Delivery', value: 'delivery' },
      ],
      needsInput: true,
    }
  }
  if (method === 'delivery') {
    return {
      reply: 'Great — delivery it is! What\'s the delivery address?',
      nextStep: 'delivery_info',
      needsInput: true,
    }
  }
  return {
    reply: 'Pickup works! Now I just need your name.',
    nextStep: 'name',
    needsInput: true,
  }
}

function processDeliveryInfo(text: string, data: OrderData): StepResult {
  const addr = text.trim()
  if (addr.length < 3) {
    return {
      reply: 'Please enter a delivery address (street, city, and zip if possible).',
      nextStep: 'delivery_info',
      needsInput: true,
    }
  }
  return {
    reply: `Got it — I'll note the address as "${addr}". What's your name?`,
    nextStep: 'name',
    needsInput: true,
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
      reply: 'No problem! What would you like to change? Say "product", "quantity", "date", "delivery", "name", or "phone" to jump to that step.',
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
  quantity: 'quantity',
  date: 'date',
  delivery: 'delivery',
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
  if (data.product) {
    lines.push(`Product: ${data.product.name}`)
    lines.push(`Price: ${formatPrice(data.product.price)} each`)
  }
  lines.push(`Quantity: ${data.quantity}`)
  if (data.product) {
    lines.push(`Subtotal: ${formatPrice(data.product.price * data.quantity)}`)
  }
  lines.push(`Date: ${data.date || 'Not specified'}`)
  lines.push(`Method: ${data.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}`)
  if (data.deliveryAddress) {
    lines.push(`Address: ${data.deliveryAddress}`)
  }
  lines.push(`Name: ${data.customerName}`)
  lines.push(`Phone: ${data.phone}`)
  lines.push('')
  lines.push('Does everything look correct?')
  return lines.join('\n')
}
