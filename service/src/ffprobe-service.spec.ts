import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { PiRatFile } from 'common'

const mockExecFileAsync = vi.fn()

vi.mock('./utils/exec-file-async.js', () => ({
  execFileAsync: (...args: unknown[]) => mockExecFileAsync(...args) as unknown,
}))

vi.mock('./utils/exists-async.js', () => ({
  existsAsync: vi.fn().mockResolvedValue(true),
}))

vi.mock('./utils/physical-path-utils.js', () => ({
  getPhysicalPath: (_drive: unknown, file: PiRatFile) => `/mnt/data/${file.path}`,
}))

vi.mock('@furystack/core', () => ({
  useSystemIdentityContext: () => ({}),
}))

vi.mock('@furystack/logging', () => ({
  getLogger: () => ({
    withScope: () => ({
      verbose: vi.fn().mockResolvedValue(undefined),
      information: vi.fn().mockResolvedValue(undefined),
      warning: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}))

vi.mock('@furystack/inject', () => ({
  Injectable: () => (target: unknown) => target,
  Injected: () => () => undefined,
}))

vi.mock('@furystack/repository', () => ({
  getDataSetFor: () => ({
    get: vi.fn().mockResolvedValue({ letter: 'A', physicalPath: '/mnt/data' }),
  }),
}))

vi.mock('./app-models/drives/file-watcher-service.js', () => ({
  FileWatcherService: class {},
}))

const ffprobeOutput = JSON.stringify({
  format: { duration: '7200.000000', size: '1234567890' },
  streams: [{ codec_type: 'video', codec_name: 'h264' }],
  chapters: [],
})

describe('FfprobeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecFileAsync.mockResolvedValue(ffprobeOutput)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call execFileAsync with correct ffprobe arguments', async () => {
    const { FfprobeService } = await import('./ffprobe-service.js')
    const service = new FfprobeService()

    Object.defineProperty(service, 'logger', {
      value: {
        verbose: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    })

    Object.defineProperty(service, 'semaphore', {
      value: { execute: <T>(fn: () => Promise<T>) => fn() },
      writable: true,
    })

    const result = await service.getFfprobeForPath('/mnt/data/movie.mkv')

    expect(mockExecFileAsync).toHaveBeenCalledWith('ffprobe', [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      '-show_chapters',
      '/mnt/data/movie.mkv',
    ])

    expect(result.format.duration).toBe('7200.000000')
    expect(result.streams).toHaveLength(1)
  })

  it('should throw and log when ffprobe command fails', async () => {
    mockExecFileAsync.mockRejectedValue(new Error('ffprobe not found'))

    const { FfprobeService } = await import('./ffprobe-service.js')
    const service = new FfprobeService()

    const mockError = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(service, 'logger', {
      value: {
        verbose: vi.fn().mockResolvedValue(undefined),
        error: mockError,
      },
      writable: true,
    })

    Object.defineProperty(service, 'semaphore', {
      value: { execute: <T>(fn: () => Promise<T>) => fn() },
      writable: true,
    })

    await expect(service.getFfprobeForPath('/mnt/data/bad.mkv')).rejects.toThrow('ffprobe not found')
    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('ffprobe failed') }),
    )
  })
})
