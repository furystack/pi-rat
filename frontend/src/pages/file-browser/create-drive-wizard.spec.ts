import { describe, expect, it } from 'vitest'
import { isAddDrivePayload } from './create-drive-wizard.js'

describe('isAddDrivePayload', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(isAddDrivePayload({ letter: 'C', physicalPath: '/mnt/drive' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isAddDrivePayload({ letter: 'D', physicalPath: '/mnt/storage', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isAddDrivePayload(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isAddDrivePayload(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isAddDrivePayload('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isAddDrivePayload(42)).toBe(false)
    })
  })

  describe('missing or invalid fields', () => {
    it('returns false when letter is missing', () => {
      expect(isAddDrivePayload({ physicalPath: '/mnt/drive' })).toBe(false)
    })

    it('returns false when physicalPath is missing', () => {
      expect(isAddDrivePayload({ letter: 'C' })).toBe(false)
    })

    it('returns false when letter is empty', () => {
      expect(isAddDrivePayload({ letter: '', physicalPath: '/mnt/drive' })).toBe(false)
    })

    it('returns false when physicalPath is empty', () => {
      expect(isAddDrivePayload({ letter: 'C', physicalPath: '' })).toBe(false)
    })

    it('returns false when letter is not a string', () => {
      expect(isAddDrivePayload({ letter: 67, physicalPath: '/mnt/drive' })).toBe(false)
    })

    it('returns false when physicalPath is not a string', () => {
      expect(isAddDrivePayload({ letter: 'C', physicalPath: 123 })).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isAddDrivePayload({})).toBe(false)
    })
  })
})
