import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import express from 'express'

const tmpFile = path.join(os.tmpdir(), `orders-route-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
process.env.ORDERS_FILE = tmpFile
process.env.ADMIN_API_KEY = 'test-admin-key'

const { createOrdersRouter } = await import('../src/routes/orders.js')
const { _resetStore } = await import('../src/store/orders.js')

let server
let baseUrl

before(async () => {
  _resetStore()
  const app = express()
  app.use(express.json())
  app.use('/api', createOrdersRouter())
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`
})

after(() => {
  server?.close()
  try {
    fs.unlinkSync(tmpFile)
  } catch {
    /* already gone */
  }
})

test('GET /api/orders requires the admin key', async () => {
  const noKey = await fetch(`${baseUrl}/api/orders`)
  assert.equal(noKey.status, 401)
  const withKey = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'x-admin-key': 'test-admin-key' },
  })
  assert.equal(withKey.status, 200)
  const body = await withKey.json()
  assert.ok(Array.isArray(body.orders))
})

test('POST /api/orders/clear requires the admin key', async () => {
  const res = await fetch(`${baseUrl}/api/orders/clear`, { method: 'POST' })
  assert.equal(res.status, 401)
})

test('POST /api/orders/:id/status updates and rejects bad statuses', async () => {
  // Seed directly through the store for a stable id.
  const { addOrder } = await import('../src/store/orders.js')
  const order = addOrder({ source: 'chat', items: [{ name: 'Original', quantity: 1 }] })

  const good = await fetch(`${baseUrl}/api/orders/${order.id}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': 'test-admin-key' },
    body: JSON.stringify({ status: 'confirmed' }),
  })
  assert.equal(good.status, 200)

  const bad = await fetch(`${baseUrl}/api/orders/${order.id}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': 'test-admin-key' },
    body: JSON.stringify({ status: 'nope' }),
  })
  assert.equal(bad.status, 400)
})

test('DELETE /api/orders/:id removes a record', async () => {
  const { addOrder } = await import('../src/store/orders.js')
  const order = addOrder({ source: 'phone', callSid: 'CA-remove' })
  const res = await fetch(`${baseUrl}/api/orders/${order.id}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': 'test-admin-key' },
  })
  assert.equal(res.status, 200)
  const missing = await fetch(`${baseUrl}/api/orders/nope`, {
    method: 'DELETE',
    headers: { 'x-admin-key': 'test-admin-key' },
  })
  assert.equal(missing.status, 404)
})
