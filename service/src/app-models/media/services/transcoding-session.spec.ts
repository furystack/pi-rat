import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { StreamQueryParams } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranscodingSessionService } from './transcoding-session.js'

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

vi.mock('child_process', () => ({
  spawn: () => {
    const events: Record<string, Array<(...args: unknown[]) => void>> = {}
    return {
      killed: false,
      kill: vi.fn(),
      stdout: { on: vi.fn(), pipe: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        if (!events[event]) events[event] = []
        events[event].push(cb)
      }),
    }
  },
}))

const mockQueryParams: StreamQueryParams = {
  from: 0,
  to: 10,
  mode: 'transcode',
  audio: { trackId: 0 },
}

describe('TranscodingSessionService', () => {
  let service: TranscodingSessionService

  beforeEach(async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      service = injector.getInstance(TranscodingSessionService)
    })
  })

  afterEach(() => {
    service.dispose()
  })

  it('should start with zero active sessions', () => {
    expect(service.getActiveSessionCount()).toBe(0)
  })

  it('should return undefined for non-existent session', () => {
    const session = service.getSession('A', 'test.mkv', 'transcode')
    expect(session).toBeUndefined()
  })

  it('should not crash when marking segment ready for missing session', () => {
    service.markSegmentReady('nonexistent:key', 5)
    expect(service.isSegmentReady('nonexistent:key', 5)).toBe(false)
  })

  it('should return false for segment readiness on missing session', () => {
    expect(service.isSegmentReady('nonexistent', 0)).toBe(false)
  })

  it('should clean up all sessions on dispose', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      const svc = injector.getInstance(TranscodingSessionService)

      await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })
      expect(svc.getActiveSessionCount()).toBe(1)

      svc.dispose()
      expect(svc.getActiveSessionCount()).toBe(0)
    })
  })

  it('should reuse existing session with same key', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      const svc = injector.getInstance(TranscodingSessionService)

      const session1 = await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })

      const session2 = await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })

      expect(session1.key).toBe(session2.key)
      expect(svc.getActiveSessionCount()).toBe(1)

      svc.dispose()
    })
  })

  it('should track segment readiness on existing session', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      const svc = injector.getInstance(TranscodingSessionService)

      const session = await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })

      svc.markSegmentReady(session.key, 5)
      expect(svc.isSegmentReady(session.key, 5)).toBe(true)
      expect(svc.isSegmentReady(session.key, 6)).toBe(false)

      svc.dispose()
    })
  })

  it('should remove session and reduce active count', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      const svc = injector.getInstance(TranscodingSessionService)

      await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })
      expect(svc.getActiveSessionCount()).toBe(1)

      svc.removeSession('A', 'test.mkv', 'transcode')
      expect(svc.getActiveSessionCount()).toBe(0)
      expect(svc.getSession('A', 'test.mkv', 'transcode')).toBeUndefined()

      svc.dispose()
    })
  })

  it('should update lastAccessedAt when getSession is called', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const { StreamFileActionCaches } = await import('./stream-file-action-caches.js')
      const caches = injector.getInstance(StreamFileActionCaches)
      caches.ffMpegArgsCache = {
        get: vi.fn().mockResolvedValue(['-i', 'test.mkv', 'pipe:1']),
      } as never
      caches.driveCache = { get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt' }) } as never
      caches.moviesConfigCache = {
        get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: { preset: 'ultrafast', watchFiles: 'all' } }),
      } as never

      const svc = injector.getInstance(TranscodingSessionService)

      const session = await svc.createSession({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        queryParams: mockQueryParams,
      })

      const initialAccess = session.lastAccessedAt

      await new Promise((resolve) => setTimeout(resolve, 10))

      const retrieved = svc.getSession('A', 'test.mkv', 'transcode')
      expect(retrieved).toBeDefined()
      expect(retrieved!.lastAccessedAt).toBeGreaterThanOrEqual(initialAccess)

      svc.dispose()
    })
  })
})
