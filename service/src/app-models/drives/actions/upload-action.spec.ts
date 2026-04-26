import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { UploadAction } from './upload-action.js'

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
  defineDataSet: ({ store }: { store: unknown }) => store,
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockDataSetGet(...args) as unknown,
  }),
}))

// Mock getLogger
vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

// Mock existsAsync
const mockExistsAsync = vi.fn()

vi.mock('../../../utils/exists-async.js', () => ({
  existsAsync: (...args: unknown[]) => mockExistsAsync(...args) as unknown,
}))

// Mock formidable - this is complex, so we test authorization and drive lookup only
vi.mock('formidable', () => {
  class MockIncomingForm {
    on = vi.fn()
    parse = vi.fn((_req: unknown, callback: (err: Error | null, fields: object, files: object) => void) => {
      callback(null, {}, { file: [{ originalFilename: 'test.txt', newFilename: 'test.txt' }] })
    })
  }
  return { IncomingForm: MockIncomingForm }
})

// Mock createDirentListFromFiles
vi.mock('../create-dirent-list-from-files.js', () => ({
  createDirentListFromFiles: () => [{ name: 'test.txt', isDirectory: false, isFile: true }],
}))

describe('UploadAction', () => {
  it('should throw 401 when user is not authorized', async () => {
    mockIsAuthorized.mockResolvedValue(false)

    await usingAsync(new Injector(), async (injector) => {
      try {
        await UploadAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'folder' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
          getBody: async () => ({}),
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
        await UploadAction({
          injector,
          getUrlParams: () => ({ letter: 'X', path: 'folder' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
          getBody: async () => ({}),
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(404)
        expect((error as RequestError).message).toContain('not found')
      }
    })
  })

  it('should throw 400 when target path does not exist', async () => {
    mockIsAuthorized.mockResolvedValue(true)
    mockDataSetGet.mockResolvedValue({ physicalPath: '/media/storage', letter: 'A' })
    mockExistsAsync.mockResolvedValue(false)

    await usingAsync(new Injector(), async (injector) => {
      try {
        await UploadAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'nonexistent' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
          getBody: async () => ({}),
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toContain('does not exist')
      }
    })
  })

  it('should upload file successfully', async () => {
    mockIsAuthorized.mockResolvedValue(true)
    mockDataSetGet.mockResolvedValue({ physicalPath: '/media/storage', letter: 'A' })
    mockExistsAsync.mockResolvedValue(true)

    await usingAsync(new Injector(), async (injector) => {
      const result = await UploadAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'folder' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
        getBody: async () => ({}),
      })

      expect(result.chunk).toHaveProperty('success', true)
      expect(result.chunk).toHaveProperty('entries')
    })
  })
})
