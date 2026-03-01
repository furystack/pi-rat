import type { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { RequestError } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import type { FfprobeData } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { PlaybackInfoAction } from './playback-info-action.js'

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

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    find: (...args: unknown[]) => mockFind(...args) as unknown,
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
      tags: { language: 'eng' },
      disposition: { default: 1 },
    },
  ],
  format: { format_name: 'mov,mp4', duration: 120 },
  chapters: [],
}

describe('PlaybackInfoAction', () => {
  it('should return playback info with direct-play mode for compatible file', async () => {
    mockFind.mockResolvedValue([{ imdbId: 'tt1234', relatedFiles: [], driveLetter: 'A', path: 'test.mp4' }])

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )

      const result = await PlaybackInfoAction({
        injector,
        getBody: async () => ({
          file: { driveLetter: 'A', path: 'test.mp4' },
          codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
        }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      expect(result.chunk).toBeDefined()
      const body = result.chunk as { mode: string; streamUrl: string; audioTracks: unknown[]; duration: number }
      expect(body.mode).toBe('direct-play')
      expect(body.streamUrl).toContain('/download')
      expect(body.audioTracks).toHaveLength(1)
      expect(body.duration).toBe(120)
    })
  })

  it('should return remux mode when container is incompatible', async () => {
    const mkvFfprobe: FfprobeData = {
      ...mockFfprobe,
      format: { format_name: 'matroska,webm', duration: 120 },
    }

    mockFind.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mkvFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )

      const result = await PlaybackInfoAction({
        injector,
        getBody: async () => ({
          file: { driveLetter: 'A', path: 'test.mkv' },
          codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
        }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      const body = result.chunk as { mode: string; streamUrl: string }
      expect(body.mode).toBe('remux')
      expect(body.streamUrl).toContain('/master.m3u8')
    })
  })

  it('should reject path traversal in file path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      try {
        await PlaybackInfoAction({
          injector,
          getBody: async () => ({
            file: { driveLetter: 'A', path: '../../etc/passwd' },
            codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
          }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
        expect((error as RequestError).message).toBe('Invalid file path')
      }
    })
  })

  it('should reject null bytes in file path', async () => {
    await usingAsync(new Injector(), async (injector) => {
      try {
        await PlaybackInfoAction({
          injector,
          getBody: async () => ({
            file: { driveLetter: 'A', path: 'test\0.mp4' },
            codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
          }),
          response: {} as ServerResponse,
          request: {} as IncomingMessage,
        })
        expect.fail('Expected RequestError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RequestError)
        expect((error as RequestError).responseCode).toBe(400)
      }
    })
  })

  it('should work when no movie file is found in the database', async () => {
    mockFind.mockResolvedValue([])

    await usingAsync(new Injector(), async (injector) => {
      injector.setExplicitInstance(
        { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
        FfprobeService,
      )

      const result = await PlaybackInfoAction({
        injector,
        getBody: async () => ({
          file: { driveLetter: 'A', path: 'unknown.mp4' },
          codecSupport: { video: ['h264'], audio: ['aac'], containers: ['mp4'] },
        }),
        response: {} as ServerResponse,
        request: {} as IncomingMessage,
      })

      const body = result.chunk as { mode: string }
      expect(body.mode).toBe('direct-play')
    })
  })
})
