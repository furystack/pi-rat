import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { serializeToQueryString } from '@furystack/rest'
import type { FfprobeData } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HlsStreamAction } from './hls-stream-action.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const mockFfprobe: FfprobeData = {
  streams: [
    { index: 0, codec_type: 'video', codec_name: 'h264', width: 1920, height: 1080, tags: {} },
    { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {}, disposition: { default: 1 } },
  ],
  format: { format_name: 'matroska', duration: 60 },
  chapters: [],
}

describe('HlsStreamAction', () => {
  it('should reject invalid playback mode', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
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

  it('should reject invalid resolution', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )

      try {
        await HlsStreamAction({
          injector,
          getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
          getQuery: () => ({ mode: 'transcode', resolution: '999p' }),
          response: { writeHead: vi.fn(), end: vi.fn() } as unknown as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid resolution')
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
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
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

  it('should include correct number of segments', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )

      await HlsStreamAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ mode: 'transcode', resolution: '720p' }),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      const segmentCount = (writtenBody.match(/#EXTINF:/g) || []).length
      expect(segmentCount).toBe(6)
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
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
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
})
