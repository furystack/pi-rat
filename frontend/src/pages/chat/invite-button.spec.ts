import { describe, expect, it } from 'vitest'
import { isInvitePayload } from './invite-button.js'

describe('isInvitePayload', () => {
  it('returns true for valid payload', () => {
    expect(isInvitePayload({ userName: 'alice', message: 'Join us!' })).toBe(true)
  })

  it('returns true for payload with extra fields', () => {
    expect(isInvitePayload({ userName: 'alice', message: 'Hi', extra: 123 })).toBe(true)
  })

  it('returns true when message is empty (trimmed length <= 500)', () => {
    expect(isInvitePayload({ userName: 'alice', message: '' })).toBe(true)
  })

  it('returns true when message is at max length (500 chars)', () => {
    expect(isInvitePayload({ userName: 'alice', message: 'x'.repeat(500) })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isInvitePayload(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isInvitePayload(undefined)).toBe(false)
  })

  it('returns false for non-object types', () => {
    expect(isInvitePayload('string')).toBe(false)
    expect(isInvitePayload(42)).toBe(false)
    expect(isInvitePayload(true)).toBe(false)
    expect(isInvitePayload([])).toBe(false)
  })

  it('returns false when userName is missing', () => {
    expect(isInvitePayload({ message: 'Hi' })).toBe(false)
  })

  it('returns false when message is missing', () => {
    expect(isInvitePayload({ userName: 'alice' })).toBe(false)
  })

  it('returns false when userName is empty string', () => {
    expect(isInvitePayload({ userName: '', message: 'Hi' })).toBe(false)
  })

  it('returns false when userName is whitespace-only', () => {
    expect(isInvitePayload({ userName: '   ', message: 'Hi' })).toBe(false)
  })

  it('returns false when message exceeds 500 chars after trim', () => {
    expect(isInvitePayload({ userName: 'alice', message: 'x'.repeat(501) })).toBe(false)
  })

  it('returns false when userName has wrong type', () => {
    expect(isInvitePayload({ userName: 123, message: 'Hi' })).toBe(false)
  })

  it('returns false when message has wrong type', () => {
    expect(isInvitePayload({ userName: 'alice', message: 123 })).toBe(false)
  })
})
