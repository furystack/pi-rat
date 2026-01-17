import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { DeleteFileAction } from './delete-file-action.js'

// Mock isAuthorized
const mockIsAuthorized = vi.fn()

vi.mock('@furystack/core', () => {
  return {
    isAuthorized: (...args: unknown[]) => mockIsAuthorized(...args) as unknown,
  }
})

// Mock getDataSetFor
const mockDataSetGet = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockDataSetGet(...args) as unknown,
  }),
}))

// Mock fs/promises unlink
const mockUnlink = vi.fn()

vi.mock('fs/promises', () => ({
  unlink: (...args: unknown[]) => mockUnlink(...args) as unknown,
}))

describe('DeleteFileAction', () => {
  it('should throw 401 when user is not authorized', async () => {
    mockIsAuthorized.mockResolvedValue(false)

    await usingAsync(new Injector(), async (injector) => {
      try {
        await DeleteFileAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.txt' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(401)
        expect((error as RequestError).message).toBe('Unauthorized')
      }
    })
  })

  it('should throw 404 when drive is not found', async () => {
    mockIsAuthorized.mockResolvedValue(true)
    mockDataSetGet.mockResolvedValue(null)

    await usingAsync(new Injector(), async (injector) => {
      try {
        await DeleteFileAction({
          injector,
          getUrlParams: () => ({ letter: 'X', path: 'test.txt' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(404)
        expect((error as RequestError).message).toBe('Drive not found')
      }
    })
  })

  it('should delete file successfully', async () => {
    mockIsAuthorized.mockResolvedValue(true)
    mockDataSetGet.mockResolvedValue({ physicalPath: '/media/storage', letter: 'A' })
    mockUnlink.mockResolvedValue(undefined)

    await usingAsync(new Injector(), async (injector) => {
      const result = await DeleteFileAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'folder/test.txt' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('test.txt'))
      expect(result.chunk).toEqual({ success: true })
    })
  })

  it('should propagate unlink errors', async () => {
    mockIsAuthorized.mockResolvedValue(true)
    mockDataSetGet.mockResolvedValue({ physicalPath: '/media/storage', letter: 'A' })
    mockUnlink.mockRejectedValue(new Error('ENOENT: file not found'))

    await usingAsync(new Injector(), async (injector) => {
      await expect(
        DeleteFileAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'nonexistent.txt' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        }),
      ).rejects.toThrow('ENOENT')
    })
  })
})
