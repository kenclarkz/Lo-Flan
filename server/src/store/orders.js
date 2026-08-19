import { query, getPool } from '../db/index.js'
import { config } from '../config.js'
import logger from '../utils/logger.js'

export const ORDER_STATUSES = ['pending', 'new', 'confirmed', 'fulfilled', 'cancelled']

export const ORDER_SOURCES = ['chat', 'phone']

/* ------------------------------------------------------------------ */
/* Column mapping: PostgreSQL snake_case ↔ JavaScript camelCase        */
/* ------------------------------------------------------------------ */

const TO_JS = {
  customer_name: 'customerName',
  call_sid: 'callSid',
  conversation_id: 'conversationId',
  delivery_method: 'deliveryMethod',
  delivery_address: 'deliveryAddress',
  pickup_date: 'pickupDate',
  is_order: 'isOrder',
  created_at: 'createdAt',
}

const TO_PG = Object.fromEntries(Object.entries(TO_JS).map(([k, v]) => [v, k]))

function rowToOrder(row) {
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    const jsKey = TO_JS[key] ?? key
    out[jsKey] = value
  }
  if (out.items && typeof out.items === 'string') {
    try { out.items = JSON.parse(out.items) } catch { /* already object */ }
  }
  return out
}

function orderToRow(order) {
  const out = {}
  for (const [key, value] of Object.entries(order)) {
    const pgKey = TO_PG[key] ?? key
    if (pgKey === 'items' && Array.isArray(value)) {
      out[pgKey] = JSON.stringify(value)
    } else {
      out[pgKey] = value
    }
  }
  return out
}

function uid() {
  return `ord-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}

/* ------------------------------------------------------------------ */
/* Public API — same signatures as the old JSON-file store             */
/* ------------------------------------------------------------------ */

/**
 * Record a new order (website chatbot) or call (phone receptionist).
 * @param {object} order
 * @returns {Promise<object>} the stored record
 */
export async function addOrder(order) {
  const id = uid()
  const row = orderToRow({
    id,
    source: order.source,
    status: ORDER_STATUSES.includes(order.status) ? order.status : 'new',
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
    deliveryMethod: order.deliveryMethod || undefined,
    deliveryAddress: order.deliveryAddress || undefined,
    pickupDate: order.pickupDate || undefined,
  })

  const keys = []
  const vals = []
  const placeholders = []
  let i = 1
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue
    keys.push(key)
    vals.push(value)
    placeholders.push(`$${i++}`)
  }

  const sql = `INSERT INTO orders (${keys.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`
  const { rows } = await query(sql, vals)
  return rowToOrder(rows[0])
}

/** @returns {object[]} all orders, newest first */
export async function listOrders() {
  const { rows } = await query('SELECT * FROM orders ORDER BY created_at DESC')
  return rows.map(rowToOrder)
}

export async function clearOrders() {
  await query('TRUNCATE orders')
}

export async function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) return null
  const { rows } = await query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id])
  return rows[0] ? rowToOrder(rows[0]) : null
}

export async function deleteOrder(id) {
  const { rowCount } = await query('DELETE FROM orders WHERE id = $1', [id])
  return rowCount > 0
}

export async function _resetStore() {
  if (getPool()) {
    await query('TRUNCATE orders')
  }
}
