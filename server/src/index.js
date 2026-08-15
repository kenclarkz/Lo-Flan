import http from 'node:http'
import { WebSocketServer } from 'ws'
import { createApp } from './app.js'
import { handleMediaStream } from './ws/mediaStream.js'
import { config, validateConfig } from './config.js'
import logger from './utils/logger.js'

const app = createApp()
const server = http.createServer(app)

// Twilio Media Streams connects here (wss://<host>/media-stream).
const wss = new WebSocketServer({ server, path: '/media-stream' })
wss.on('connection', (ws) => handleMediaStream(ws))

server.listen(config.port, () => {
  const { ok, missing } = validateConfig()
  logger.info(`Lo-Flan receptionist listening on http://0.0.0.0:${config.port}`)
  logger.info(`Health check:   http://localhost:${config.port}/health`)
  logger.info(`Media streams:  wss://<public-host>/media-stream`)
  logger.info(`Twilio webhook: http(s)://<public-host>/twilio/incoming`)
  if (!ok) {
    logger.warn(`Missing required env var(s): ${missing.join(', ')} — inbound calls will fall back to a "unavailable" message.`)
  }
})

function shutdown(signal) {
  logger.info(`received ${signal}, shutting down`)
  wss.close()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
