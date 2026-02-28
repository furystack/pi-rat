import { describe, expect, it } from 'vitest'
import { isPasswordResetPayload } from './settings.js'

describe('isPasswordResetPayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 'newPass',
          confirmPassword: 'newPass',
        }),
      ).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 'newPass',
          confirmPassword: 'newPass',
          extra: 'field',
        }),
      ).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isPasswordResetPayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isPasswordResetPayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isPasswordResetPayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isPasswordResetPayload(42)).toBe(false)
    })
  })

  describe('missing fields', () => {
    it('returns false when currentPassword is missing', () => {
      expect(isPasswordResetPayload({ newPassword: 'new', confirmPassword: 'confirm' })).toBe(false)
    })

    it('returns false when newPassword is missing', () => {
      expect(isPasswordResetPayload({ currentPassword: 'old', confirmPassword: 'confirm' })).toBe(false)
    })

    it('returns false when confirmPassword is missing', () => {
      expect(isPasswordResetPayload({ currentPassword: 'old', newPassword: 'new' })).toBe(false)
    })

    it('returns false when all fields are missing', () => {
      expect(isPasswordResetPayload({})).toBe(false)
    })
  })

  describe('empty string fields', () => {
    it('returns false when currentPassword is empty', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: '',
          newPassword: 'new',
          confirmPassword: 'confirm',
        }),
      ).toBe(false)
    })

    it('returns false when newPassword is empty', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: '',
          confirmPassword: 'confirm',
        }),
      ).toBe(false)
    })

    it('returns false when confirmPassword is empty', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: '',
        }),
      ).toBe(false)
    })
  })

  describe('password mismatch', () => {
    it('returns false when newPassword and confirmPassword do not match', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 'different',
        }),
      ).toBe(false)
    })
  })

  describe('wrong types', () => {
    it('returns false when currentPassword is not a string', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 123,
          newPassword: 'new',
          confirmPassword: 'confirm',
        }),
      ).toBe(false)
    })

    it('returns false when newPassword is not a string', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 123,
          confirmPassword: 'confirm',
        }),
      ).toBe(false)
    })

    it('returns false when confirmPassword is not a string', () => {
      expect(
        isPasswordResetPayload({
          currentPassword: 'old',
          newPassword: 'new',
          confirmPassword: 123,
        }),
      ).toBe(false)
    })
  })
})
