import { describe, expect, it } from 'vitest'
import {
  MAX_PING_INTERVAL_MS,
  MAX_PING_TIMEOUT_MS,
  MIN_PING_INTERVAL_MS,
  MIN_PING_TIMEOUT_MS,
  isIotRawFormData,
  validateIotForm,
} from './iot-settings.js'

describe('validateIotForm', () => {
  it('returns null for valid data', () => {
    expect(validateIotForm({ pingIntervalMs: '30000', pingTimeoutMs: '3000' })).toBe(null)
  })

  it('returns error when ping interval is below minimum', () => {
    expect(validateIotForm({ pingIntervalMs: '999', pingTimeoutMs: '100' })).toBe(
      `Ping interval must be at least ${MIN_PING_INTERVAL_MS}ms`,
    )
  })

  it('returns error when ping interval is NaN', () => {
    expect(validateIotForm({ pingIntervalMs: 'abc', pingTimeoutMs: '100' })).toBe(
      `Ping interval must be at least ${MIN_PING_INTERVAL_MS}ms`,
    )
  })

  it('returns error when ping interval exceeds maximum', () => {
    expect(validateIotForm({ pingIntervalMs: '3600001', pingTimeoutMs: '100' })).toBe(
      `Ping interval must be at most ${MAX_PING_INTERVAL_MS}ms (1 hour)`,
    )
  })

  it('returns error when ping timeout is below minimum', () => {
    expect(validateIotForm({ pingIntervalMs: '10000', pingTimeoutMs: '99' })).toBe(
      `Ping timeout must be at least ${MIN_PING_TIMEOUT_MS}ms`,
    )
  })

  it('returns error when ping timeout is NaN', () => {
    expect(validateIotForm({ pingIntervalMs: '10000', pingTimeoutMs: 'xyz' })).toBe(
      `Ping timeout must be at least ${MIN_PING_TIMEOUT_MS}ms`,
    )
  })

  it('returns error when ping timeout exceeds maximum', () => {
    expect(validateIotForm({ pingIntervalMs: '120000', pingTimeoutMs: '60001' })).toBe(
      `Ping timeout must be at most ${MAX_PING_TIMEOUT_MS}ms (1 minute)`,
    )
  })

  it('returns error when timeout is not less than interval', () => {
    expect(validateIotForm({ pingIntervalMs: '5000', pingTimeoutMs: '5000' })).toBe(
      'Ping timeout must be less than ping interval',
    )
  })

  it('returns error when timeout exceeds interval', () => {
    expect(validateIotForm({ pingIntervalMs: '5000', pingTimeoutMs: '10000' })).toBe(
      'Ping timeout must be less than ping interval',
    )
  })
})

describe('isIotRawFormData', () => {
  describe('valid data', () => {
    it('returns true for valid payload', () => {
      expect(isIotRawFormData({ pingIntervalMs: '30000', pingTimeoutMs: '3000' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isIotRawFormData({ pingIntervalMs: '30000', pingTimeoutMs: '3000', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isIotRawFormData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isIotRawFormData(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isIotRawFormData('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isIotRawFormData(42)).toBe(false)
    })
  })

  describe('missing or wrong types', () => {
    it('returns false when pingIntervalMs is missing', () => {
      expect(isIotRawFormData({ pingTimeoutMs: '3000' })).toBe(false)
    })

    it('returns false when pingTimeoutMs is missing', () => {
      expect(isIotRawFormData({ pingIntervalMs: '30000' })).toBe(false)
    })

    it('returns false when pingIntervalMs is not a string', () => {
      expect(isIotRawFormData({ pingIntervalMs: 30000, pingTimeoutMs: '3000' })).toBe(false)
    })

    it('returns false when pingTimeoutMs is not a string', () => {
      expect(isIotRawFormData({ pingIntervalMs: '30000', pingTimeoutMs: 3000 })).toBe(false)
    })
  })

  describe('validation failures', () => {
    it('returns false when interval is below minimum', () => {
      expect(isIotRawFormData({ pingIntervalMs: '999', pingTimeoutMs: '100' })).toBe(false)
    })

    it('returns false when timeout exceeds interval', () => {
      expect(isIotRawFormData({ pingIntervalMs: '5000', pingTimeoutMs: '5000' })).toBe(false)
    })
  })
})
