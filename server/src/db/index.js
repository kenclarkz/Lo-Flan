import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import logger from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let pool = null

export function getPool() {
  if (pool) return pool
  if (!config.databaseUrl) return null
  pool = new pg.Pool({ connectionString: config.databaseUrl })
  pool.on('error', (err) => {
    logger.error('unexpected database pool error', err?.message ?? err)
  })
  return pool
}

export async function query(text, params) {
  const p = getPool()
  if (!p) throw new Error('database_not_configured')
  return p.query(text, params)
}

export async function runSchema() {
  const p = getPool()
  if (!p) return
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await p.query(schema)
  logger.info('database schema ensured')
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
