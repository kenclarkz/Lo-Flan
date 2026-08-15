import { createGeminiLiveSession } from './geminiLive.js'

/**
 * Factory for the AI conversation session used by the Media Stream bridge.
 *
 * Stage 1 ships a single provider (Gemini Live — free tier via Google AI
 * Studio). To add another provider later (e.g. OpenAI Realtime), implement
 * the same session interface and switch on an env var here:
 *
 *   { aiProvider: 'gemini-live' }     -> createGeminiLiveSession(callbacks)
 *   { aiProvider: 'openai-realtime' } -> createOpenAiRealtimeSession(callbacks)
 *
 * Session interface:
 *   sendAudio(pcm16: Int16Array) — 16 kHz PCM caller audio into the model
 *   close()
 *
 * @param {object} callbacks See geminiLive.js for the callback shape.
 * @returns {Promise<{ sendAudio: Function, close: Function }>}
 */
export async function createConversationSession(callbacks) {
  return createGeminiLiveSession(callbacks)
}
