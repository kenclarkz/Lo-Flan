/**
 * Built-in local chatbot engine for Lo-Flan.
 *
 * Runs entirely in the browser against the knowledge base in
 * `data/chatbot.ts`. There is no API key, no external AI service and no
 * server round-trip — ideal for the static GitHub Pages deployment.
 *
 * Features:
 *   - Intent/keyword matching over an easy-to-edit knowledge file.
 *   - Fuzzy word correction (Levenshtein) so misspellings still match.
 *   - Per-session conversation history so follow-up questions ("how much?")
 *     can be answered using the last product the visitor asked about.
 *   - A safe fallback that never invents facts.
 */

import {
  chatbotKnowledge,
  formatPrice,
  products,
  type ProductInfo,
} from '@/data/chatbot'

export interface LocalChatReply {
  reply: string
  conversationId: string
}

interface ConversationState {
  history: { role: 'user' | 'bot'; text: string }[]
  lastProductId?: string
}

/* ------------------------------------------------------------------ */
/* Conversation state                                                  */
/* ------------------------------------------------------------------ */

const conversations = new Map<string, ConversationState>()
let counter = 0

function newConversationId(): string {
  counter += 1
  return `local-${Date.now().toString(36)}-${counter}`
}

/* ------------------------------------------------------------------ */
/* Text normalization                                                  */
/* ------------------------------------------------------------------ */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  const clean = normalize(text)
  return clean ? clean.split(' ') : []
}

/* ------------------------------------------------------------------ */
/* Fuzzy word correction                                               */
/* ------------------------------------------------------------------ */

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = new Array<number>(n + 1)
  let curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

const COMMON_WORDS = [
  'what', 'are', 'your', 'the', 'do', 'you', 'i', 'a', 'an', 'is', 'it',
  'me', 'my', 'we', 'our', 'for', 'to', 'in', 'on', 'at', 'can', 'how',
  'much', 'does', 'tell', 'about', 'please', 'want', 'would', 'like',
  'have', 'has', 'with', 'this', 'that', 'there', 'from', 'us', 'am',
  'and', 'of', 'be', 'up', 'get', 'got', 'when', 'where', 'why', 'did',
  'not', 'no', 'yes', 'ok', 'okay', 'all', 'some', 'any', 'if', 'so',
  'out', 'over', 'see', 'need', 'know', 'thanks', 'thank',
]

const knowledgeWords: string[] = [
  ...chatbotKnowledge.topics.flatMap((t) => t.keywords),
  ...chatbotKnowledge.faqs.flatMap((f) => f.keywords),
  ...products.flatMap((p) => [p.name, ...p.keywords, ...p.ingredients, ...p.allergens]),
  chatbotKnowledge.businessName,
  chatbotKnowledge.address,
  chatbotKnowledge.phone,
  chatbotKnowledge.email,
  chatbotKnowledge.website,
  chatbotKnowledge.messenger,
  chatbotKnowledge.hoursText,
  chatbotKnowledge.ordering,
  chatbotKnowledge.catering,
  chatbotKnowledge.wholesale,
]

const vocab = new Set<string>(
  knowledgeWords.flatMap((w) => tokenize(w)).concat(COMMON_WORDS)
)

function correctToken(token: string): string {
  if (vocab.has(token)) return token
  const maxDist = token.length <= 4 ? 1 : 2
  let best = token
  let bestDist = Infinity
  for (const word of vocab) {
    const dist = levenshtein(token, word)
    if (dist < bestDist) {
      bestDist = dist
      best = word
      if (dist === 0) break
    }
  }
  return bestDist <= maxDist ? best : token
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

// Single words that are too generic to count on their own unless the whole
// message is short (e.g. "are you open?").
const WEAK_WORDS = new Set([
  'order', 'open', 'close', 'closed', 'call', 'free', 'options', 'today',
  'available', 'buy', 'get', 'good', 'great', 'nice', 'deal', 'special',
  'offer', 'offers',
])

function phraseContained(phrase: string[], tokens: string[]): boolean {
  let i = 0
  for (const token of tokens) {
    if (phrase[i] === token) i += 1
    if (i === phrase.length) return true
  }
  return i === phrase.length
}

interface IntentMatch {
  score: number
  /** Longest single keyword phrase that matched — used to break score ties. */
  peak: number
}

function matchIntent(keywords: string[], tokens: string[]): IntentMatch {
  let score = 0
  let peak = 0
  const input = new Set(tokens)
  for (const keyword of keywords) {
    const words = normalize(keyword).split(' ')
    if (words.length === 0) continue
    if (words.length === 1) {
      if (input.has(words[0]) && (!WEAK_WORDS.has(words[0]) || tokens.length <= 3)) {
        score += 1
        if (peak < 1) peak = 1
      }
    } else if (phraseContained(words, tokens)) {
      score += words.length
      if (peak < words.length) peak = words.length
    }
  }
  return { score, peak }
}

interface Match {
  id: string
  score: number
  peak: number
}

function getBestTopic(tokens: string[]): Match | null {
  let best: Match | null = null
  const consider = (id: string, m: IntentMatch, faq: boolean) => {
    if (m.score <= 0) return
    if (
      !best ||
      m.score > best.score ||
      (m.score === best.score && m.peak > best.peak) ||
      (m.score === best.score && m.peak === best.peak && faq && !best.id.startsWith('faq:'))
    ) {
      best = { id, score: m.score, peak: m.peak }
    }
  }
  for (const topic of chatbotKnowledge.topics) {
    consider(topic.id, matchIntent(topic.keywords, tokens), false)
  }
  for (const faq of chatbotKnowledge.faqs) {
    consider(`faq:${faq.id}`, matchIntent(faq.keywords, tokens), true)
  }
  return best
}

function getBestProduct(tokens: string[]): { product: ProductInfo; score: number } | null {
  let best: { product: ProductInfo; score: number } | null = null
  for (const product of products) {
    const keywords = [product.name, ...product.keywords]
    const { score } = matchIntent(keywords, tokens)
    if (score > 0 && (!best || score > best.score)) {
      best = { product, score }
    }
  }
  return best
}

function topicScore(tokens: string[], id: string): number {
  const topic = chatbotKnowledge.topics.find((t) => t.id === id)
  return topic ? matchIntent(topic.keywords, tokens).score : 0
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

function topicAnswer(id: string): string {
  const topic = chatbotKnowledge.topics.find((t) => t.id === id)
  return topic ? topic.answer : chatbotKnowledge.fallback
}

function faqAnswer(id: string): string {
  const faq = chatbotKnowledge.faqs.find((f) => `faq:${f.id}` === id)
  return faq ? faq.answer : chatbotKnowledge.fallback
}

function productPriceAnswer(product: ProductInfo): string {
  return `The ${product.name} is ${formatPrice(product.price)} (${product.size}). ${product.description}`
}

function productIngredientsAnswer(product: ProductInfo): string {
  return `The ${product.name} is made with ${product.ingredients.join(', ')}. It contains ${product.allergens.join(', ')}.`
}

function productAllergensAnswer(product: ProductInfo): string {
  return `The ${product.name} contains ${product.allergens.join(', ')}. For any serious allergy, let us know when you order and the owner will confirm the details with you.`
}

function productSizeAnswer(product: ProductInfo): string {
  return `The ${product.name} is a ${product.size}, sold at ${formatPrice(product.price)}.`
}

function productInfoAnswer(product: ProductInfo): string {
  return `We have the ${product.name} for ${formatPrice(product.price)} — ${product.description} It's a ${product.size}. Ask me about its ingredients or allergens if you'd like.`
}

function combinedOrderAnswer(product: ProductInfo): string {
  return `Great choice! The ${product.name} is ${formatPrice(product.price)} (${product.size}). ${chatbotKnowledge.ordering} ${chatbotKnowledge.leadTime}`
}

const ASPECT_TOPICS = ['prices', 'ingredients', 'allergens', 'sizes'] as const
const LOGISTICS_TOPICS = ['delivery', 'pickup', 'catering', 'wholesale', 'order_status']

/* ------------------------------------------------------------------ */
/* Main entry point                                                    */
/* ------------------------------------------------------------------ */

export function getLocalChatReply(message: string, conversationId?: string): LocalChatReply {
  const text = String(message ?? '').trim()
  if (!text) {
    return { reply: chatbotKnowledge.fallback, conversationId: conversationId ?? newConversationId() }
  }

  const id = conversationId && conversations.has(conversationId) ? conversationId : newConversationId()
  const state = conversations.get(id) ?? { history: [] }
  conversations.set(id, state)

  const tokens = tokenize(text).map(correctToken)

  const bestTopic = getBestTopic(tokens)
  const bestProduct = getBestProduct(tokens)
  const orderingScore = topicScore(tokens, 'ordering')

  let reply: string

  if (bestProduct) {
    state.lastProductId = bestProduct.product.id

    if (orderingScore > 0) {
      reply = combinedOrderAnswer(bestProduct.product)
    } else if (bestTopic && LOGISTICS_TOPICS.includes(bestTopic.id)) {
      reply = topicAnswer(bestTopic.id)
    } else {
      const aspect = bestAspectTopic(tokens)
      if (aspect === 'prices') reply = productPriceAnswer(bestProduct.product)
      else if (aspect === 'ingredients') reply = productIngredientsAnswer(bestProduct.product)
      else if (aspect === 'allergens') reply = productAllergensAnswer(bestProduct.product)
      else if (aspect === 'sizes') reply = productSizeAnswer(bestProduct.product)
      else reply = productInfoAnswer(bestProduct.product)
    }
  } else if (bestTopic) {
    if (ASPECT_TOPICS.includes(bestTopic.id as (typeof ASPECT_TOPICS)[number]) && state.lastProductId) {
      const last = products.find((p) => p.id === state.lastProductId)
      if (last) {
        if (bestTopic.id === 'prices') reply = productPriceAnswer(last)
        else if (bestTopic.id === 'ingredients') reply = productIngredientsAnswer(last)
        else if (bestTopic.id === 'allergens') reply = productAllergensAnswer(last)
        else reply = productSizeAnswer(last)
      } else {
        reply = bestTopic.id.startsWith('faq:') ? faqAnswer(bestTopic.id) : topicAnswer(bestTopic.id)
      }
    } else {
      reply = bestTopic.id.startsWith('faq:') ? faqAnswer(bestTopic.id) : topicAnswer(bestTopic.id)
    }
  } else {
    reply = chatbotKnowledge.fallback
  }

  state.history.push({ role: 'user', text })
  state.history.push({ role: 'bot', text: reply })
  if (state.history.length > 40) state.history.splice(0, state.history.length - 40)

  return { reply, conversationId: id }
}

function bestAspectTopic(tokens: string[]): (typeof ASPECT_TOPICS)[number] | null {
  let best: (typeof ASPECT_TOPICS)[number] | null = null
  let bestScore = 0
  for (const id of ASPECT_TOPICS) {
    const topic = chatbotKnowledge.topics.find((t) => t.id === id)
    if (!topic) continue
    const score = matchIntent(topic.keywords, tokens).score
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }
  return bestScore > 0 ? best : null
}
