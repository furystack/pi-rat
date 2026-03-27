import { describe, expect, it } from 'vitest'
import { isTmdbRawFormData } from './tmdb-settings.js'

describe('isTmdbRawFormData', () => {
  describe('valid data', () => {
    it('returns true for valid payload with all fields', () => {
      expect(
        isTmdbRawFormData({
          apiKey: 'test-key',
          defaultLanguage: 'en-US',
          additionalLanguages: 'fr-FR, de-DE',
        }),
      ).toBe(true)
    })

    it('returns true for minimal valid payload', () => {
      expect(isTmdbRawFormData({ apiKey: 'key' })).toBe(true)
    })

    it('returns true for empty apiKey string', () => {
      expect(isTmdbRawFormData({ apiKey: '' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isTmdbRawFormData({ apiKey: 'key', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isTmdbRawFormData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isTmdbRawFormData(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isTmdbRawFormData('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isTmdbRawFormData(42)).toBe(false)
    })
  })

  describe('missing or wrong types', () => {
    it('returns false when apiKey is missing', () => {
      expect(isTmdbRawFormData({ defaultLanguage: 'en-US' })).toBe(false)
    })

    it('returns false when apiKey is not a string', () => {
      expect(isTmdbRawFormData({ apiKey: 123 })).toBe(false)
    })

    it('returns false when apiKey is null', () => {
      expect(isTmdbRawFormData({ apiKey: null })).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isTmdbRawFormData({})).toBe(false)
    })
  })
})
