import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildIncomingCallTwiML,
  buildUnavailableTwiML,
  escapeXml,
} from '../src/utils/twiml.js'

test('escapeXml escapes special characters', () => {
  assert.equal(escapeXml(`a & b <c> "d" 'e'`), `a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;`)
})

test('buildIncomingCallTwiML includes greeting and stream URL', () => {
  const twiml = buildIncomingCallTwiML({
    greeting: "Thanks for calling Lo's Flan! I'm the AI receptionist. How can I help you today?",
    streamUrl: 'wss://example.ngrok-free.app/media-stream',
    callSid: 'CA123',
  })
  assert.match(
    twiml,
    /<Say voice="Google\.en-US-Neural2-J">Thanks for calling Lo&apos;s Flan! I&apos;m the AI receptionist\. How can I help you today\?<\/Say>/,
  )
  assert.match(twiml, /<Stream url="wss:\/\/example\.ngrok-free\.app\/media-stream">/)
  assert.match(twiml, /<Parameter name="callSid" value="CA123"\/>/)
})

test('buildIncomingCallTwiML escapes user-controlled text', () => {
  const twiml = buildIncomingCallTwiML({
    greeting: 'a & b <c>',
    streamUrl: 'wss://example.com/media-stream',
  })
  assert.match(twiml, /a &amp; b &lt;c&gt;/)
})

test('buildUnavailableTwiML returns a Say with the message', () => {
  const twiml = buildUnavailableTwiML('Sorry, unavailable.')
  assert.match(twiml, /<Say voice="Google\.en-US-Neural2-J">Sorry, unavailable\.<\/Say>/)
})
