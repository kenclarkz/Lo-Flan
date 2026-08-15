// G.711 µ-law <-> 16-bit linear PCM conversion and linear resampling.
//
// Twilio Media Streams delivers audio as base64 `audio/x-mulaw` at 8000 Hz.
// Gemini Live expects 16-bit little-endian PCM at 16 kHz for input and
// returns 16-bit little-endian PCM at 24 kHz for output. This module bridges
// those formats.

const BIAS = 0x84 // 132
const CLIP = 32635
const SEG_END = [0xff, 0x1ff, 0x3ff, 0x7ff, 0xfff, 0x1fff, 0x3fff, 0x7fff]

/**
 * Decode a Buffer of µ-law bytes into an Int16Array of linear PCM samples.
 * @param {Buffer} mulaw
 * @returns {Int16Array}
 */
export function mulawDecode(mulaw) {
  const out = new Int16Array(mulaw.length)
  for (let i = 0; i < mulaw.length; i++) {
    const u = ~mulaw[i]
    let t = ((u & 0x0f) << 3) + BIAS
    t <<= (u & 0x70) >> 4
    out[i] = u & 0x80 ? BIAS - t : t - BIAS
  }
  return out
}

/**
 * Encode an Int16Array of linear PCM samples into a Buffer of µ-law bytes.
 * @param {Int16Array|number[]} pcm
 * @returns {Buffer}
 */
export function mulawEncode(pcm) {
  const out = Buffer.alloc(pcm.length)
  for (let i = 0; i < pcm.length; i++) {
    let sample = pcm[i]
    const sign = (sample >> 8) & 0x80
    if (sign !== 0) sample = -sample
    if (sample > CLIP) sample = CLIP
    sample += BIAS
    let exponent = 7
    for (let e = 0; e < 8; e++) {
      if (sample <= SEG_END[e]) {
        exponent = e
        break
      }
    }
    const mantissa = (sample >> (exponent + 3)) & 0x0f
    out[i] = ~(sign | (exponent << 4) | mantissa)
  }
  return out
}

/**
 * Stateful linear-interpolation resampler.
 *
 * Returns a function that converts successive chunks of Int16 PCM from
 * `inputRate` to `outputRate`, keeping a small overlap buffer so sample
 * positions stay continuous across chunk boundaries.
 *
 * @param {number} inputRate
 * @param {number} outputRate
 * @returns {(input: Int16Array) => Int16Array}
 */
export function createLinearResampler(inputRate, outputRate) {
  const step = inputRate / outputRate
  const carryLen = Math.ceil(step) + 1
  let buf = new Int16Array(0)
  let pos = 0

  return function resample(input) {
    if (!input || input.length === 0) return new Int16Array(0)

    const work = new Int16Array(buf.length + input.length)
    work.set(buf, 0)
    work.set(input, buf.length)
    const n = work.length

    const nOut = Math.max(0, Math.floor((n - pos) / step))
    const out = new Int16Array(nOut)
    for (let o = 0; o < nOut; o++) {
      const p = pos + o * step
      const i0 = Math.floor(p)
      const i1 = Math.min(i0 + 1, n - 1)
      const frac = p - i0
      const v = work[i0] * (1 - frac) + work[i1] * frac
      out[o] = Math.max(-32768, Math.min(32767, Math.round(v)))
    }

    const consumed = pos + nOut * step
    const carryStart = Math.max(0, n - carryLen)
    buf = work.slice(carryStart)
    pos = Math.min(consumed - n + carryLen, buf.length)
    return out
  }
}

/**
 * Build a stateful converter from Twilio µ-law base64 payloads (8 kHz) to
 * Int16 PCM at 16 kHz. Keep one instance per call for continuous resampling.
 * @returns {(base64Payload: string) => Int16Array}
 */
export function createMulawToPcm16() {
  const upsample = createLinearResampler(8000, 16000)
  return function convert(base64Payload) {
    const mulaw = Buffer.from(base64Payload, 'base64')
    return upsample(mulawDecode(mulaw))
  }
}

/**
 * Build a stateful converter from Int16 PCM at 24 kHz to a µ-law Buffer at
 * 8 kHz. Accepts either a Buffer of raw little-endian PCM bytes or an
 * Int16Array of samples. Keep one instance per call for continuous resampling.
 * @returns {(pcm24k: Buffer | Int16Array) => Buffer}
 */
export function createPcm24kToMulaw8k() {
  const downsample = createLinearResampler(24000, 8000)
  return function convert(pcm24k) {
    const samples =
      pcm24k instanceof Buffer
        ? new Int16Array(pcm24k.buffer, pcm24k.byteOffset, pcm24k.byteLength / 2)
        : pcm24k
    return mulawEncode(downsample(samples))
  }
}
