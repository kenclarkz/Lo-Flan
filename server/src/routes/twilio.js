import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import { buildIncomingCallTwiML, buildUnavailableTwiML } from '../utils/twiml.js'
import logger from '../utils/logger.js'

/**
 * Verify an incoming request against Twilio's X-Twilio-Signature header.
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export function isValidTwilioRequest(req) {
  if (!config.twilioAuthToken) {
    logger.warn('TWILIO_AUTH_TOKEN not set — skipping signature verification')
    return false
  }
  const signature = req.get('x-twilio-signature')
  if (!signature) return false

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.body ?? {})) {
    params.append(key, String(value))
  }
  const expected = crypto
    .createHmac('sha1', config.twilioAuthToken)
    .update(url + params.toString())
    .digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Derive the public base URL for this deployment so Twilio can reach the
 * WebSocket bridge. Uses APP_BASE_URL when set, otherwise the request Host
 * header (works behind ngrok / reverse proxies).
 * @param {import('express').Request} req
 * @returns {string}
 */
export function resolveBaseUrl(req) {
  if (config.appBaseUrl) return config.appBaseUrl
  const host = req.get('host') ?? `localhost:${config.port}`
  const proto = req.get('x-forwarded-proto') ?? (req.socket.encrypted ? 'https' : 'http')
  return `${proto}://${host}`
}

export function createTwilioRouter() {
  const router = Router()

  // Twilio Voice webhook for inbound calls. Configure this URL on your
  // phone number ("A call comes in" -> Webhook -> HTTP POST).
  router.post('/incoming', (req, res) => {
    try {
      if (config.verifySignatures && !isValidTwilioRequest(req)) {
        logger.warn('rejected inbound call: invalid Twilio signature')
        return res
          .status(403)
          .type('text/xml')
          .send(buildUnavailableTwiML(config.unavailableMessage))
      }

      const call = req.body ?? {}
      logger.info('inbound call', {
        callSid: call.CallSid,
        from: call.From,
        to: call.To,
      })

      if (!config.geminiApiKey) {
        logger.warn('GEMINI_API_KEY missing — returning fallback TwiML')
        return res
          .type('text/xml')
          .send(buildUnavailableTwiML(config.unavailableMessage))
      }

      const baseUrl = resolveBaseUrl(req)
      const streamUrl = `${baseUrl.replace(/^http/, 'ws')}/media-stream`
      const twiml = buildIncomingCallTwiML({
        greeting: config.greetingMessage,
        streamUrl,
        callSid: call.CallSid,
        from: call.From,
      })
      return res.type('text/xml').send(twiml)
    } catch (err) {
      logger.error('failed to build incoming-call response', err)
      return res
        .status(500)
        .type('text/xml')
        .send(buildUnavailableTwiML(config.unavailableMessage))
    }
  })

  // Optional status callback (set on the Twilio phone number or in TwiML).
  router.post('/status', (req, res) => {
    logger.info('call status callback', { body: req.body ?? {} })
    res.sendStatus(200)
  })

  return router
}
