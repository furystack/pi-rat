import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { serializeToQueryString } from '@furystack/rest'
import type { FfprobeData } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HlsMasterAction } from './hls-master-action.js'

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
    {
      index: 1,
      codec_type: 'audio',
      codec_name: 'aac',
      channels: 2,
      tags: { language: 'eng', title: 'English' },
      disposition: { default: 1 },
    },
  ],
  format: { format_name: 'matroska', duration: '120', bit_rate: '5000000' },
  chapters: [],
}

describe('HlsMasterAction', () => {
  it('should return a valid M3U8 master playlist', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) }) as unknown as FfprobeService,
      )

      await HlsMasterAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({}),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(response.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ 'Content-Type': 'application/vnd.apple.mpegurl' }),
      )
      expect(writtenBody).toContain('#EXTM3U')
      expect(writtenBody).toContain('#EXT-X-STREAM-INF:')
    })
  })

  it('should use codec support from query params', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) }) as unknown as FfprobeService,
      )

      await HlsMasterAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({ videoCodecs: 'h264,hevc', audioCodecs: 'aac,ac3', containers: 'mp4' }),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writtenBody).toContain(serializeToQueryString({ mode: 'remux' as const }))
    })
  })

  it('should not include subtitle entries in master playlist (handled via HTML track elements)', async () => {
    let writtenBody = ''
    const response = {
      writeHead: vi.fn(),
      end: vi.fn((body: string) => {
        writtenBody = body
      }),
    }

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) }) as unknown as FfprobeService,
      )

      await HlsMasterAction({
        injector,
        getUrlParams: () => ({ letter: 'A', path: 'test.mkv' }),
        getQuery: () => ({}),
        response: response as unknown as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(writtenBody).not.toContain('TYPE=SUBTITLES')
      expect(writtenBody).not.toContain('SUBTITLES=')
    })
  })
})
