import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { FfprobeData, MoviesConfig, StreamQueryParams } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { HwAccelDetector } from './hw-accel-detector.js'
import { StreamFileActionCaches } from './stream-file-action-caches.js'

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: ({ injector }: { injector: unknown }) => injector,
}))

const mockGetDataSetFor = vi.fn().mockReturnValue({
  get: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
})

vi.mock('@furystack/repository', () => ({
  getDataSetFor: (...args: unknown[]): unknown => mockGetDataSetFor(...args),
}))

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
      tags: { language: 'eng' },
      disposition: { default: 1 },
    },
    {
      index: 2,
      codec_type: 'audio',
      codec_name: 'dts',
      channels: 6,
      tags: { language: 'fra' },
    },
  ],
  format: { format_name: 'matroska', duration: 7200 },
  chapters: [],
}

const mockDrive = { letter: 'A', physicalPath: '/mnt/media' }

const buildArgs = async (queryParams: StreamQueryParams, configOverrides?: Partial<MoviesConfig['value']>) => {
  return await usingAsync(new Injector(), async (injector) => {
    injector.setExplicitInstance(
      { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
      FfprobeService,
    )

    injector.setExplicitInstance(
      {
        getEncoder: vi.fn().mockResolvedValue('h264_vaapi'),
        detect: vi.fn().mockResolvedValue({ available: ['vaapi'], encoders: { h264: ['h264_vaapi'] } }),
      } as unknown as HwAccelDetector,
      HwAccelDetector,
    )

    const caches = injector.getInstance(StreamFileActionCaches)
    caches.driveCache = { get: vi.fn().mockResolvedValue(mockDrive) } as never
    caches.moviesConfigCache = {
      get: vi.fn().mockResolvedValue({
        id: 'MOVIES_CONFIG',
        value: { preset: 'ultrafast', watchFiles: 'all', ...configOverrides },
      } satisfies MoviesConfig),
    } as never

    return await caches.ffMpegArgsCache.get({
      injector,
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      queryParams,
    })
  })
}

describe('ffMpegArgsCache', () => {
  describe('remux mode (-c copy)', () => {
    it('should use -c:v copy and -c:a copy in remux mode', async () => {
      const args = await buildArgs({
        mode: 'remux',
        from: 0,
        to: 10,
        audio: { trackId: 1 },
      })

      expect(args).toContain('-c:v')
      expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
      expect(args).toContain('-c:a')
      expect(args[args.indexOf('-c:a') + 1]).toBe('copy')
      expect(args).not.toContain('libx264')
      expect(args).not.toContain('-preset')
    })
  })

  describe('direct-stream mode (copy video, transcode audio)', () => {
    it('should use -c:v copy and -c:a aac', async () => {
      const args = await buildArgs({
        mode: 'direct-stream',
        from: 0,
        to: 10,
        audio: { trackId: 2, audioCodec: 'aac', bitrate: 96 },
      })

      expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
      expect(args[args.indexOf('-c:a') + 1]).toBe('aac')
      expect(args).not.toContain('-preset')
    })
  })

  describe('transcode mode (full re-encode)', () => {
    it('should use -c:v libx264 and -c:a aac with preset', async () => {
      const args = await buildArgs({
        mode: 'transcode',
        from: 0,
        to: 10,
        audio: { trackId: 1, audioCodec: 'aac' },
        video: { codec: 'libx264' },
      })

      expect(args[args.indexOf('-c:v') + 1]).toBe('libx264')
      expect(args[args.indexOf('-c:a') + 1]).toBe('aac')
      expect(args).toContain('-preset')
      expect(args[args.indexOf('-preset') + 1]).toBe('ultrafast')
      expect(args).toContain('-force_key_frames')
      expect(args).toContain('-sc_threshold:v')
    })
  })

  describe('legacy mode (no mode specified)', () => {
    it('should default to transcode behavior', async () => {
      const args = await buildArgs({
        from: 0,
        to: 10,
        audio: { trackId: 1 },
      })

      expect(args[args.indexOf('-c:v') + 1]).toBe('libx264')
      expect(args).toContain('-preset')
    })
  })

  describe('audio track selection', () => {
    it('should map the correct audio stream index', async () => {
      const args = await buildArgs({
        mode: 'remux',
        from: 0,
        to: 10,
        audio: { trackId: 2 },
      })

      expect(args).toContain('-map')
      const audioMapIndex = args.findIndex((a, i) => a === '-map' && args[i + 1]?.startsWith('0:a:'))
      expect(args[audioMapIndex + 1]).toBe('0:a:1')
    })
  })

  describe('resolution scaling', () => {
    it('should add resolution flags in transcode mode', async () => {
      const args = await buildArgs({
        mode: 'transcode',
        from: 0,
        to: 10,
        audio: { trackId: 1 },
        video: { codec: 'libx264', resolution: '720p' },
      })

      expect(args).toContain('-s')
      expect(args[args.indexOf('-s') + 1]).toBe('1280x720')
    })

    it('should NOT add resolution flags in remux mode', async () => {
      const args = await buildArgs({
        mode: 'remux',
        from: 0,
        to: 10,
        audio: { trackId: 1 },
        video: { resolution: '720p' },
      })

      expect(args).not.toContain('-s')
    })
  })

  describe('time range', () => {
    it('should add -ss before -i with correct timestamp offset', async () => {
      const args = await buildArgs({
        mode: 'remux',
        from: 30,
        to: 40,
      })

      expect(args).toContain('-ss')
      expect(args[args.indexOf('-ss') + 1]).toBe('30')
      expect(args).toContain('-t')
      expect(args[args.indexOf('-t') + 1]).toBe('10')

      const iIdx = args.indexOf('-i')
      const ssIdx = args.indexOf('-ss')
      expect(ssIdx).toBeLessThan(iIdx)

      expect(args).toContain('-output_ts_offset')
      expect(args[args.indexOf('-output_ts_offset') + 1]).toBe('30')
    })
  })

  describe('audio mixdown', () => {
    it('should add -ac 2 in transcode mode with mixdown', async () => {
      const args = await buildArgs({
        mode: 'transcode',
        from: 0,
        to: 10,
        audio: { trackId: 1, mixdown: true },
      })

      expect(args).toContain('-ac')
      expect(args[args.indexOf('-ac') + 1]).toBe('2')
    })

    it('should NOT add -ac in remux mode even with mixdown', async () => {
      const args = await buildArgs({
        mode: 'remux',
        from: 0,
        to: 10,
        audio: { trackId: 1, mixdown: true },
      })

      expect(args).not.toContain('-ac')
    })
  })

  describe('threads config', () => {
    it('should add -threads when configured', async () => {
      const args = await buildArgs(
        {
          mode: 'transcode',
          from: 0,
          to: 10,
          audio: { trackId: 1 },
        },
        { threads: 4 },
      )

      expect(args).toContain('-threads')
      expect(args[args.indexOf('-threads') + 1]).toBe('4')
    })

    it('should NOT add -threads when not configured', async () => {
      const args = await buildArgs({
        mode: 'transcode',
        from: 0,
        to: 10,
        audio: { trackId: 1 },
      })

      expect(args).not.toContain('-threads')
    })
  })

  describe('hardware acceleration', () => {
    it('should use hw encoder when hwAccelMethod is configured', async () => {
      const args = await buildArgs(
        {
          mode: 'transcode',
          from: 0,
          to: 10,
          audio: { trackId: 1 },
          video: { codec: 'libx264' },
        },
        { hwAccelMethod: 'vaapi' },
      )

      expect(args[args.indexOf('-c:v') + 1]).toBe('h264_vaapi')
      expect(args).not.toContain('-preset')
    })

    it('should NOT use hw encoder in remux mode', async () => {
      const args = await buildArgs(
        {
          mode: 'remux',
          from: 0,
          to: 10,
          audio: { trackId: 1 },
        },
        { hwAccelMethod: 'vaapi' },
      )

      expect(args[args.indexOf('-c:v') + 1]).toBe('copy')
    })
  })

  describe('configuration updates', () => {
    it('should invalidate cache when MOVIES_CONFIG is updated', async () => {
      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )

        const mockConfigDataSet = {
          get: vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: {} }),
          subscribe: vi.fn().mockReturnValue({ [Symbol.dispose]: vi.fn() }),
        }

        const mockDriveDataSet = {
          get: vi.fn().mockResolvedValue(mockDrive),
        }

        mockGetDataSetFor.mockImplementation((_injector, model: { name: string }) => {
          if (model.name === 'Config') return mockConfigDataSet
          if (model.name === 'Drive') return mockDriveDataSet
          return {}
        })

        const caches = injector.getInstance(StreamFileActionCaches)
        caches.moviesConfigCache.setObsolete = vi.fn()

        caches.init()

        // Simulate config update event
        const subscriptionHandler = mockConfigDataSet.subscribe.mock.calls[0][1] as (data: { id: string }) => void
        subscriptionHandler({ id: 'MOVIES_CONFIG' })

        expect(caches.moviesConfigCache.setObsolete).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should throw if drive is not found', async () => {
      await usingAsync(new Injector(), async (injector) => {
        injector.setExplicitInstance(
          { getFfprobeForPiratFile: vi.fn().mockResolvedValue(mockFfprobe) } as unknown as FfprobeService,
          FfprobeService,
        )

        const caches = injector.getInstance(StreamFileActionCaches)
        caches.driveCache.get = vi.fn().mockResolvedValue(null) as never
        caches.moviesConfigCache.get = vi.fn().mockResolvedValue({ id: 'MOVIES_CONFIG', value: {} }) as never

        await expect(
          caches.ffMpegArgsCache.get({
            injector,
            file: { driveLetter: 'Z', path: 'test.mkv' },
            queryParams: { from: 0, to: 10, mode: 'transcode', audio: { trackId: 0 } },
          }),
        ).rejects.toThrow('Drive Z not found')
      })
    })
  })
})
