import { describe, expect, it } from 'vitest'
import { isOllamaRawFormData, isValidUrl } from './ai-settings.js'

describe('isValidUrl', () => {
  it('returns true for empty string', () => {
    expect(isValidUrl('')).toBe(true)
  })

  it('returns true for valid http URL', () => {
    expect(isValidUrl('http://localhost:11434')).toBe(true)
  })

  it('returns true for valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
  })

  it('returns false for ftp URL', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
  })

  it('returns false for invalid string', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('returns false for malformed URL', () => {
    expect(isValidUrl('http://')).toBe(false)
  })
})

describe('isOllamaRawFormData', () => {
  describe('valid data', () => {
    it('returns true for valid payload with http host', () => {
      expect(isOllamaRawFormData({ host: 'http://localhost:11434' })).toBe(true)
    })

    it('returns true for valid payload with https host', () => {
      expect(isOllamaRawFormData({ host: 'https://ollama.example.com' })).toBe(true)
    })

    it('returns true for empty host', () => {
      expect(isOllamaRawFormData({ host: '' })).toBe(true)
    })

    it('returns true for payload with extra fields', () => {
      expect(isOllamaRawFormData({ host: 'http://localhost:11434', extra: 'field' })).toBe(true)
    })
  })

  describe('primitives and nullish', () => {
    it('returns false for null', () => {
      expect(isOllamaRawFormData(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isOllamaRawFormData(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isOllamaRawFormData('hello')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isOllamaRawFormData(42)).toBe(false)
    })
  })

  describe('missing or invalid host', () => {
    it('returns false when host is missing', () => {
      expect(isOllamaRawFormData({})).toBe(false)
    })

    it('returns false when host is not a string', () => {
      expect(isOllamaRawFormData({ host: 123 })).toBe(false)
    })

    it('returns false when host is invalid URL', () => {
      expect(isOllamaRawFormData({ host: 'not-a-url' })).toBe(false)
    })

    it('returns false when host uses ftp protocol', () => {
      expect(isOllamaRawFormData({ host: 'ftp://example.com' })).toBe(false)
    })
  })
})
