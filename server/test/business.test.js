import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  business,
  buildSystemInstruction,
  buildChatSystemInstruction,
  formatHours,
} from '../src/knowledge/business.js'

test('formatHours renders readable hours', () => {
  const text = formatHours([{ days: 'Tuesday through Friday', time: '9:00 am to 6:00 pm' }])
  assert.equal(text, 'Tuesday through Friday: 9:00 am to 6:00 pm')
})

test('buildSystemInstruction includes business facts and guardrails', () => {
  const prompt = buildSystemInstruction()
  assert.match(prompt, /AI receptionist for Lo's Flan/)
  assert.match(prompt, new RegExp(business.address.replace(/\./g, '\\.')))
  assert.match(prompt, /NEVER invent or guess prices/)
  assert.match(prompt, /the owner will follow up/)
  assert.match(prompt, /you are the AI receptionist/)
  assert.match(prompt, /DO NOT repeat a greeting/)
})

test('buildSystemInstruction includes the menu so the phone AI can take orders', () => {
  const prompt = buildSystemInstruction()
  assert.match(prompt, /Classic Original Flan: \$20/)
  assert.match(prompt, /Chocolate Flan: \$26/)
  assert.match(prompt, /Oreo Flan: \$28/)
  assert.match(prompt, /collect the flavor, quantity/)
})

test('buildSystemInstruction accepts a custom business override', () => {
  const prompt = buildSystemInstruction({
    business: { ...business, name: 'Test Shop', hours: business.hours },
  })
  assert.match(prompt, /Test Shop/)
})

test('buildChatSystemInstruction asks for JSON replies and the menu', () => {
  const prompt = buildChatSystemInstruction()
  assert.match(prompt, /Respond ONLY in valid JSON/)
  assert.match(prompt, /"reply"/)
  assert.match(prompt, /"order"/)
  assert.match(prompt, /Classic Original Flan/)
  assert.match(prompt, /collect the flavor/)
})

test('buildChatSystemInstruction notes when an order was already placed', () => {
  const prompt = buildChatSystemInstruction({ orderPlaced: true })
  assert.match(prompt, /An order has already been placed/)
  const fresh = buildChatSystemInstruction()
  assert.doesNotMatch(fresh, /An order has already been placed/)
})
