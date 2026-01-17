import { describe, it, expect } from 'vitest'
import { encode, decode } from './url-encode-decode.js'

describe('url-encode-decode', () => {
  describe('encode', () => {
    it('should encode a simple string', () => {
      const encoded = encode('hello')
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode an object', () => {
      const encoded = encode({ foo: 'bar' })
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode a number', () => {
      const encoded = encode(42)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode a boolean', () => {
      const encoded = encode(true)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode null', () => {
      const encoded = encode(null)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should encode an array', () => {
      const encoded = encode([1, 2, 3])
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should produce URL-safe output', () => {
      const encoded = encode({ complex: 'value with spaces & special=chars' })
      // URL-safe characters should not need further encoding
      expect(encoded).not.toContain(' ')
      expect(encoded).not.toContain('&')
      expect(encoded).not.toContain('=')
    })
  })

  describe('decode', () => {
    it('should decode back to a simple string', () => {
      const original = 'hello'
      const encoded = encode(original)
      const decoded = decode<string>(encoded)
      expect(decoded).toBe(original)
    })

    it('should decode back to an object', () => {
      const original = { foo: 'bar', baz: 123 }
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should decode back to a number', () => {
      const original = 42
      const encoded = encode(original)
      const decoded = decode<number>(encoded)
      expect(decoded).toBe(original)
    })

    it('should decode back to a boolean', () => {
      const original = true
      const encoded = encode(original)
      const decoded = decode<boolean>(encoded)
      expect(decoded).toBe(original)
    })

    it('should decode back to null', () => {
      const encoded = encode(null)
      const decoded = decode<null>(encoded)
      expect(decoded).toBeNull()
    })

    it('should decode back to an array', () => {
      const original = [1, 2, 3, 'four']
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })
  })

  describe('roundtrip', () => {
    it('should handle unicode characters', () => {
      const original = { message: 'Hello 世界' }
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should handle emoji', () => {
      const original = { foo: 'bar😉' }
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should handle complex nested objects', () => {
      const original = {
        user: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: [1, 2, { nested: 'value' }],
      }
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should handle special characters', () => {
      const original = {
        query: 'search?q=test&page=1',
        path: '/folder/file.txt',
        special: '<script>alert("xss")</script>',
      }
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should handle empty string', () => {
      const original = ''
      const encoded = encode(original)
      const decoded = decode<string>(encoded)
      expect(decoded).toBe(original)
    })

    it('should handle empty object', () => {
      const original = {}
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })

    it('should handle empty array', () => {
      const original: unknown[] = []
      const encoded = encode(original)
      const decoded = decode<typeof original>(encoded)
      expect(decoded).toEqual(original)
    })
  })
})
