import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tmpFile = path.join(os.tmpdir(), `orders-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
process.env.ORDERS_FILE = tmpFile

const store = await import('../src/store/orders.js')

before(() => {
  store._resetStore()
})

after(() => {
  try {
    fs.unlinkSync(tmpFile)
  } catch {
    /* already gone */
  }
})

test('addOrder stores and returns a record', () => {
  const order = store.addOrder({
    source: 'chat',
    customerName: 'Jane',
    phone: '555-0100',
    items: [{ name: 'Chocolate Flan', quantity: 1 }],
    notes: 'pickup saturday',
  })
  assert.match(order.id, /^ord-/)
  assert.equal(order.status, 'new')
  assert.equal(order.source, 'chat')
  assert.equal(order.isOrder, true)
  assert.ok(order.createdAt)
})

test('listOrders returns newest first and persists across a reset', () => {
  store.addOrder({ source: 'phone', callSid: 'CA1', transcript: 'Caller: hi' })
  const all = store.listOrders()
  assert.equal(all.length, 2)
  assert.equal(all[0].callSid, 'CA1')

  // Reload from disk (as a fresh process would) and confirm persistence.
  store._resetStore()
  const reloaded = store.listOrders()
  assert.equal(reloaded.length, 2)
})

test('updateOrderStatus updates a matching record and rejects unknown statuses', () => {
  const all = store.listOrders()
  const order = all[0]
  const updated = store.updateOrderStatus(order.id, 'fulfilled')
  assert.equal(updated.status, 'fulfilled')
  assert.equal(store.updateOrderStatus(order.id, 'nope'), null)
})

test('deleteOrder removes a single record', () => {
  const all = store.listOrders()
  const order = all[0]
  assert.equal(store.deleteOrder(order.id), true)
  assert.equal(store.deleteOrder('missing-id'), false)
  assert.equal(store.listOrders().find((o) => o.id === order.id), undefined)
})

test('clearOrders empties the store', () => {
  store.clearOrders()
  assert.deepEqual(store.listOrders(), [])
})
