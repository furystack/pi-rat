import { describe, expect, it } from 'vitest'
import { isStreamingRawFormData } from './streaming-settings.js'

describe('isStreamingRawFormData', () => {
  describe('valid data', () => {
    it('returns true for valid payload with all fields', () => {
      expect(
        isStreamingRawFormData({
          preset: 'medium',
          threads: '4',
          autoExtractSubtitles: 'on',
          fullSyncOnStartup: 'on',
          watchFiles: 'all',
        }),
      ).toBe(true)
    })

    it('returns true for minimal valid payload', () => {
      expect(isStreamingRawFormData({ threads: '1' })).toBe(true)
    })

    it('returns true for threads at upper bound', () => {
      expect(isStreamingRawFormData({ threads: '64' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isStreamingRawFormData({ preset: 'fast', threads: '8', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isStreamingRawFormData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isStreamingRawFormData(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isStreamingRawFormData('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isStreamingRawFormData(42)).toBe(false)
    })
  })

  describe('missing or invalid threads', () => {
    it('returns false when threads is missing', () => {
      expect(isStreamingRawFormData({ preset: 'medium' })).toBe(false)
    })

    it('returns false when threads is not a string', () => {
      expect(isStreamingRawFormData({ preset: 'medium', threads: 4 })).toBe(false)
    })

    it('returns false when threads is NaN', () => {
      expect(isStreamingRawFormData({ preset: 'medium', threads: 'abc' })).toBe(false)
    })

    it('returns false when threads is below 1', () => {
      expect(isStreamingRawFormData({ preset: 'medium', threads: '0' })).toBe(false)
    })

    it('returns false when threads is above 64', () => {
      expect(isStreamingRawFormData({ preset: 'medium', threads: '65' })).toBe(false)
    })

    it('returns true when threads is exactly 1', () => {
      expect(isStreamingRawFormData({ threads: '1' })).toBe(true)
    })
  })
})
