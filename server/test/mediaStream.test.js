import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { handleMediaStream } from '../src/ws/mediaStream.js'

const SILENCE_PAYLOAD = Buffer.alloc(160, 0xff).toString('base64')

function waitFor(fn, timeoutMs = 2000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      let v
      try {
        v = fn()
      } catch {
        /* keep retrying */
      }
      if (v) return resolve(v)
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`waitFor timed out after ${timeoutMs}ms`))
      }
      setTimeout(tick, 10)
    }
    tick()
  })
}

function makeSession() {
  return {
    sent: [],
    callbacks: null,
    closed: false,
    sendAudio(pcm16) {
      this.sent.push(pcm16)
    },
    close() {
      this.closed = true
    },
  }
}

let server
let wss
let factory

before(async () => {
  server = http.createServer()
  wss = new WebSocketServer({ server, path: '/media-stream' })

  factory = {
    sessions: [],
    last() {
      return this.sessions[this.sessions.length - 1]
    },
    defaultCreate(cb) {
      const session = makeSession()
      session.callbacks = cb
      this.sessions.push(session)
      return session
    },
    create(cb) {
      return this.defaultCreate(cb)
    },
  }

  wss.on('connection', (ws) =>
    handleMediaStream(ws, {
      sessionFactory: (cb) => Promise.resolve(factory.create(cb)),
    }),
  )

  await new Promise((resolve) => server.listen(0, resolve))
})

after(() => {
  wss?.close()
  server?.close()
})

function connectClient() {
  const url = `ws://127.0.0.1:${server.address().port}/media-stream`
  const ws = new WebSocket(url)
  const messages = []
  ws.on('message', (raw) => messages.push(JSON.parse(raw.toString())))
  return new Promise((resolve, reject) => {
    ws.on('open', () => resolve({ ws, messages }))
    ws.on('error', reject)
  })
}

// Wait for the Nth session created by the bridge (sessions accumulate across
// tests, so index-based waiting avoids grabbing a previous test's session).
let expectedSessions = 0
function nextSession() {
  const index = expectedSessions++
  return waitFor(() => factory.sessions[index])
}

test('bridge forwards caller audio to the AI as 16 kHz PCM', async () => {
  const { ws } = await connectClient()
  try {
    ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'sid1', callSid: 'call1' } }))
    const session = await nextSession()

    ws.send(JSON.stringify({ event: 'media', media: { payload: SILENCE_PAYLOAD } }))
    await waitFor(() => session.sent.length === 1)
    assert.equal(session.sent[0].length, 320, '160 samples @ 8kHz -> 320 @ 16kHz')
    assert.ok(session.sent[0].every((v) => v === 0), 'silence stays silence')
  } finally {
    ws.terminate()
  }
})

test('bridge forwards AI audio back to Twilio as µ-law media events', async () => {
  const { ws, messages } = await connectClient()
  try {
    ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'sid2', callSid: 'call2' } }))
    const session = await nextSession()

    // Emulate Gemini replying with 60ms of 24 kHz PCM silence.
    session.callbacks.onAudio(Buffer.from(new Int16Array(2880).fill(0).buffer))

    const media = await waitFor(() => messages.find((m) => m.event === 'media'))
    assert.equal(media.streamSid, 'sid2')
    const payload = Buffer.from(media.media.payload, 'base64')
    assert.equal(payload.length, 960, '2880 @ 24kHz -> 960 @ 8kHz µ-law')
    assert.ok(payload.every((b) => b === 0xff), 'silence stays silence')
  } finally {
    ws.terminate()
  }
})

test('bridge forwards interrupt as a clear event', async () => {
  const { ws, messages } = await connectClient()
  try {
    ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'sid3', callSid: 'call3' } }))
    const session = await nextSession()

    session.callbacks.onInterrupt()
    const clear = await waitFor(() => messages.find((m) => m.event === 'clear'))
    assert.equal(clear.streamSid, 'sid3')
  } finally {
    ws.terminate()
  }
})

test('bridge buffers audio received before the AI session is ready', async () => {
  let release
  const gate = new Promise((r) => (release = r))
  const controlled = makeSession()
  const originalCreate = factory.create
  factory.create = (cb) => {
    controlled.callbacks = cb
    return gate.then(() => controlled)
  }

  const { ws } = await connectClient()
  try {
    ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'sid4', callSid: 'call4' } }))
    // Audio sent before the session resolves must be buffered, not dropped.
    ws.send(JSON.stringify({ event: 'media', media: { payload: SILENCE_PAYLOAD } }))
    await waitFor(() => controlled.callbacks)
    release()
    await waitFor(() => controlled.sent.length === 1)
    assert.equal(controlled.sent[0].length, 320, 'buffered audio flushed once ready')
  } finally {
    ws.terminate()
    factory.create = originalCreate
  }
})

test('bridge closes the AI session on stop', async () => {
  const { ws } = await connectClient()
  try {
    ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'sid5', callSid: 'call5' } }))
    const session = await nextSession()
    ws.send(JSON.stringify({ event: 'stop' }))
    await waitFor(() => session.closed)
    assert.ok(session.closed)
  } finally {
    ws.terminate()
  }
})
