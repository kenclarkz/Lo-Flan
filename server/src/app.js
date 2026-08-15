import express from 'express'
import { config } from './config.js'
import { createTwilioRouter } from './routes/twilio.js'
import { createChatRouter } from './routes/chat.js'
import logger from './utils/logger.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  app.get('/', (_req, res) => {
    res.json({
      service: 'loflan-receptionist',
      stage: 2,
      endpoints: {
        health: 'GET /health',
        twilioWebhook: 'POST /twilio/incoming',
        statusCallback: 'POST /twilio/status',
        mediaStreams: 'WS /media-stream',
        chat: 'POST /api/chat',
        orders: 'GET /api/orders (admin)',
      },
    })
  })

  // Simple health check for uptime monitors and CI smoke tests.
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'loflan-receptionist',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/twilio', createTwilioRouter())
  app.use('/api', createChatRouter())

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', path: req.path })
  })

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    logger.error('unhandled error', err)
    res.status(500).json({ error: 'internal_error' })
  })

  return app
}
