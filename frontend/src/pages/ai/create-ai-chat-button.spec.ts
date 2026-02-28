import { describe, expect, it } from 'vitest'
import { isCreateAiChatPayload } from './create-ai-chat-button.js'

describe('isCreateAiChatPayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload with required fields only', () => {
      expect(isCreateAiChatPayload({ name: 'My Chat', model: 'gpt-4' })).toBe(true)
    })

    it('returns true for valid payload with description', () => {
      expect(isCreateAiChatPayload({ name: 'My Chat', model: 'gpt-4', description: 'A chat' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 'gpt-4', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isCreateAiChatPayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isCreateAiChatPayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isCreateAiChatPayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isCreateAiChatPayload(42)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when name is missing', () => {
      expect(isCreateAiChatPayload({ model: 'gpt-4' })).toBe(false)
    })

    it('returns false when model is missing', () => {
      expect(isCreateAiChatPayload({ name: 'Chat' })).toBe(false)
    })

    it('returns false when all required fields are missing', () => {
      expect(isCreateAiChatPayload({})).toBe(false)
    })
  })

  describe('wrong types', () => {
    it('returns false when name is not a string', () => {
      expect(isCreateAiChatPayload({ name: 123, model: 'gpt-4' })).toBe(false)
    })

    it('returns false when model is not a string', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 42 })).toBe(false)
    })

    it('returns false when description is not a string or undefined', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 'gpt-4', description: 123 })).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('returns false when name is whitespace-only', () => {
      expect(isCreateAiChatPayload({ name: '   ', model: 'gpt-4' })).toBe(false)
    })

    it('returns false when model is whitespace-only', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: '   ' })).toBe(false)
    })

    it('returns true when description is undefined', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 'gpt-4', description: undefined })).toBe(true)
    })

    it('returns true when description is missing', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 'gpt-4' })).toBe(true)
    })

    it('returns true when description is empty string', () => {
      expect(isCreateAiChatPayload({ name: 'Chat', model: 'gpt-4', description: '' })).toBe(true)
    })
  })
})
