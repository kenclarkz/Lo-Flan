import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import logger from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_FILE = path.join(__dirname, '../../data/orders.json')

export const ORDER_STATUSES = ['new', 'confirmed', 'fulfilled', 'cancelled']

export const ORDER_SOURCES = ['chat', 'phone']

let cache = null

function uid() {
  return `ord-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}

function ordersFile() {
  return config.ordersFile || DEFAULT_FILE
}

function load() {
  if (cache) return cache
  try {
    const file = ordersFile()
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
      if (Array.isArray(raw)) cache = raw
    }
  } catch (err) {
    logger.warn('could not read orders file — starting empty', err?.message ?? err)
  }
  if (!cache) cache = []
  return cache
}

function persist() {
  try {
    const file = ordersFile()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(load(), null, 2))
  } catch (err) {
    logger.warn('could not persist orders file', err?.message ?? err)
  }
}

/**
 * Record a new order (website chatbot) or call (phone receptionist).
 * @param {object} order
 * @param {'chat'|'phone'} order.source
 * @param {string} [order.customerName]
 * @param {string} [order.phone]
 * @param {{name: string, quantity: number}[]} [order.items]
 * @param {string} [order.notes]
 * @param {string} [order.message]
 * @param {string} [order.callSid]
 * @param {string} [order.conversationId]
 * @param {string} [order.transcript]
 * @param {string} [order.isOrder]
 * @returns {object} the stored record
 */
export function addOrder(order) {
  const record = {
    id: uid(),
    source: order.source,
    status: 'new',
    createdAt: new Date().toISOString(),
    customerName: order.customerName || undefined,
    phone: order.phone || undefined,
    items: Array.isArray(order.items) && order.items.length > 0 ? order.items : undefined,
    notes: order.notes || undefined,
    message: order.message || undefined,
    callSid: order.callSid || undefined,
    conversationId: order.conversationId || undefined,
    transcript: order.transcript || undefined,
    isOrder: order.isOrder ?? Boolean(order.items && order.items.length > 0),
  }
  load().unshift(record)
  persist()
  return record
}

/** @returns {object[]} all orders, newest first */
export function listOrders() {
  return [...load()]
}

export function clearOrders() {
  cache = []
  persist()
}

export function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) return null
  const order = load().find((o) => o.id === id)
  if (!order) return null
  order.status = status
  persist()
  return order
}

export function deleteOrder(id) {
  const index = load().findIndex((o) => o.id === id)
  if (index === -1) return false
  load().splice(index, 1)
  persist()
  return true
}

/** Test hook — drop the in-memory cache so next read reloads from disk. */
export function _resetStore() {
  cache = null
}
