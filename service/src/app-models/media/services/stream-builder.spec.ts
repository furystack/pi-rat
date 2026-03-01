import type { CodecSupportMap, FfprobeData } from 'common'
import { describe, expect, it } from 'vitest'
import {
  buildAudioTrackList,
  buildPlaybackInfoResponse,
  buildSubtitleTrackList,
  resolvePlaybackMode,
} from './stream-builder.js'

const createFfprobe = (overrides: Partial<FfprobeData> = {}): FfprobeData => ({
  streams: [
    {
      index: 0,
      codec_type: 'video',
      codec_name: 'h264',
      width: 1920,
      height: 1080,
      tags: {},
    },
    {
      index: 1,
      codec_type: 'audio',
      codec_name: 'aac',
      channels: 2,
      tags: { language: 'eng', title: 'English' },
      disposition: { default: 1 },
    },
  ],
  format: {
    format_name: 'matroska,webm',
    duration: 7200,
  },
  chapters: [],
  ...overrides,
})

const fullCodecSupport: CodecSupportMap = {
  video: ['h264', 'hevc', 'vp9'],
  audio: ['aac', 'ac3', 'opus'],
  containers: ['mp4', 'webm'],
}

describe('resolvePlaybackMode', () => {
  it('should return direct-play when all codecs and container are supported', () => {
    const ffprobe = createFfprobe({
      format: { format_name: 'mov,mp4,m4a,3gp,3g2,mj2', duration: 100 },
    })
    const result = resolvePlaybackMode({ ffprobe, codecSupport: fullCodecSupport })
    expect(result.mode).toBe('direct-play')
    expect(result.warnings).toHaveLength(0)
  })

  it('should return remux when codecs are supported but container is not', () => {
    const ffprobe = createFfprobe({
      format: { format_name: 'matroska,webm', duration: 100 },
    })
    const codecSupport: CodecSupportMap = {
      video: ['h264'],
      audio: ['aac'],
      containers: ['mp4'],
    }
    const result = resolvePlaybackMode({ ffprobe, codecSupport })
    expect(result.mode).toBe('remux')
  })

  it('should return direct-stream when video is supported but audio is not', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'dts', channels: 6, tags: { language: 'eng' } },
      ],
    })
    const codecSupport: CodecSupportMap = {
      video: ['h264'],
      audio: ['aac'],
      containers: ['mp4', 'matroska'],
    }
    const result = resolvePlaybackMode({ ffprobe, codecSupport })
    expect(result.mode).toBe('direct-stream')
  })

  it('should return transcode when video codec is not supported', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'av1', tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
      ],
    })
    const codecSupport: CodecSupportMap = {
      video: ['h264'],
      audio: ['aac'],
      containers: ['mp4'],
    }
    const result = resolvePlaybackMode({ ffprobe, codecSupport })
    expect(result.mode).toBe('transcode')
  })

  it('should return transcode with warning when bitmap subtitle is selected', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'hdmv_pgs_subtitle', tags: { language: 'eng' } },
      ],
    })
    const result = resolvePlaybackMode({
      ffprobe,
      codecSupport: fullCodecSupport,
      selectedSubtitleTrackIndex: 2,
    })
    expect(result.mode).toBe('transcode')
    expect(result.warnings).toContain('Bitmap subtitles require transcoding, playback may be slower')
  })

  it('should not escalate for text subtitle selection', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng' } },
      ],
      format: { format_name: 'mov,mp4', duration: 100 },
    })
    const result = resolvePlaybackMode({
      ffprobe,
      codecSupport: fullCodecSupport,
      selectedSubtitleTrackIndex: 2,
    })
    expect(result.mode).toBe('direct-play')
  })

  it('should return transcode when no video stream is found', () => {
    const ffprobe = createFfprobe({
      streams: [{ index: 0, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} }],
    })
    const result = resolvePlaybackMode({ ffprobe, codecSupport: fullCodecSupport })
    expect(result.mode).toBe('transcode')
    expect(result.warnings[0]).toContain('No video stream found')
  })

  it('should use selected audio track for codec check', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        {
          index: 1,
          codec_type: 'audio',
          codec_name: 'aac',
          channels: 2,
          tags: { language: 'eng' },
          disposition: { default: 1 },
        },
        { index: 2, codec_type: 'audio', codec_name: 'dts', channels: 6, tags: { language: 'fra' } },
      ],
      format: { format_name: 'mov,mp4', duration: 100 },
    })

    const codecSupport: CodecSupportMap = {
      video: ['h264'],
      audio: ['aac'],
      containers: ['mp4'],
    }

    const withDefault = resolvePlaybackMode({ ffprobe, codecSupport })
    expect(withDefault.mode).toBe('direct-play')

    const withDts = resolvePlaybackMode({ ffprobe, codecSupport, selectedAudioTrackIndex: 2 })
    expect(withDts.mode).toBe('direct-stream')
  })
})

describe('buildAudioTrackList', () => {
  it('should build audio track list from ffprobe streams', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        {
          index: 1,
          codec_type: 'audio',
          codec_name: 'aac',
          channels: 2,
          tags: { language: 'eng', title: 'English' },
          disposition: { default: 1 },
        },
        {
          index: 2,
          codec_type: 'audio',
          codec_name: 'ac3',
          channels: 6,
          tags: { language: 'fra', title: 'French' },
          disposition: {},
        },
      ],
    })

    const tracks = buildAudioTrackList(ffprobe)
    expect(tracks).toHaveLength(2)
    expect(tracks[0].index).toBe(1)
    expect(tracks[0].language).toBe('eng')
    expect(tracks[0].codecName).toBe('aac')
    expect(tracks[0].channels).toBe(2)
    expect(tracks[0].isDefault).toBe(true)
    expect(tracks[1].index).toBe(2)
    expect(tracks[1].language).toBe('fra')
    expect(tracks[1].isDefault).toBe(false)
  })

  it('should handle missing tags gracefully', () => {
    const ffprobe = createFfprobe({
      streams: [{ index: 0, codec_type: 'audio', codec_name: 'aac', channels: 2 }],
    })

    const tracks = buildAudioTrackList(ffprobe)
    expect(tracks).toHaveLength(1)
    expect(tracks[0].language).toBe('und')
  })
})

describe('buildSubtitleTrackList', () => {
  it('should classify text subtitles correctly', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng', title: 'English' } },
        { index: 3, codec_type: 'subtitle', codec_name: 'ass', tags: { language: 'jpn', title: 'Japanese' } },
      ],
    })

    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const tracks = buildSubtitleTrackList(ffprobe, file)

    expect(tracks).toHaveLength(2)
    expect(tracks[0].format).toBe('srt')
    expect(tracks[0].requiresBurnIn).toBe(false)
    expect(tracks[0].source).toBe('embedded')
    expect(tracks[1].format).toBe('ass')
    expect(tracks[1].requiresBurnIn).toBe(false)
  })

  it('should generate URLs for embedded text subtitles when movieId is provided', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng' } },
      ],
    })

    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const tracks = buildSubtitleTrackList(ffprobe, file, undefined, 'tt1234567')

    expect(tracks[0].url).toContain('/api/media/movies/tt1234567/subtitles/')
    expect(tracks[0].url).toContain('test-subtitle-2.vtt')
  })

  it('should not generate URLs for bitmap subtitles even with movieId', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'hdmv_pgs_subtitle', tags: { language: 'eng' } },
      ],
    })

    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const tracks = buildSubtitleTrackList(ffprobe, file, undefined, 'tt1234567')

    expect(tracks[0].url).toBeUndefined()
    expect(tracks[0].requiresBurnIn).toBe(true)
  })

  it('should classify bitmap subtitles as requiring burn-in', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        { index: 2, codec_type: 'subtitle', codec_name: 'hdmv_pgs_subtitle', tags: { language: 'eng' } },
        { index: 3, codec_type: 'subtitle', codec_name: 'dvd_subtitle', tags: { language: 'fra' } },
      ],
    })

    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const tracks = buildSubtitleTrackList(ffprobe, file)

    expect(tracks).toHaveLength(2)
    expect(tracks[0].format).toBe('pgs')
    expect(tracks[0].requiresBurnIn).toBe(true)
    expect(tracks[1].format).toBe('vobsub')
    expect(tracks[1].requiresBurnIn).toBe(true)
  })

  it('should include external subtitle files from relatedFiles', () => {
    const ffprobe = createFfprobe()
    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const relatedFiles = [
      { type: 'subtitle', path: 'movies/test.eng.srt' },
      { type: 'subtitle', path: 'movies/test.jpn.ass' },
      { type: 'trailer', path: 'movies/trailer.mp4' },
    ]

    const tracks = buildSubtitleTrackList(ffprobe, file, relatedFiles)
    const externalTracks = tracks.filter((t) => t.source === 'external')

    expect(externalTracks).toHaveLength(2)
    expect(externalTracks[0].format).toBe('srt')
    expect(externalTracks[0].url).toContain('/download')
    expect(externalTracks[1].format).toBe('ass')
  })
})

describe('buildPlaybackInfoResponse', () => {
  it('should return a complete response with correct stream URL for direct-play', () => {
    const ffprobe = createFfprobe({
      format: { format_name: 'mov,mp4', duration: 120 },
    })
    const file = { driveLetter: 'A', path: 'movies/test.mp4' }

    const response = buildPlaybackInfoResponse({
      ffprobe,
      file,
      codecSupport: fullCodecSupport,
      streamBaseUrl: '/api/media',
    })

    expect(response.mode).toBe('direct-play')
    expect(response.streamUrl).toContain('/api/drives/files/')
    expect(response.duration).toBe(120)
    expect(response.audioTracks).toHaveLength(1)
    expect(response.warnings).toHaveLength(0)
  })

  it('should return HLS master URL for non-direct modes', () => {
    const ffprobe = createFfprobe()
    const file = { driveLetter: 'A', path: 'movies/test.mkv' }

    const codecSupport: CodecSupportMap = {
      video: ['h264'],
      audio: ['aac'],
      containers: ['mp4'],
    }

    const response = buildPlaybackInfoResponse({
      ffprobe,
      file,
      codecSupport,
      streamBaseUrl: '/api/media',
    })

    expect(response.mode).toBe('remux')
    expect(response.streamUrl).toContain('/api/media/files/')
    expect(response.streamUrl).toContain('/master.m3u8')
  })
})
