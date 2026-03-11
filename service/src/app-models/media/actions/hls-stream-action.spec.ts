import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { serializeToQueryString } from '@furystack/rest'
import { describe, expect, it, vi } from 'vitest'
import { HlsStreamAction } from './hls-stream-action.js'
import { TranscodingSessionService } from '../services/transcoding-session.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const MOCK_PLAYLIST = [
  '#EXTM3U',
  '#EXT-X-VERSION:7',
  '#EXT-X-PLAYLIST-TYPE:VOD',
  '#EXT-X-TARGETDURATION:6',
  '#EXT-X-MAP:URI="init.mp4"',
  '#EXTINF:6.000,',
  'segment0.m4s',
  '#EXTINF:6.000,',
  'segment1.m4s',
  '#EXTINF:4.000,',
  'segment2.m4s',
  '#EXT-X-ENDLIST',
].join('\n')

const mockSession = {
  key: 'A:test.mkv:transcode:0:',
  sessionDir: '/tmp/pirat-hls-sessions/abc123',
  state: 'running' as const,
  mode: 'transcode' as const,
  driveLetter: 'A',
  path: 'test.mkv',
  audioTrackId: 0,
  totalDuration: 16,
  createdAt: Date.now(),
  lastAccessedAt: Date.now(),
  ffmpegProcess: { killed: false, kill: vi.fn() },
}

describe('HlsStreamAction', () => {
  it('should reject path traversal attempts', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getOrCreateSession: vi.fn(), readPlaylist: vi.fn() } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsStreamAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: '../etc/passwd' }),
          getQuery: () => ({}),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
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
        { getOrCreateSession: vi.fn(), readPlaylist: vi.fn() } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsStreamAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'invalid' as never }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid playback mode')
      }
    })
  })

  it('should return 500 when playlist is not available', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession: vi.fn().mockResolvedValue(mockSession),
          readPlaylist: vi.fn().mockResolvedValue(null),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsStreamAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'transcode' }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Failed to generate HLS playlist')
      }
    })
  })

  it('should return a valid M3U8 media playlist', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession: vi.fn().mockResolvedValue(mockSession),
          readPlaylist: vi.fn().mockResolvedValue(MOCK_PLAYLIST),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'remux' }),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(response.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ 'Content-Type': 'application/vnd.apple.mpegurl' }),
      )
      expect(writtenBody).toContain('#EXTM3U')
      expect(writtenBody).toContain('#EXT-X-PLAYLIST-TYPE:VOD')
      expect(writtenBody).toContain('#EXT-X-ENDLIST')
    })
  })

  it('should rewrite segment URLs with query params', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession: vi.fn().mockResolvedValue(mockSession),
          readPlaylist: vi.fn().mockResolvedValue(MOCK_PLAYLIST),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', resolution: '720p' }),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writtenBody).toContain('/api/media/files/A/test.mkv/segment/0.m4s')
      expect(writtenBody).toContain('/api/media/files/A/test.mkv/segment/1.m4s')
      expect(writtenBody).toContain('/api/media/files/A/test.mkv/init.mp4')
      expect(writtenBody).toContain(serializeToQueryString({ mode: 'transcode' as const }))
      expect(writtenBody).toContain(serializeToQueryString({ resolution: '720p' }))
    })
  })

  it('should default to transcode mode when not specified', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession: vi.fn().mockResolvedValue(mockSession),
          readPlaylist: vi.fn().mockResolvedValue(MOCK_PLAYLIST),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({}),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writtenBody).toContain(serializeToQueryString({ mode: 'transcode' as const }))
    })
  })

  it('should pass audioTrack and resolution to session creation', async () => {
    const getOrCreateSession = vi.fn().mockResolvedValue(mockSession)

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession,
          readPlaylist: vi.fn().mockResolvedValue(MOCK_PLAYLIST),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', audioTrack: 2, resolution: '1080p' }),
        response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(getOrCreateSession).toHaveBeenCalledWith({
        driveLetter: 'A',
        path: 'test.mkv',
        mode: 'transcode',
        audioTrackId: 2,
        resolution: '1080p',
        startTime: 0,
      })
    })
  })

  it('should pass startTime to session creation and include in segment URLs', async () => {
    const getOrCreateSession = vi.fn().mockResolvedValue(mockSession)
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        {
          getOrCreateSession,
          readPlaylist: vi.fn().mockResolvedValue(MOCK_PLAYLIST),
        } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', startTime: 3600 }),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(getOrCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: 3600,
        }),
      )
      expect(writtenBody).toContain('startTime')
    })
  })

  it('should reject negative startTime', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getOrCreateSession: vi.fn(), readPlaylist: vi.fn() } as unknown as TranscodingSessionService,
        TranscodingSessionService,
      )

      try {
        await HlsStreamAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'transcode', startTime: -10 }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid startTime')
      }
    })
  })
})
