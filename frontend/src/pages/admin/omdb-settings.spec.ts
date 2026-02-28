import { describe, expect, it } from 'vitest'
import { isOmdbRawFormData } from './omdb-settings.js'

describe('isOmdbRawFormData', () => {
  describe('valid data', () => {
    it('returns true for valid payload with all fields', () => {
      expect(
        isOmdbRawFormData({
          apiKey: 'test-key',
          trySearchMovieFromTitle: 'on',
          autoDownloadMetadata: 'on',
        }),
      ).toBe(true)
    })

    it('returns true for minimal valid payload', () => {
      expect(isOmdbRawFormData({ apiKey: 'key' })).toBe(true)
    })

    it('returns true for empty apiKey string', () => {
      expect(isOmdbRawFormData({ apiKey: '' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isOmdbRawFormData({ apiKey: 'key', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isOmdbRawFormData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isOmdbRawFormData(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isOmdbRawFormData('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isOmdbRawFormData(42)).toBe(false)
    })
  })

  describe('missing or wrong types', () => {
    it('returns false when apiKey is missing', () => {
      expect(isOmdbRawFormData({ trySearchMovieFromTitle: 'on' })).toBe(false)
    })

    it('returns false when apiKey is not a string', () => {
      expect(isOmdbRawFormData({ apiKey: 123 })).toBe(false)
    })

    it('returns false when apiKey is null', () => {
      expect(isOmdbRawFormData({ apiKey: null })).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isOmdbRawFormData({})).toBe(false)
    })
  })
})
