import { describe, expect, it } from 'vitest'
import { isAiMessagePayload } from './ai-chat-input.js'

describe('isAiMessagePayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(isAiMessagePayload({ message: 'Hello' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isAiMessagePayload({ message: 'Hello', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isAiMessagePayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isAiMessagePayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isAiMessagePayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isAiMessagePayload(42)).toBe(false)
    })

    it('returns false for boolean', () => {
      expect(isAiMessagePayload(true)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when message is missing', () => {
      expect(isAiMessagePayload({})).toBe(false)
    })
  })

  describe('wrong types', () => {
    it('returns false when message is not a string', () => {
      expect(isAiMessagePayload({ message: 123 })).toBe(false)
    })

    it('returns false when message is null', () => {
      expect(isAiMessagePayload({ message: null })).toBe(false)
    })

    it('returns false when message is undefined', () => {
      expect(isAiMessagePayload({ message: undefined })).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false when message is whitespace-only', () => {
      expect(isAiMessagePayload({ message: '   ' })).toBe(false)
    })

    it('returns true when message has leading/trailing spaces', () => {
      expect(isAiMessagePayload({ message: '  hello  ' })).toBe(true)
    })
  })
})
