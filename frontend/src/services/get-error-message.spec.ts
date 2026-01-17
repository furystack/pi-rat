import { describe, it, expect, vi } from 'vitest'
import { ResponseError } from '@furystack/rest-client-fetch'
import { getErrorMessage } from './get-error-message.js'

describe('getErrorMessage', () => {
  describe('ResponseError handling', () => {
    it('should extract message from ResponseError JSON body', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ message: 'Server error message' }),
      } as unknown as Response

      const error = new ResponseError('Error', mockResponse)

      const result = await getErrorMessage(error)

      expect(result).toBe('Server error message')
    })

    it('should fall back to error.toString() when JSON body has no message', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response

      const error = new ResponseError('Fallback error', mockResponse)

      const result = await getErrorMessage(error)

      // ResponseError.toString() returns the error message
      expect(result).toContain('Fallback error')
    })

    it('should fall back to error.toString() when JSON parsing fails', async () => {
      const mockResponse = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response

      const error = new ResponseError('Parse error', mockResponse)

      const result = await getErrorMessage(error)

      // ResponseError.toString() returns the error message
      expect(result).toContain('Parse error')
    })
  })

  describe('Error handling', () => {
    it('should return error message for standard Error', async () => {
      const error = new Error('Standard error message')

      const result = await getErrorMessage(error)

      expect(result).toBe('Standard error message')
    })

    it('should return error message for TypeError', async () => {
      const error = new TypeError('Type error message')

      const result = await getErrorMessage(error)

      expect(result).toBe('Type error message')
    })
  })

  describe('Object handling', () => {
    it('should call toString() for plain objects', async () => {
      const error = { customError: true }

      const result = await getErrorMessage(error)

      expect(result).toBe('[object Object]')
    })

    it('should use custom toString() if defined', async () => {
      const error = {
        toString: () => 'Custom error string',
      }

      const result = await getErrorMessage(error)

      expect(result).toBe('Custom error string')
    })
  })

  describe('String handling', () => {
    it('should return the string directly', async () => {
      const error = 'Simple string error'

      const result = await getErrorMessage(error)

      expect(result).toBe('Simple string error')
    })

    it('should return empty string for empty string error', async () => {
      const error = ''

      const result = await getErrorMessage(error)

      expect(result).toBe('')
    })
  })

  describe('Unknown type handling', () => {
    it('should return "unknown error type" for null', async () => {
      const result = await getErrorMessage(null)

      expect(result).toBe('unknown error type')
    })

    it('should return "unknown error type" for undefined', async () => {
      const result = await getErrorMessage(undefined)

      expect(result).toBe('unknown error type')
    })

    it('should return "unknown error type" for number', async () => {
      const result = await getErrorMessage(42)

      expect(result).toBe('unknown error type')
    })

    it('should return "unknown error type" for boolean', async () => {
      const result = await getErrorMessage(true)

      expect(result).toBe('unknown error type')
    })
  })
})
