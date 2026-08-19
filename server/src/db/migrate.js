#!/usr/bin/env node

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Aborting migration.')
  process.exit(1)
}

const ordersFile = process.env.ORDERS_FILE || path.join(__dirname, '../../data/orders.json')

const pool = new pg.Pool({ connectionString: databaseUrl })

async function migrate() {
  console.log('Ensuring schema...')
  await pool.query(schema)

  if (!fs.existsSync(ordersFile)) {
    console.log('No orders.json found — nothing to migrate.')
    await pool.end()
    return
  }

  const raw = JSON.parse(fs.readFileSync(ordersFile, 'utf8'))
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log('orders.json is empty — nothing to migrate.')
    await pool.end()
    return
  }

  const { rows: existing } = await pool.query('SELECT count(*)::int AS n FROM orders')
  if (existing[0].n > 0) {
    console.log(`Database already has ${existing[0].n} orders. Skipping import (delete rows first to re-import).`)
    await pool.end()
    return
  }

  console.log(`Migrating ${raw.length} orders from orders.json...`)

  for (const order of raw) {
    await pool.query(
      `INSERT INTO orders (id, source, status, created_at, customer_name, phone, items, notes, message, call_sid, conversation_id, transcript, is_order, delivery_method, delivery_address, pickup_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [
        order.id,
        order.source,
        order.status || 'new',
        order.createdAt || new Date().toISOString(),
        order.customerName || null,
        order.phone || null,
        order.items ? JSON.stringify(order.items) : null,
        order.notes || null,
        order.message || null,
        order.callSid || null,
        order.conversationId || null,
        order.transcript || null,
        order.isOrder ?? false,
        order.deliveryMethod || null,
        order.deliveryAddress || null,
        order.pickupDate || null,
      ]
    )
  }

  const { rows: after } = await pool.query('SELECT count(*)::int AS n FROM orders')
  console.log(`Migration complete. ${after[0].n} orders in database.`)

  await pool.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
