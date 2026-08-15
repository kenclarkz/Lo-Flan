import { GoogleGenAI, Modality } from '@google/genai'
import { config } from '../config.js'
import { buildSystemInstruction } from '../knowledge/business.js'
import logger from '../utils/logger.js'

/**
 * Open a Gemini Live session that speaks/receives audio over a WebSocket.
 *
 * Twilio 8 kHz µ-law audio must be converted to 16 kHz PCM before calling
 * `sendAudio` (see utils/audio.js). Gemini responds with 24 kHz PCM delivered
 * through the `onAudio` callback.
 *
 * @param {{
 *   onAudio: (pcm24k: Buffer) => void,
 *   onInterrupt?: () => void,
 *   onUserTranscript?: (text: string) => void,
 *   onAgentTranscript?: (text: string) => void,
 *   onError?: (err: Error) => void,
 *   onClose?: () => void,
 * }} callbacks
 * @returns {Promise<{ sendAudio: (pcm16: Int16Array) => void, close: () => void }>}
 */
export async function createGeminiLiveSession(callbacks) {
  const { onAudio, onInterrupt, onUserTranscript, onAgentTranscript, onError, onClose } = callbacks

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })

  const session = await ai.live.connect({
    model: config.geminiLiveModel,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: buildSystemInstruction() }] },
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.geminiVoice },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => logger.debug('gemini live session open'),
      onmessage: (message) => {
        const content = message?.serverContent
        if (!content) return

        if (content.interrupted) onInterrupt?.()
        if (content.inputTranscription?.text) {
          onUserTranscript?.(content.inputTranscription.text)
        }
        if (content.outputTranscription?.text) {
          onAgentTranscript?.(content.outputTranscription.text)
        }
        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            const inline = part?.inlineData
            if (inline?.data && inline.mimeType?.startsWith('audio/pcm')) {
              onAudio?.(Buffer.from(inline.data, 'base64'))
            }
          }
        }
      },
      onerror: (err) => {
        logger.error('gemini live error', err?.message ?? err)
        onError?.(err)
      },
      onclose: () => {
        logger.debug('gemini live session closed')
        onClose?.()
      },
    },
  })

  let closed = false

  return {
    sendAudio(pcm16) {
      if (closed) return
      try {
        const data = Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength).toString(
          'base64',
        )
        session
          .sendRealtimeInput({ audio: { data, mimeType: 'audio/pcm;rate=16000' } })
          .catch((err) => logger.error('failed to stream audio to gemini', err))
      } catch (err) {
        logger.error('failed to encode audio for gemini', err)
      }
    },
    close() {
      closed = true
      try {
        session.close()
      } catch (err) {
        logger.debug('error closing gemini session', err)
      }
    },
  }
}
