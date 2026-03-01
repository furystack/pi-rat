import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { GetSubtitleFileAction } from './get-subtitle-file-action.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const mockFind = vi.fn()
const mockGet = vi.fn()

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    find: (...args: unknown[]) => mockFind(...args) as unknown,
    get: (...args: unknown[]) => mockGet(...args) as unknown,
  }),
}))

const mockStat = vi.fn()

vi.mock('fs/promises', () => ({
  stat: (...args: unknown[]) => mockStat(...args) as unknown,
}))

vi.mock('fs', () => ({
  createReadStream: () => ({ pipe: vi.fn() }),
}))

describe('GetSubtitleFileAction', () => {
  it('should throw 404 when no movie files found', async () => {
    mockFind.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      try {
        await GetSubtitleFileAction({
          injector,
          getUrlParams: () => ({ movieId: 'tt9999', subtitleName: 'test.vtt' }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(404)
      }
    })
  })

  it('should throw 400 for path traversal attempt', async () => {
    mockFind.mockResolvedValue([{ driveLetter: 'A', path: 'movies/test.mkv' }])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })

    await usingAsync(new Injector(), async (injector) => {
      try {
        await GetSubtitleFileAction({
          injector,
          getUrlParams: () => ({ movieId: 'tt1234', subtitleName: '../../etc/passwd' }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toBe('Invalid subtitle path')
      }
    })
  })

  it('should serve VTT file with correct content type', async () => {
    mockFind.mockResolvedValue([{ driveLetter: 'A', path: 'movies/test.mkv' }])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockStat.mockResolvedValue({ size: 1024 })

    const writeHead = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      await GetSubtitleFileAction({
        injector,
        getUrlParams: () => ({ movieId: 'tt1234', subtitleName: 'test-subtitle-2.vtt' }),
        response: { writeHead, end: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'Content-Type': 'text/vtt' }))
    })
  })

  it('should throw 404 when subtitle file not found on disk', async () => {
    mockFind.mockResolvedValue([{ driveLetter: 'A', path: 'movies/test.mkv' }])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockStat.mockRejectedValue(new Error('ENOENT'))

    await usingAsync(new Injector(), async (injector) => {
      try {
        await GetSubtitleFileAction({
          injector,
          getUrlParams: () => ({ movieId: 'tt1234', subtitleName: 'nonexistent.vtt' }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(404)
      }
    })
  })
})
