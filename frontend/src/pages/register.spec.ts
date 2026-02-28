import { describe, expect, it } from 'vitest'
import { isRegisterPayload } from './register.js'

describe('isRegisterPayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(isRegisterPayload({ userName: 'user', password: 'pass', confirmPassword: 'pass' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(
        isRegisterPayload({
          userName: 'user',
          password: 'pass',
          confirmPassword: 'pass',
          extra: 'field',
        }),
      ).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isRegisterPayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isRegisterPayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isRegisterPayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isRegisterPayload(42)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when userName is missing', () => {
      expect(isRegisterPayload({ password: 'pass', confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when password is missing', () => {
      expect(isRegisterPayload({ userName: 'user', confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when confirmPassword is missing', () => {
      expect(isRegisterPayload({ userName: 'user', password: 'pass' })).toBe(false)
    })

    it('returns false when all fields are missing', () => {
      expect(isRegisterPayload({})).toBe(false)
    })
  })

  describe('empty string fields', () => {
    it('returns false when userName is empty', () => {
      expect(isRegisterPayload({ userName: '', password: 'pass', confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when password is empty', () => {
      expect(isRegisterPayload({ userName: 'user', password: '', confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when confirmPassword is empty', () => {
      expect(isRegisterPayload({ userName: 'user', password: 'pass', confirmPassword: '' })).toBe(false)
    })
  })

  describe('wrong types', () => {
    it('returns false when userName is not a string', () => {
      expect(isRegisterPayload({ userName: 123, password: 'pass', confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when password is not a string', () => {
      expect(isRegisterPayload({ userName: 'user', password: 123, confirmPassword: 'pass' })).toBe(false)
    })

    it('returns false when confirmPassword is not a string', () => {
      expect(isRegisterPayload({ userName: 'user', password: 'pass', confirmPassword: 123 })).toBe(false)
    })
  })

  describe('password mismatch', () => {
    it('returns false when password and confirmPassword do not match', () => {
      expect(isRegisterPayload({ userName: 'user', password: 'pass1', confirmPassword: 'pass2' })).toBe(false)
    })
  })
})
