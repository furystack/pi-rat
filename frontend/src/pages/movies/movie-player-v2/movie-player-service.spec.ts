import type { FfprobeData, PiRatFile, PlaybackInfoResponse } from 'common'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MoviePlayerService, videoCodecs, audioCodecs } from './movie-player-service.js'

vi.mock('hls.js', () => ({
  default: {
    isSupported: () => true,
    Events: { ERROR: 'hlsError', MANIFEST_PARSED: 'hlsManifestParsed' },
    ErrorTypes: { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' },
  },
}))

const mockLogger = {
  verbose: vi.fn().mockResolvedValue(undefined),
  error: vi.fn().mockResolvedValue(undefined),
  information: vi.fn().mockResolvedValue(undefined),
  warning: vi.fn().mockResolvedValue(undefined),
}

const mockFile: PiRatFile = { driveLetter: 'A', path: 'movies/test.mkv' }

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
      disposition: {},
    },
  ],
  format: { format_name: 'matroska', duration: '120' },
  chapters: [],
}

const mockPlaybackInfoResponse: PlaybackInfoResponse = {
  mode: 'remux',
  streamUrl: '/api/media/files/A/movies%2Ftest.mkv/master.m3u8',
  audioTracks: [
    { index: 1, label: 'English', language: 'eng', codecName: 'aac', channels: 2, isDefault: true },
    { index: 2, label: 'French', language: 'fra', codecName: 'dts', channels: 6, isDefault: false },
  ],
  subtitleTracks: [],
  warnings: [],
  duration: 120,
}

const createMockApi = () => ({
  call: vi.fn().mockResolvedValue({ result: mockPlaybackInfoResponse }),
})

describe('MoviePlayerService', () => {
  let api: ReturnType<typeof createMockApi>

  beforeEach(() => {
    api = createMockApi()
    vi.clearAllMocks()
  })

  it('should initialize with correct observable defaults', () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)
    expect(service.audioTrackId.getValue()).toBe(0)
    expect(service.playbackMode.getValue()).toBe('transcode')
    expect(service.progress.getValue()).toBe(0)
    expect(service.resolution.getValue()).toBeUndefined()
    void service[Symbol.asyncDispose]()
  })

  it('should initialize with non-zero progress', () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 42, mockLogger as never)
    expect(service.progress.getValue()).toBe(42)
    void service[Symbol.asyncDispose]()
  })

  it('should fetch playback info on initialize', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(api.call).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          action: '/playback-info',
          body: expect.objectContaining({
            file: mockFile,
            codecSupport: expect.objectContaining({ video: expect.any(Array), audio: expect.any(Array) }),
          }),
        }),
      )
    })

    expect(service.playbackInfo.getValue()).toEqual(mockPlaybackInfoResponse)
    expect(service.playbackMode.getValue()).toBe('remux')
    void service[Symbol.asyncDispose]()
  })

  it('should handle playback info fetch failure gracefully', async () => {
    api.call.mockRejectedValueOnce(new Error('Network error'))

    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(api.call).toHaveBeenCalled()
    })

    expect(service.playbackInfo.getValue()).toBeNull()
    void service[Symbol.asyncDispose]()
  })

  it('should return audio tracks from playback info', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(service.playbackInfo.getValue()).not.toBeNull()
    })

    const tracks = service.getAudioTrackInfoFromPlaybackInfo()
    expect(tracks).toHaveLength(2)
    expect(tracks[0].language).toBe('eng')
    expect(tracks[1].language).toBe('fra')
    void service[Symbol.asyncDispose]()
  })

  it('should return subtitle tracks from playback info', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(service.playbackInfo.getValue()).not.toBeNull()
    })

    const tracks = service.getSubtitleTrackInfoFromPlaybackInfo()
    expect(tracks).toHaveLength(0)
    void service[Symbol.asyncDispose]()
  })

  it('should build audio track list from ffprobe', () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    const tracks = service.getAudioTracks()
    expect(tracks).toHaveLength(2)
    expect(tracks[0].id).toBe(1)
    expect(tracks[0].codecName).toBe('aac')
    expect(tracks[1].id).toBe(2)
    expect(tracks[1].codecName).toBe('dts')
    void service[Symbol.asyncDispose]()
  })

  it('should switch audio track and re-fetch playback info', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(service.playbackInfo.getValue()).not.toBeNull()
    })

    api.call.mockClear()

    await service.switchAudioTrack(2)
    expect(service.audioTrackId.getValue()).toBe(2)
    expect(api.call).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        action: '/playback-info',
        body: expect.objectContaining({
          selectedAudioTrackIndex: 2,
        }),
      }),
    )
    void service[Symbol.asyncDispose]()
  })

  it('should handle switchAudioTrack when fetchPlaybackInfo fails', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await vi.waitFor(() => {
      expect(service.playbackInfo.getValue()).not.toBeNull()
    })

    api.call.mockRejectedValueOnce(new Error('Failed'))

    await service.switchAudioTrack(2)
    expect(service.audioTrackId.getValue()).toBe(2)
    void service[Symbol.asyncDispose]()
  })

  it('should dispose without errors', async () => {
    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    await expect(service[Symbol.asyncDispose]()).resolves.not.toThrow()
  })

  it('should defer video attachment when no playback info yet', () => {
    api.call.mockReturnValue(new Promise(() => {}))

    const service = new MoviePlayerService(mockFile, mockFfprobe, api as never, 0, mockLogger as never)

    const mockVideo = {
      src: '',
      currentTime: 0,
      canPlayType: vi.fn().mockReturnValue(''),
    } as unknown as HTMLVideoElement
    service.attachToVideo(mockVideo)

    expect(service.videoElement).toBe(mockVideo)
    void service[Symbol.asyncDispose]()
  })
})

describe('videoCodecs', () => {
  it('should have expected codec MIME types', () => {
    expect(videoCodecs.h264).toBe('avc1.42E01E')
    expect(videoCodecs.hevc).toBe('hev1.2.4.L120.B0')
    expect(videoCodecs.vp9).toBe('vp09.00.10.08')
    expect(videoCodecs.av1).toBe('av01.0.08M.08')
  })
})

describe('audioCodecs', () => {
  it('should have expected codec MIME types', () => {
    expect(audioCodecs.aac).toBe('mp4a.40.2')
    expect(audioCodecs.ac3).toBe('ac-3')
    expect(audioCodecs.opus).toBe('opus')
  })
})
