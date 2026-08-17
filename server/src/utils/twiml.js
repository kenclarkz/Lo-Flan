// TwiML document builders.
//
// The incoming-call webhook returns one of two documents:
//   1. buildIncomingCallTwiML() — plays the greeting, then opens a
//      bidirectional Media Stream to the WebSocket bridge.
//   2. buildUnavailableTwiML() — a graceful fallback when the AI can't start.

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * @param {{ greeting: string, streamUrl: string, callSid?: string, from?: string }} opts
 * @returns {string} TwiML XML
 */
export function buildIncomingCallTwiML({ greeting, streamUrl, callSid, from }) {
  const params = []
  if (callSid) params.push(`\n    <Parameter name="callSid" value="${escapeXml(callSid)}"/>`)
  if (from) params.push(`\n    <Parameter name="from" value="${escapeXml(from)}"/>`)
  const paramBlock = params.join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.en-US-Neural2-J">${escapeXml(greeting)}</Say>
  <Connect>
    <Stream url="${escapeXml(streamUrl)}">${paramBlock}
    </Stream>
  </Connect>
</Response>
`
}

/**
 * @param {string} message
 * @returns {string} TwiML XML
 */
export function buildUnavailableTwiML(message) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.en-US-Neural2-J">${escapeXml(message)}</Say>
</Response>
`
}
