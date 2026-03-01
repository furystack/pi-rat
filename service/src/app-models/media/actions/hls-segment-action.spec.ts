import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { HlsSegmentAction } from './hls-segment-action.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
  }),
}))

const mockSpawn = vi.fn()

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args) as unknown,
}))

describe('HlsSegmentAction', () => {
  it('should serve cached segment without spawning ffmpeg', async () => {
    const mockCachedStream = { pipe: vi.fn() }
    const writeHead = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      const { SegmentCache } = await import('../services/segment-cache.js')
      const cache = injector.getInstance(SegmentCache)
      cache.get = vi.fn().mockResolvedValue(mockCachedStream) as never

      await HlsSegmentAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '0' }),
        getQuery: () => ({ mode: 'remux', from: 0, to: 10 }),
        response: { writeHead, on: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'Cache-Control': 'public, max-age=3600' }))
      expect(mockCachedStream.pipe).toHaveBeenCalled()
      expect(mockSpawn).not.toHaveBeenCalled()
    })
  })

  it('should spawn ffmpeg when no cached segment exists', async () => {
    const mockStdout = { on: vi.fn(), pipe: vi.fn() }
    const mockStderr = { on: vi.fn() }
    const mockProcess = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockProcess)

    await usingAsync(new Injector(), async (injector) => {
      const { SegmentCache } = await import('../services/segment-cache.js')
      const cache = injector.getInstance(SegmentCache)
      cache.get = vi.fn().mockResolvedValue(null) as never
      cache.put = vi.fn().mockResolvedValue(undefined) as never

      const { StreamFileActionCaches } = await import('../services/stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      await HlsSegmentAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '3' }),
        getQuery: () => ({ mode: 'transcode', from: 30, to: 40 }),
        response: { writeHead: vi.fn(), on: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-i']), expect.anything())
      expect(mockStdout.pipe).toHaveBeenCalled()
    })
  })
})
