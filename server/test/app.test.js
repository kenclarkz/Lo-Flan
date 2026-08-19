import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

// Ensure the fallback path is exercised regardless of CI environment.
// Set to empty string BEFORE dotenv/config loads .env in config.js.
process.env.GEMINI_API_KEY = ''

let server
let baseUrl

before(async () => {
  const { createApp } = await import('../src/app.js')
  server = http.createServer(createApp())
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`
})

after(() => {
  server?.close()
})

function post(path, body) {
  const data = new URLSearchParams(body ?? {}).toString()
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: data,
  })
}

test('GET /health returns ok', async () => {
  const res = await fetch(`${baseUrl}/health`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.status, 'ok')
  assert.equal(body.service, 'loflan-receptionist')
})

test('GET / lists endpoints', async () => {
  const res = await fetch(`${baseUrl}/`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.ok(body.endpoints.twilioWebhook)
  assert.ok(body.endpoints.mediaStreams)
})

test('GET /unknown returns 404 JSON', async () => {
  const res = await fetch(`${baseUrl}/nope`)
  assert.equal(res.status, 404)
  assert.equal((await res.json()).error, 'not_found')
})

test('POST /twilio/incoming returns fallback TwiML when GEMINI_API_KEY is missing', async () => {
  const res = await post('/twilio/incoming', {
    CallSid: 'CA123',
    From: '+18055550146',
    To: '+18055550123',
  })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /text\/xml/)
  const text = await res.text()
  assert.match(text, /<Say/)
  assert.match(text, /unavailable/)
  assert.doesNotMatch(text, /<Connect>/)
})

test('POST /twilio/status returns 200', async () => {
  const res = await post('/twilio/status', { CallSid: 'CA123', CallStatus: 'in-progress' })
  assert.equal(res.status, 200)
})
