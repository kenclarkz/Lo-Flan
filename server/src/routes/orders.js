import { Router } from 'express'
import { config } from '../config.js'
import { listOrders, clearOrders, updateOrderStatus, deleteOrder } from '../store/orders.js'
import logger from '../utils/logger.js'

/**
 * Admin orders API.
 *
 * - GET  /api/orders          — admin; list all recorded orders/calls.
 * - POST /api/orders/clear    — admin; wipe the store.
 * - POST /api/orders/:id/status — admin; update an order's status.
 * - DELETE /api/orders/:id    — admin; remove a single record.
 *
 * The website chat bot is fully built-in now (see `lib/chatbot.ts`), so there
 * is no `/api/chat` endpoint anymore. Orders here come from phone calls taken
 * by the AI receptionist.
 *
 * Admin endpoints require `X-Admin-Key: <ADMIN_API_KEY>` (or ?adminKey=).
 */
export function createOrdersRouter() {
  const router = Router()

  function isAdmin(req) {
    const key = req.get('x-admin-key') || String(req.query.adminKey || '')
    return Boolean(config.adminApiKey) && key === config.adminApiKey
  }

  function requireAdmin(req, res) {
    if (isAdmin(req)) return true
    res.status(401).json({ error: 'unauthorized' })
    return false
  }

  router.get('/orders', (_req, res) => {
    if (!requireAdmin(_req, res)) return
    return res.json({ orders: listOrders() })
  })

  router.post('/orders/clear', (req, res) => {
    if (!requireAdmin(req, res)) return
    clearOrders()
    logger.info('orders cleared by admin')
    return res.json({ ok: true })
  })

  router.post('/orders/:id/status', (req, res) => {
    if (!requireAdmin(req, res)) return
    const { status } = req.body ?? {}
    if (!status) return res.status(400).json({ error: 'status_required' })
    const order = updateOrderStatus(req.params.id, String(status))
    if (!order) {
      return res.status(400).json({ error: 'invalid_status' })
    }
    return res.json({ ok: true, order })
  })

  router.delete('/orders/:id', (req, res) => {
    if (!requireAdmin(req, res)) return
    if (!deleteOrder(req.params.id)) {
      return res.status(404).json({ error: 'not_found' })
    }
    return res.json({ ok: true })
  })

  return router
}
