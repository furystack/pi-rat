import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { HlsInitAction } from './hls-init-action.js'
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
  stat: vi.fn().mockResolvedValue({ size: 2048 }),
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

describe('HlsInitAction', () => {
  it('should reject path traversal attempts', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getSession: vi.fn(),
          getOrCreateSession: vi.fn(),
          waitForFile: vi.fn(),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsInitAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: '../etc/passwd' }),
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

  it('should reject invalid playback mode', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getSession: vi.fn(),
          getOrCreateSession: vi.fn(),
          waitForFile: vi.fn(),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsInitAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
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

  it('should serve init segment from existing session', async () => {
    const writeHead = vi.fn()

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getSession: vi.fn().mockReturnValue(mockSession),
          getOrCreateSession: vi.fn(),
          waitForFile: vi.fn().mockResolvedValue(true),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsInitAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode' }),
        response: { writeHead, on: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': 2048,
        }),
      )
    })
  })

  it('should create session if none exists', async () => {
    const getOrCreateSession = vi.fn().mockResolvedValue(mockSession)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getSession: vi.fn().mockReturnValue(undefined),
          getOrCreateSession,
          waitForFile: vi.fn().mockResolvedValue(true),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsInitAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', audioTrack: 1 }),
        response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(getOrCreateSession).toHaveBeenCalledWith({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        audioTrackId: 1,
        resolution: undefined,
        startTime: 0,
      })
    })
  })

  it('should return 504 if init segment is not available', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getSession: vi.fn().mockReturnValue(mockSession),
          getOrCreateSession: vi.fn(),
          waitForFile: vi.fn().mockResolvedValue(false),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsInitAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'transcode' }),
          response: { writeHead: vi.fn(), on: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Init segment not available')
      }
    })
  })
})
