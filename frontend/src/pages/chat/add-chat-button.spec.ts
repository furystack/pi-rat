import { describe, expect, it } from 'vitest'
import { isAddChatPayload } from './add-chat-button.js'

describe('isAddChatPayload', () => {
  it('returns true for valid payload with name and description', () => {
    expect(isAddChatPayload({ name: 'Chat', description: 'My chat' })).toBe(true)
  })

  it('returns true for valid payload with name only (optional description)', () => {
    expect(isAddChatPayload({ name: 'Chat' })).toBe(true)
  })

  it('returns true for payload with extra fields', () => {
    expect(isAddChatPayload({ name: 'Chat', description: 'Desc', extra: 123 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isAddChatPayload(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isAddChatPayload(undefined)).toBe(false)
  })

  it('returns false for non-object types', () => {
    expect(isAddChatPayload('string')).toBe(false)
    expect(isAddChatPayload(42)).toBe(false)
    expect(isAddChatPayload(true)).toBe(false)
    expect(isAddChatPayload([])).toBe(false)
  })

  it('returns false when name is missing', () => {
    expect(isAddChatPayload({ description: 'Desc' })).toBe(false)
  })

  it('returns false when name is empty string', () => {
    expect(isAddChatPayload({ name: '' })).toBe(false)
  })

  it('returns false when name has wrong type', () => {
    expect(isAddChatPayload({ name: 123 })).toBe(false)
    expect(isAddChatPayload({ name: null })).toBe(false)
  })

  it('returns false when description has wrong type', () => {
    expect(isAddChatPayload({ name: 'Chat', description: 123 })).toBe(false)
  })

  it('returns true when description is empty string', () => {
    expect(isAddChatPayload({ name: 'Chat', description: '' })).toBe(true)
  })
})
