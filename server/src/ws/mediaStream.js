import { WebSocket } from 'ws'
import { createConversationSession } from '../ai/index.js'
import { createMulawToPcm16, createPcm24kToMulaw8k } from '../utils/audio.js'
import { addOrder } from '../store/orders.js'
import logger from '../utils/logger.js'

// ~3 seconds of 20 ms media frames held while the AI session connects.
const MAX_BUFFERED_MEDIA = 240

// Words that suggest a caller is placing an order, used to flag phone calls
// in the admin dashboard when no structured extraction is possible from audio.
const ORDER_KEYWORDS = [
  'order',
  'ordering',
  'buy',
  'want',
  "i'd like",
  'would like',
  'can i get',
  'get one',
  'get two',
  'get a',
  'get some',
  'whole flan',
  'slices',
]

export function looksLikeOrder(text) {
  const lower = String(text ?? '').toLowerCase()
  return ORDER_KEYWORDS.some((k) => lower.includes(k))
}

/**
 * Bridge a Twilio Media Stream WebSocket to the AI conversation session.
 *
 * - Receives caller audio as base64 µ-law (8 kHz) and streams 16 kHz PCM to
 *   the AI.
 * - Streams the AI's 24 kHz PCM replies back as base64 µ-law `media` events.
 * - Forwards Gemini `interrupted` signals to Twilio as `clear` events so
 *   queued AI speech stops the instant the caller starts talking.
 * - Records each call (transcript, number, order-likelihood) to the order
 *   store so the admin dashboard can see receptionist activity.
 *
 * @param {import('ws').WebSocket} ws The Twilio Media Stream connection.
 * @param {{ sessionFactory?: Function }} deps Injectable session factory (tests).
 */
export function handleMediaStream(ws, deps = {}) {
  const sessionFactory = deps.sessionFactory ?? createConversationSession

  let streamSid = null
  let callSid = null
  let callFrom = null
  let session = null
  let ready = false
  let buffered = []
  let transcript = []
  let recorded = false

  const toPcm16 = createMulawToPcm16()
  const toMulaw8k = createPcm24kToMulaw8k()

  const isOpen = () => ws.readyState === WebSocket.OPEN

  function sendJson(obj) {
    if (isOpen()) ws.send(JSON.stringify(obj))
  }

  function sendMedia(mulaw8k) {
    if (!streamSid) return
    sendJson({
      event: 'media',
      streamSid,
      media: { payload: mulaw8k.toString('base64') },
    })
  }

  function sendClear() {
    if (!streamSid) return
    sendJson({ event: 'clear', streamSid })
  }

  function flushBuffer() {
    if (!ready || !session) return
    for (const payload of buffered.splice(0)) {
      session.sendAudio(toPcm16(payload))
    }
  }

  async function recordCall() {
    if (recorded) return
    recorded = true
    const body = transcript.join('\n').trim()
    if (!body) return
    const record = await addOrder({
      source: 'phone',
      phone: callFrom || undefined,
      callSid: callSid || undefined,
      transcript: body || undefined,
      customerName: undefined,
      isOrder: body ? looksLikeOrder(body) : false,
    })
    logger.info(`[call ${callSid}] recorded call ${record.id}`)
  }

  function cleanup() {
    recordCall()
    ready = false
    buffered = []
    if (session) {
      try {
        session.close()
      } catch (err) {
        logger.debug('error closing conversation session', err)
      }
      session = null
    }
  }

  async   function openSession() {
    try {
      session = await sessionFactory({
        onAudio: (pcm24k) => sendMedia(toMulaw8k(pcm24k)),
        onInterrupt: () => sendClear(),
        onUserTranscript: (text) => {
          logger.info(`[call ${callSid}] caller: ${text}`)
          transcript.push(`Caller: ${text}`)
        },
        onAgentTranscript: (text) => {
          logger.info(`[call ${callSid}] receptionist: ${text}`)
          transcript.push(`Receptionist: ${text}`)
        },
        onError: (err) => {
          logger.error(`[call ${callSid}] AI session error`, err?.message ?? err)
          if (isOpen()) ws.close(1011, 'ai_unavailable')
        },
        onClose: () => {
          // AI connection dropped mid-call: end the stream so the call hangs up.
          if (ready && isOpen()) ws.close(1011, 'ai_closed')
          ready = false
        },
      })
      ready = true
      logger.info(`[call ${callSid}] AI session ready`)
      flushBuffer()
    } catch (err) {
      logger.error(`[call ${callSid}] failed to start AI session`, err?.message ?? err)
      if (isOpen()) ws.close(1011, 'ai_unavailable')
    }
  }

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    switch (msg.event) {
      case 'connected':
        break
      case 'start': {
        streamSid = msg.start?.streamSid
        callSid = msg.start?.callSid
        const custom = msg.start?.customParameters ?? {}
        callFrom = custom.from || null
        logger.info(`[call ${callSid}] media stream started (sid ${streamSid}, from ${callFrom})`)
        openSession()
        break
      }
      case 'media': {
        const payload = msg.media?.payload
        if (!payload || !streamSid) break
        if (!ready || !session) {
          if (buffered.length < MAX_BUFFERED_MEDIA) buffered.push(payload)
          break
        }
        session.sendAudio(toPcm16(payload))
        break
      }
      case 'mark':
        break
      case 'stop':
        logger.info(`[call ${callSid}] media stream stopped`)
        cleanup()
        break
    }
  })

  ws.on('close', () => {
    logger.info(`[call ${callSid}] websocket closed`)
    cleanup()
  })

  ws.on('error', (err) => {
    logger.error(`[call ${callSid}] websocket error`, err?.message ?? err)
    cleanup()
  })
}
