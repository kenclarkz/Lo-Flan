import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mulawDecode,
  mulawEncode,
  createLinearResampler,
  createMulawToPcm16,
  createPcm24kToMulaw8k,
} from '../src/utils/audio.js'

test('mulawDecode: silence (0xff) decodes to 0', () => {
  assert.equal(mulawDecode(Buffer.from([0xff]))[0], 0)
})

test('mulawDecode: known value 0x00 decodes to -32124', () => {
  assert.equal(mulawDecode(Buffer.from([0x00]))[0], -32124)
})

test('mulawEncode: silence (0) encodes to 0xff', () => {
  assert.equal(mulawEncode(new Int16Array([0]))[0], 0xff)
})

test('mulaw round-trip is lossless for every byte (except the known 0x7f zero edge)', () => {
  // G.711 has two encodings for signed zero (0xff and 0x7f); decoding 0x7f
  // yields 0 which re-encodes as 0xff. That is inherent to the codec.
  const input = Buffer.from(Array.from({ length: 256 }, (_, i) => i))
  const pcm = mulawDecode(input)
  const out = mulawEncode(pcm)
  for (let i = 0; i < 256; i++) {
    if (i === 0x7f) continue
    assert.equal(out[i], i, `byte ${i} should round-trip`)
  }
  assert.equal(out[0x7f], 0xff)
})

test('createLinearResampler: doubles the length at 2x', () => {
  const resample = createLinearResampler(8000, 16000)
  const input = new Int16Array(160).fill(1000)
  const out = resample(input)
  assert.equal(out.length, 320)
  assert.ok(out.every((v) => v === 1000), 'constant signal stays constant')
})

test('createLinearResampler: third of the length at 3x', () => {
  const resample = createLinearResampler(24000, 8000)
  const input = new Int16Array(2880).fill(-500)
  const out = resample(input)
  assert.equal(out.length, 960)
  assert.ok(out.every((v) => v === -500), 'constant signal stays constant')
})

test('createLinearResampler: stays continuous across chunks', () => {
  const resample = createLinearResampler(8000, 16000)
  let total = 0
  for (let i = 0; i < 10; i++) {
    total += resample(new Int16Array(160).fill(i * 100)).length
  }
  assert.equal(total, 3200, '10 chunks of 160 -> 10 chunks of 320')
})

test('createMulawToPcm16: silence payload -> zeros at 16 kHz', () => {
  const convert = createMulawToPcm16()
  const silence = Buffer.alloc(160, 0xff).toString('base64') // 20ms of silence
  const out = convert(silence)
  assert.equal(out.length, 320)
  assert.ok(out.every((v) => v === 0))
})

test('createPcm24kToMulaw8k: silence PCM -> mulaw silence bytes', () => {
  const convert = createPcm24kToMulaw8k()
  const out = convert(new Int16Array(2880).fill(0))
  assert.equal(out.length, 960)
  assert.ok(out.every((b) => b === 0xff), 'silence stays silence')
})
