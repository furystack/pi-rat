import { serializeToQueryString } from '@furystack/rest'
import type { FfprobeData } from 'common'
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

describe('generateMasterPlaylist', () => {
  it('should produce a valid HLS master playlist', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
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
    })

    expect(playlist).not.toContain('TYPE=AUDIO')
    expect(playlist).not.toContain('AUDIO="audio"')
  })

  it('should not include subtitle entries (handled via HTML track elements)', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
    })

    expect(playlist).not.toContain('TYPE=SUBTITLES')
    expect(playlist).not.toContain('SUBTITLES=')
  })

  it('should generate variant streams for transcode mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
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
    })

    expect(playlist).not.toContain('RESOLUTION=3840x2160')
    expect(playlist).toContain('RESOLUTION=1920x1080')
  })

  it('should propagate audioTrack into variant URLs for transcode mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',

      audioTrack: 2,
    })

    expect(playlist).toContain('audioTrack')
    const variantLines = playlist.split('\n').filter((l) => l.includes('stream.m3u8'))
    for (const line of variantLines) {
      expect(line).toContain('audioTrack')
    }
  })

  it('should propagate audioTrack into variant URL for remux mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',

      audioTrack: 3,
    })

    const variantLine = playlist.split('\n').find((l) => l.includes('stream.m3u8'))
    expect(variantLine).toContain('audioTrack')
  })

  it('should not include audioTrack when not specified', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
    })

    expect(playlist).not.toContain('audioTrack')
  })

  it('should propagate startTime into variant URLs for transcode mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',

      startTime: 3600,
    })

    const variantLines = playlist.split('\n').filter((l) => l.includes('stream.m3u8'))
    for (const line of variantLines) {
      expect(line).toContain('startTime')
    }
  })

  it('should propagate startTime into variant URL for remux mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',

      startTime: 1800,
    })

    const variantLine = playlist.split('\n').find((l) => l.includes('stream.m3u8'))
    expect(variantLine).toContain('startTime')
  })

  it('should not include startTime when not specified', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',
    })

    expect(playlist).not.toContain('startTime')
  })

  it('should not include startTime when set to 0', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'transcode',
      baseUrl: '/api/media',

      startTime: 0,
    })

    expect(playlist).not.toContain('startTime')
  })
})
