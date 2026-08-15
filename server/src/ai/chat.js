import { GoogleGenAI } from '@google/genai'
import { config } from '../config.js'
import { buildChatSystemInstruction } from '../knowledge/business.js'
import { addOrder } from '../store/orders.js'
import logger from '../utils/logger.js'

const MAX_HISTORY = 20

// Lightweight in-memory conversation history. Restarting the server forgets
// context, which is fine for a storefront chatbot — visitors are anonymous
// and sessions are short.
const conversations = new Map()

function historyKey(conversationId) {
  const id = conversationId || `chat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  if (!conversationId) return { id, fresh: true }
  return { id, fresh: false }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => ({
      name: typeof item?.name === 'string' ? item.name : '',
      quantity: Math.max(1, Number(item?.quantity) || 1),
    }))
    .filter((item) => item.name.trim() !== '')
}

function parseOrderReply(text, message, id) {
  const trimmed = String(text ?? '').trim()
  const json = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed
  const parsed = JSON.parse(json)
  const reply = typeof parsed?.reply === 'string' ? parsed.reply : ''
  const rawOrder = parsed?.order ?? null

  if (!rawOrder) return { reply, orderId: null }

  const items = normalizeItems(rawOrder.items)
  if (items.length === 0) return { reply, orderId: null }

  const record = addOrder({
    source: 'chat',
    customerName: typeof rawOrder.name === 'string' ? rawOrder.name : undefined,
    phone: typeof rawOrder.phone === 'string' ? rawOrder.phone : undefined,
    items,
    notes: typeof rawOrder.notes === 'string' ? rawOrder.notes : undefined,
    message,
    conversationId: id,
  })
  logger.info(`chat order recorded (${record.id})`)
  return { reply, orderId: record.id }
}

/**
 * One turn of the website chat bot.
 * @param {string} message The visitor's latest message.
 * @param {string} [conversationId] Reuse an existing conversation.
 * @returns {Promise<{ reply: string, conversationId: string, orderId: string | null }>}
 */
export async function chatReply(message, conversationId) {
  const { id, fresh } = historyKey(conversationId)
  const state = conversations.get(id) ?? {
    history: [],
    orderPlaced: false,
  }
  if (fresh) conversations.set(id, state)

  state.history.push({ role: 'user', parts: [{ text: message }] })
  if (state.history.length > MAX_HISTORY) {
    // Trim full user/model pairs so Gemini's role alternation stays valid.
    const excess = state.history.length - MAX_HISTORY
    state.history.splice(0, excess + (excess % 2))
  }

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })
  const response = await ai.models.generateContent({
    model: config.chatModel,
    contents: state.history,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: buildChatSystemInstruction({
        orderPlaced: state.orderPlaced,
      }),
    },
  })

  const text = response?.text ?? ''
  let result
  try {
    result = parseOrderReply(text, message, id)
  } catch (err) {
    logger.warn('chat reply was not valid JSON — sending raw text', err?.message ?? err)
    result = { reply: text || 'Sorry, I did not catch that.', orderId: null }
  }

  state.history.push({ role: 'model', parts: [{ text }] })
  if (result.orderId) state.orderPlaced = true

  return {
    reply: result.reply || 'Sorry, I did not catch that.',
    conversationId: id,
    orderId: result.orderId ?? null,
  }
}
