import { serializeToQueryString } from '@furystack/rest'
import type { FfprobeData, SubtitleTrackInfo } from 'common'
import { describe, expect, it } from 'vitest'
import { generateMasterPlaylist } from './hls-manifest-generator.js'

const createFfprobe = (overrides: Partial<FfprobeData> = {}): FfprobeData => ({
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
  ...overrides,
})

const subtitleTracks: SubtitleTrackInfo[] = [
  { index: 3, label: 'English', language: 'eng', format: 'srt', source: 'embedded', requiresBurnIn: false },
  { index: 4, label: 'Japanese', language: 'jpn', format: 'ass', source: 'embedded', requiresBurnIn: false },
  { index: 5, label: 'PGS', language: 'eng', format: 'pgs', source: 'embedded', requiresBurnIn: true },
]

describe('generateMasterPlaylist', () => {
  it('should produce a valid HLS master playlist', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      subtitleTracks,
    })

    expect(playlist).toContain('#EXTM3U')
    expect(playlist).toContain('#EXT-X-VERSION:7')
    expect(playlist).toContain('#EXT-X-STREAM-INF:')
  })

  it('should not include HLS audio renditions (audio switching is app-level)', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    expect(playlist).not.toContain('TYPE=AUDIO')
    expect(playlist).not.toContain('AUDIO="audio"')
  })

  it('should include subtitle entries but exclude burn-in tracks', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      subtitleTracks,
    })

    expect(playlist).toContain('TYPE=SUBTITLES')
    expect(playlist).toContain('NAME="English"')
    expect(playlist).toContain('NAME="Japanese"')
    expect(playlist).not.toContain('NAME="PGS"')
  })

  it('should generate variant streams for transcode mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    expect(playlist).toContain('RESOLUTION=1920x1080')
    expect(playlist).toContain('RESOLUTION=1280x720')
    expect(playlist).toContain('RESOLUTION=854x480')
    expect(playlist).toContain('RESOLUTION=640x360')
    expect(playlist).toContain(serializeToQueryString({ mode: 'transcode' }))
  })

  it('should produce a single variant for remux mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    const streamInfCount = (playlist.match(/#EXT-X-STREAM-INF/g) || []).length
    expect(streamInfCount).toBe(1)
    expect(playlist).toContain(serializeToQueryString({ mode: 'remux' }))
  })

  it('should filter transcode variants to source resolution', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', width: 1280, height: 720, tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
      ],
    })

    const playlist = generateMasterPlaylist({
      ffprobe,
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    expect(playlist).not.toContain('RESOLUTION=3840x2160')
    expect(playlist).not.toContain('RESOLUTION=1920x1080')
    expect(playlist).toContain('RESOLUTION=1280x720')
    expect(playlist).toContain('RESOLUTION=854x480')
    expect(playlist).toContain('RESOLUTION=640x360')
  })

  it('should include 4K variant for 4K sources in transcode mode', () => {
    const ffprobe = createFfprobe({
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'hevc', width: 3840, height: 2160, tags: {} },
        { index: 1, codec_type: 'audio', codec_name: 'aac', channels: 2, tags: {} },
      ],
    })

    const playlist = generateMasterPlaylist({
      ffprobe,
      file: { driveLetter: 'A', path: 'movies/test-4k.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    expect(playlist).toContain('RESOLUTION=3840x2160')
    expect(playlist).toContain('RESOLUTION=1920x1080')
    expect(playlist).toContain('RESOLUTION=1280x720')
    expect(playlist).toContain('RESOLUTION=854x480')
    expect(playlist).toContain('RESOLUTION=640x360')
  })

  it('should not include 4K variant for 1080p sources in transcode mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
      subtitleTracks: [],
    })

    expect(playlist).not.toContain('RESOLUTION=3840x2160')
    expect(playlist).toContain('RESOLUTION=1920x1080')
  })
})
