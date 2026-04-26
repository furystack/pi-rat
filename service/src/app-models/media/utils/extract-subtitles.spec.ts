import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { FfprobeData } from 'common'
import { describe, expect, it, vi } from 'vitest'
import { FfprobeService } from '../../../ffprobe-service.js'
import { extractSubtitles } from './extract-subtitles.js'

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

const mockGet = vi.fn()

vi.mock('@furystack/repository', () => ({
  defineDataSet: ({ store }: { store: unknown }) => store,
  getDataSetFor: () => ({
    get: (...args: unknown[]) => mockGet(...args) as unknown,
  }),
}))

const mockMkdir = vi.fn()

vi.mock('fs', () => ({
  promises: {
    mkdir: (...args: unknown[]) => mockMkdir(...args) as unknown,
  },
}))

const mockSpawn = vi.fn()

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args) as unknown,
}))

vi.mock('../../../utils/physical-path-utils.js', () => ({
  getPhysicalPath: (_drive: unknown, file: { path: string }) => `/mnt/media/${file.path}`,
  getPhysicalParentPath: () => '/mnt/media/movies',
}))

const ffprobeWithSubs: FfprobeData = {
  streams: [
    { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
    { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
    { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng' } },
    { index: 3, codec_type: 'subtitle', codec_name: 'ass', tags: { language: 'jpn' } },
  ],
  format: { format_name: 'matroska', duration: '120' },
  chapters: [],
}

const ffprobeNoSubs: FfprobeData = {
  streams: [
    { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
    { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
  ],
  format: { format_name: 'matroska', duration: '120' },
  chapters: [],
}

const ffprobeBitmapSubs: FfprobeData = {
  streams: [
    { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
    { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
    { index: 2, codec_type: 'subtitle', codec_name: 'hdmv_pgs_subtitle', tags: { language: 'eng' } },
  ],
  format: { format_name: 'matroska', duration: '120' },
  chapters: [],
}

describe('extractSubtitles', () => {
  it('should throw when drive is not found', async () => {
    mockGet.mockResolvedValue(null)

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(ffprobeWithSubs) }) as unknown as FfprobeService,
      )

      await expect(extractSubtitles({ injector, file: { driveLetter: 'Z', path: 'test.mkv' } })).rejects.toThrow(
        "Drive with letter 'Z' not found",
      )
    })
  })

  it('should return early when no extractable subtitles exist', async () => {
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(ffprobeNoSubs) }) as unknown as FfprobeService,
      )

      await extractSubtitles({ injector, file: { driveLetter: 'A', path: 'movies/test.mkv' } })
      expect(mockSpawn).not.toHaveBeenCalled()
    })
  })

  it('should skip bitmap subtitles', async () => {
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(ffprobeBitmapSubs) }) as unknown as FfprobeService,
      )

      await extractSubtitles({ injector, file: { driveLetter: 'A', path: 'movies/test.mkv' } })
      expect(mockSpawn).not.toHaveBeenCalled()
    })
  })

  it('should spawn ffmpeg with correct args for text subtitles', async () => {
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockMkdir.mockResolvedValue(undefined)

    const onHandlers: Record<string, (...args: unknown[]) => void> = {}
    mockSpawn.mockReturnValue({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        onHandlers[event] = cb
        if (event === 'close') {
          setTimeout(() => cb(0), 0)
        }
      }),
    })

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(ffprobeWithSubs) }) as unknown as FfprobeService,
      )

      await extractSubtitles({ injector, file: { driveLetter: 'A', path: 'movies/test.mkv' } })

      expect(mockSpawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-i', '/mnt/media/movies/test.mkv', '-map', '0:s:0', '-c:s', 'webvtt']),
        expect.objectContaining({ cwd: '/mnt/media/movies' }),
      )

      const args = mockSpawn.mock.calls[0][1] as string[]
      expect(args).toContain('-y')
      expect(args.filter((a: string) => a === '-map')).toHaveLength(2)
    })
  })

  it('should propagate ffmpeg spawn errors', async () => {
    mockGet.mockResolvedValue({ physicalPath: '/mnt/media', letter: 'A' })
    mockMkdir.mockResolvedValue(undefined)

    mockSpawn.mockReturnValue({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(1), 0)
        }
      }),
    })

    await usingAsync(new Injector(), async (injector) => {
      injector.bind(
        FfprobeService,
        () => ({ getFfprobeForPiratFile: vi.fn().mockResolvedValue(ffprobeWithSubs) }) as unknown as FfprobeService,
      )

      await expect(extractSubtitles({ injector, file: { driveLetter: 'A', path: 'movies/test.mkv' } })).rejects.toThrow(
        'ffmpeg exited with code 1',
      )
    })
  })
})
