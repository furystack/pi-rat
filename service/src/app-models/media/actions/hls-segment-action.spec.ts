import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { HlsSegmentAction } from './hls-segment-action.js'
import { TranscodingSessionService } from '../services/transcoding-session.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('fs', () => ({
  createReadStream: () => ({ pipe: vi.fn() }),
}))

vi.mock('fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}))

const mockSession = {
  key: 'A:test.mkv:transcode:0:',
  sessionDir: '/tmp/pirat-hls-sessions/abc123',
  state: 'running' as const,
  mode: 'transcode' as const,
  driveLetter: 'A',
  path: 'test.mkv',
  audioTrackId: 0,
  createdAt: Date.now(),
  lastAccessedAt: Date.now(),
  ffmpegProcess: { killed: false, kill: vi.fn() },
}

describe('HlsSegmentAction', () => {
  it('should reject invalid segment index', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession: vi.fn(), waitForSegment: vi.fn() }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: 'abc' }),
          getQuery: () => ({}),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid segment index')
      }
    })
  })

  it('should reject path traversal attempts', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession: vi.fn(), waitForSegment: vi.fn() }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: '../etc/passwd', index: '0' }),
          getQuery: () => ({}),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid path')
      }
    })
  })

  it('should reject negative segment index', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession: vi.fn(), waitForSegment: vi.fn() }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '-5' }),
          getQuery: () => ({}),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid segment index')
      }
    })
  })

  it('should reject segment index exceeding upper bound', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession: vi.fn(), waitForSegment: vi.fn() }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '100001' }),
          getQuery: () => ({}),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid segment index')
      }
    })
  })

  it('should reject invalid playback mode', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession: vi.fn(), waitForSegment: vi.fn() }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '0' }),
          getQuery: () => ({ mode: 'invalid' as never }),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid playback mode')
      }
    })
  })

  it('should return 404 when no active session exists', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () =>
          ({
            getSession: vi.fn().mockReturnValue(undefined),
            waitForSegment: vi.fn(),
          }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '0' }),
          getQuery: () => ({ mode: 'transcode' }),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('No active transcoding session')
      }
    })
  })

  it('should return 504 when segment is not available', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () =>
          ({
            getSession: vi.fn().mockReturnValue(mockSession),
            waitForSegment: vi.fn().mockResolvedValue(false),
          }) as unknown as TranscodingSessionService,
      )

      try {
        await HlsSegmentAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '5' }),
          getQuery: () => ({ mode: 'transcode' }),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Segment not available')
      }
    })
  })

  it('should serve segment when session and segment are available', async () => {
    const writeHead = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () =>
          ({
            getSession: vi.fn().mockReturnValue(mockSession),
            waitForSegment: vi.fn().mockResolvedValue(true),
          }) as unknown as TranscodingSessionService,
      )

      await HlsSegmentAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '3' }),
        getQuery: () => ({ mode: 'transcode' }),
        response: { writeHead, on: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({
          'Cache-Control': 'public, max-age=3600',
          'Content-Length': 1024,
        }),
      )
    })
  })

  it('should pass audioTrack and resolution to session lookup', async () => {
    const getSession = vi.fn().mockReturnValue(mockSession)
    const waitForSegment = vi.fn().mockResolvedValue(true)

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        TranscodingSessionService,
        () => ({ getSession, waitForSegment }) as unknown as TranscodingSessionService,
      )

      await HlsSegmentAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv', index: '0' }),
        getQuery: () => ({ mode: 'transcode', audioTrack: 2, resolution: '720p' }),
        response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(getSession).toHaveBeenCalledWith('A', 'test.mkv', 'transcode', 2, '720p', 0)
    })
  })
})
