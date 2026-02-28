import { describe, expect, it } from 'vitest'
import { isCreateAdminPayload } from './create-admin-step.js'

describe('isCreateAdminPayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(
        isCreateAdminPayload({
          userName: 'admin@test.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        }),
      ).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(
        isCreateAdminPayload({
          userName: 'admin@test.com',
          password: 'secret123',
          confirmPassword: 'secret123',
          extra: 'field',
        }),
      ).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isCreateAdminPayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isCreateAdminPayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isCreateAdminPayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isCreateAdminPayload(42)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when userName is missing', () => {
      expect(isCreateAdminPayload({ password: 'secret123', confirmPassword: 'secret123' })).toBe(false)
    })

    it('returns false when password is missing', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', confirmPassword: 'secret123' })).toBe(false)
    })

    it('returns false when confirmPassword is missing', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', password: 'secret123' })).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isCreateAdminPayload({})).toBe(false)
    })
  })

  describe('empty string fields', () => {
    it('returns false when userName is empty', () => {
      expect(isCreateAdminPayload({ userName: '', password: 'secret123', confirmPassword: 'secret123' })).toBe(false)
    })

    it('returns false when password is empty', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', password: '', confirmPassword: 'secret123' })).toBe(
        false,
      )
    })

    it('returns false when confirmPassword is empty', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', password: 'secret123', confirmPassword: '' })).toBe(
        false,
      )
    })
  })

  describe('wrong types', () => {
    it('returns false when userName is not a string', () => {
      expect(isCreateAdminPayload({ userName: 123, password: 'secret123', confirmPassword: 'secret123' })).toBe(false)
    })

    it('returns false when password is not a string', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', password: 123, confirmPassword: 'secret123' })).toBe(
        false,
      )
    })

    it('returns false when confirmPassword is not a string', () => {
      expect(isCreateAdminPayload({ userName: 'admin@test.com', password: 'secret123', confirmPassword: 123 })).toBe(
        false,
      )
    })
  })

  describe('password mismatch', () => {
    it('returns false when password and confirmPassword do not match', () => {
      expect(
        isCreateAdminPayload({
          userName: 'admin@test.com',
          password: 'secret123',
          confirmPassword: 'different',
        }),
      ).toBe(false)
    })
  })
})
