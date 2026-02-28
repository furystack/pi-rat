import { describe, expect, it } from 'vitest'
import { isLoginPayload } from './login.js'

describe('isLoginPayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(isLoginPayload({ userName: 'user@test.com', password: 'secret' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isLoginPayload({ userName: 'user@test.com', password: 'secret', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isLoginPayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isLoginPayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isLoginPayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isLoginPayload(42)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when userName is missing', () => {
      expect(isLoginPayload({ password: 'secret' })).toBe(false)
    })

    it('returns false when password is missing', () => {
      expect(isLoginPayload({ userName: 'user@test.com' })).toBe(false)
    })

    it('returns false when all fields are missing', () => {
      expect(isLoginPayload({})).toBe(false)
    })
  })

  describe('empty string fields', () => {
    it('returns false when userName is empty', () => {
      expect(isLoginPayload({ userName: '', password: 'secret' })).toBe(false)
    })

    it('returns false when password is empty', () => {
      expect(isLoginPayload({ userName: 'user@test.com', password: '' })).toBe(false)
    })
  })

  describe('wrong types', () => {
    it('returns false when userName is not a string', () => {
      expect(isLoginPayload({ userName: 123, password: 'secret' })).toBe(false)
    })

    it('returns false when password is not a string', () => {
      expect(isLoginPayload({ userName: 'user', password: 123 })).toBe(false)
    })

    it('returns false when userName is null', () => {
      expect(isLoginPayload({ userName: null, password: 'secret' })).toBe(false)
    })

    it('returns false when password is undefined', () => {
      expect(isLoginPayload({ userName: 'user', password: undefined })).toBe(false)
    })
  })
})
