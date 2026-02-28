import { describe, expect, it } from 'vitest'
import { isChatMessagePayload } from './message-input.js'

describe('isChatMessagePayload', () => {
  it('returns true for valid payload', () => {
    expect(isChatMessagePayload({ content: 'Hello' })).toBe(true)
  })

  it('returns true for payload with extra fields', () => {
    expect(isChatMessagePayload({ content: 'Hello', extra: 123 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isChatMessagePayload(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isChatMessagePayload(undefined)).toBe(false)
  })

  it('returns false for non-object types', () => {
    expect(isChatMessagePayload('string')).toBe(false)
    expect(isChatMessagePayload(42)).toBe(false)
    expect(isChatMessagePayload(true)).toBe(false)
    expect(isChatMessagePayload([])).toBe(false)
  })

  it('returns false when content is missing', () => {
    expect(isChatMessagePayload({})).toBe(false)
  })

  it('returns false when content is empty string', () => {
    expect(isChatMessagePayload({ content: '' })).toBe(false)
  })

  it('returns false when content is whitespace-only', () => {
    expect(isChatMessagePayload({ content: '   ' })).toBe(false)
  })

  it('returns false when content has wrong type', () => {
    expect(isChatMessagePayload({ content: 123 })).toBe(false)
    expect(isChatMessagePayload({ content: null })).toBe(false)
  })
})
