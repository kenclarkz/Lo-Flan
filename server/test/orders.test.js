import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use the test database
process.env.DATABASE_URL = 'postgresql://loflan:loflan_dev@localhost:5432/loflan_orders_test'

const schema = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const store = await import('../src/store/orders.js')

before(async () => {
  await pool.query(schema)
  await store._resetStore()
})

after(async () => {
  await pool.end()
})

test('addOrder stores and returns a record', async () => {
  const order = await store.addOrder({
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

test('listOrders returns newest first', async () => {
  await store.addOrder({ source: 'phone', callSid: 'CA1', transcript: 'Caller: hi' })
  const all = await store.listOrders()
  assert.ok(all.length >= 2)
  assert.equal(all[0].callSid, 'CA1')
})

test('updateOrderStatus updates a matching record and rejects unknown statuses', async () => {
  const all = await store.listOrders()
  const order = all[0]
  const updated = await store.updateOrderStatus(order.id, 'fulfilled')
  assert.equal(updated.status, 'fulfilled')
  assert.equal(await store.updateOrderStatus(order.id, 'nope'), null)
})

test('deleteOrder removes a single record', async () => {
  const all = await store.listOrders()
  const order = all[0]
  assert.equal(await store.deleteOrder(order.id), true)
  assert.equal(await store.deleteOrder('missing-id'), false)
  const remaining = await store.listOrders()
  assert.equal(remaining.find((o) => o.id === order.id), undefined)
})

test('clearOrders empties the store', async () => {
  await store.clearOrders()
  const all = await store.listOrders()
  assert.deepEqual(all, [])
})
