import 'dotenv/config'

const DEFAULT_GREETING =
  "Thanks for calling Lo's Flan! I'm the AI receptionist. How can I help you today?"

const DEFAULT_UNAVAILABLE =
  "Sorry, the AI receptionist is unavailable right now. Please try again later or send us a message through our website."

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function toNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const config = {
  port: toNumber(process.env.PORT, 8080),
  appBaseUrl: (process.env.APP_BASE_URL ?? '').replace(/\/+$/, ''),
  logLevel: process.env.LOG_LEVEL ?? 'info',

  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiLiveModel: process.env.GEMINI_LIVE_MODEL ?? 'gemini-2.5-flash-live-preview',
  geminiVoice: process.env.GEMINI_VOICE ?? 'Puck',

  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  verifySignatures: toBool(process.env.VERIFY_TWILIO_SIGNATURES, false),

  // Shared secret that guards the admin orders API (X-Admin-Key header).
  adminApiKey: process.env.ADMIN_API_KEY ?? '',

  // Where recorded orders/calls are persisted (JSON file).
  ordersFile: process.env.ORDERS_FILE ?? '',

  // PostgreSQL connection string (e.g. postgresql://loflan:loflan_dev@localhost:5432/loflan_orders).
  databaseUrl: process.env.DATABASE_URL ?? '',

  greetingMessage: process.env.GREETING_MESSAGE ?? DEFAULT_GREETING,
  unavailableMessage: process.env.UNAVAILABLE_MESSAGE ?? DEFAULT_UNAVAILABLE,
}

/** Returns `{ ok, missing }` describing which required env vars are missing. */
export function validateConfig() {
  const missing = []
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY')
  return { ok: missing.length === 0, missing }
}
