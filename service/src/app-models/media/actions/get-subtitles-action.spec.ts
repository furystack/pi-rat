import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { GetSubtitlesAction } from './get-subtitles-action.js'

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

const mockReaddir = vi.fn()

vi.mock('fs', () => ({
  promises: {
    readdir: (...args: unknown[]) => mockReaddir(...args) as unknown,
  },
}))

describe('GetSubtitlesAction', () => {
  it('should throw 404 when no movie files found', async () => {
    mockFind.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      try {
        await GetSubtitlesAction({
          injector,
          getUrlParams: () => ({ movieId: 'tt9999' }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(404)
      }
    })
  })

  it('should return VTT files from the directory', async () => {
    mockFind.mockResolvedValue([{ driveLetter: 'A', path: 'movies/test.mkv', relatedFiles: [] }])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockReaddir.mockResolvedValue(['test.mkv-subtitle-2.vtt', 'test.mkv-subtitle-3.vtt', 'other.txt'])

    await usingAsync(new Injector(), async (injector) => {
      const result = await GetSubtitlesAction({
        injector,
        getUrlParams: () => ({ movieId: 'tt1234' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(result.chunk).toContain('test.mkv-subtitle-2.vtt')
      expect(result.chunk).toContain('test.mkv-subtitle-3.vtt')
      expect(result.chunk).not.toContain('other.txt')
    })
  })

  it('should include related subtitle files', async () => {
    mockFind.mockResolvedValue([
      {
        driveLetter: 'A',
        path: 'movies/test.mkv',
        relatedFiles: [{ type: 'subtitle', path: 'movies/test.eng.srt' }],
      },
    ])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockReaddir.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      const result = await GetSubtitlesAction({
        injector,
        getUrlParams: () => ({ movieId: 'tt1234' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(result.chunk).toContain('test.eng.srt')
    })
  })

  it('should handle directory read failure gracefully', async () => {
    mockFind.mockResolvedValue([{ driveLetter: 'A', path: 'movies/test.mkv', relatedFiles: [] }])
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockReaddir.mockRejectedValue(new Error('ENOENT'))

    await usingAsync(new Injector(), async (injector) => {
      const result = await GetSubtitlesAction({
        injector,
        getUrlParams: () => ({ movieId: 'tt1234' }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(result.chunk).toHaveLength(0)
    })
  })
})
