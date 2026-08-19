import { Router } from 'express'
import { config } from '../config.js'
import { addOrder, listOrders, clearOrders, updateOrderStatus, deleteOrder } from '../store/orders.js'
import logger from '../utils/logger.js'

/**
 * Orders API.
 *
 * - POST /api/orders              — public; submit a new order from the chatbot.
 * - GET  /api/orders              — admin; list all recorded orders/calls.
 * - POST /api/orders/clear        — admin; wipe the store.
 * - POST /api/orders/:id/status   — admin; update an order's status.
 * - DELETE /api/orders/:id        — admin; remove a single record.
 *
 * The chatbot creates orders via the public endpoint; they start with
 * status "pending" so the business owner can approve or deny them from
 * the admin dashboard.
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

  /* -------------------------------------------------------------- */
  /* Public: submit an order (from the website chatbot)              */
  /* -------------------------------------------------------------- */

  router.post('/orders', async (req, res) => {
    const { items, customerName, phone, deliveryMethod, deliveryAddress, pickupDate, notes } = req.body ?? {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items_required' })
    }
    if (!customerName || typeof customerName !== 'string') {
      return res.status(400).json({ error: 'customerName_required' })
    }

    const record = await addOrder({
      source: 'chat',
      customerName: customerName.trim(),
      phone: phone || undefined,
      items: items.map((item) => ({
        name: String(item.name || ''),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
      deliveryMethod: deliveryMethod || undefined,
      deliveryAddress: deliveryAddress || undefined,
      pickupDate: pickupDate || undefined,
      notes: notes || undefined,
      status: 'pending',
    })

    logger.info(`chat order created: ${record.id} by ${record.customerName}`)
    return res.status(201).json({ ok: true, order: record })
  })

  /* -------------------------------------------------------------- */
  /* Admin endpoints                                                 */
  /* -------------------------------------------------------------- */

  router.get('/orders', async (_req, res) => {
    if (!requireAdmin(_req, res)) return
    const orders = await listOrders()
    return res.json({ orders })
  })

  router.post('/orders/clear', async (req, res) => {
    if (!requireAdmin(req, res)) return
    await clearOrders()
    logger.info('orders cleared by admin')
    return res.json({ ok: true })
  })

  router.post('/orders/:id/status', async (req, res) => {
    if (!requireAdmin(req, res)) return
    const { status } = req.body ?? {}
    if (!status) return res.status(400).json({ error: 'status_required' })
    const order = await updateOrderStatus(req.params.id, String(status))
    if (!order) {
      return res.status(400).json({ error: 'invalid_status' })
    }
    return res.json({ ok: true, order })
  })

  router.delete('/orders/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return
    if (!(await deleteOrder(req.params.id))) {
      return res.status(404).json({ error: 'not_found' })
    }
    return res.json({ ok: true })
  })

  return router
}
