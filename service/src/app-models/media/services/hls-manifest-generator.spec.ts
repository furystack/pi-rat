import type { AudioTrackInfo, FfprobeData, SubtitleTrackInfo } from 'common'
import { describe, expect, it } from 'vitest'
import { generateMasterPlaylist, generateMediaPlaylist, generateSubtitlePlaylist } from './hls-manifest-generator.js'

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
  format: { format_name: 'matroska', duration: 120, bit_rate: 5000000 },
  chapters: [],
  ...overrides,
})

const audioTracks: AudioTrackInfo[] = [
  { index: 1, label: 'English', language: 'eng', codecName: 'aac', channels: 2, isDefault: true },
  { index: 2, label: 'French', language: 'fra', codecName: 'ac3', channels: 6, isDefault: false },
]

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
      audioTracks,
      subtitleTracks,
    })

    expect(playlist).toContain('#EXTM3U')
    expect(playlist).toContain('#EXT-X-VERSION:7')
    expect(playlist).toContain('#EXT-X-STREAM-INF:')
  })

  it('should include audio renditions for multiple audio tracks', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      audioTracks,
      subtitleTracks: [],
    })

    expect(playlist).toContain('TYPE=AUDIO')
    expect(playlist).toContain('NAME="English"')
    expect(playlist).toContain('NAME="French"')
    expect(playlist).toContain('LANGUAGE="eng"')
    expect(playlist).toContain('LANGUAGE="fra"')
  })

  it('should include subtitle entries but exclude burn-in tracks', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      audioTracks: [audioTracks[0]],
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
      audioTracks: [audioTracks[0]],
      subtitleTracks: [],
    })

    expect(playlist).toContain('RESOLUTION=1920x1080')
    expect(playlist).toContain('RESOLUTION=1280x720')
    expect(playlist).toContain('RESOLUTION=854x480')
    expect(playlist).toContain('RESOLUTION=640x360')
    expect(playlist).toContain('mode=transcode')
  })

  it('should produce a single variant for remux mode', () => {
    const playlist = generateMasterPlaylist({
      ffprobe: createFfprobe(),
      file: { driveLetter: 'A', path: 'movies/test.mkv' },
      mode: 'remux',
      baseUrl: '/api/media',
      audioTracks: [audioTracks[0]],
      subtitleTracks: [],
    })

    const streamInfCount = (playlist.match(/#EXT-X-STREAM-INF/g) || []).length
    expect(streamInfCount).toBe(1)
    expect(playlist).toContain('mode=remux')
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
      audioTracks: [audioTracks[0]],
      subtitleTracks: [],
    })

    expect(playlist).not.toContain('RESOLUTION=1920x1080')
    expect(playlist).toContain('RESOLUTION=1280x720')
    expect(playlist).toContain('RESOLUTION=854x480')
    expect(playlist).toContain('RESOLUTION=640x360')
  })
})

describe('generateMediaPlaylist', () => {
  it('should produce a valid VOD media playlist', () => {
    const playlist = generateMediaPlaylist({
      duration: 120,
      segmentDuration: 10,
      baseUrl: '/api/media/files/A/test',
      mode: 'remux',
    })

    expect(playlist).toContain('#EXTM3U')
    expect(playlist).toContain('#EXT-X-PLAYLIST-TYPE:VOD')
    expect(playlist).toContain('#EXT-X-ENDLIST')
    expect(playlist).toContain('#EXT-X-TARGETDURATION:10')
  })

  it('should generate correct number of segments', () => {
    const playlist = generateMediaPlaylist({
      duration: 25,
      segmentDuration: 10,
      baseUrl: '/api/media/files/A/test',
      mode: 'remux',
    })

    const segmentCount = (playlist.match(/#EXTINF:/g) || []).length
    expect(segmentCount).toBe(3)
  })

  it('should handle the last segment with remaining duration', () => {
    const playlist = generateMediaPlaylist({
      duration: 25,
      segmentDuration: 10,
      baseUrl: '/api/media/files/A/test',
      mode: 'remux',
    })

    expect(playlist).toContain('#EXTINF:5.000,')
  })

  it('should include mode in segment URLs', () => {
    const playlist = generateMediaPlaylist({
      duration: 20,
      segmentDuration: 10,
      baseUrl: '/api/media/files/A/test',
      mode: 'transcode',
      resolution: '720p',
    })

    expect(playlist).toContain('mode=transcode')
    expect(playlist).toContain('resolution=720p')
  })
})

describe('generateSubtitlePlaylist', () => {
  it('should produce a valid subtitle playlist', () => {
    const playlist = generateSubtitlePlaylist({
      duration: 120,
      subtitleUrl: '/api/media/movies/tt123/subtitles/test.vtt',
    })

    expect(playlist).toContain('#EXTM3U')
    expect(playlist).toContain('#EXT-X-ENDLIST')
    expect(playlist).toContain('test.vtt')
    expect(playlist).toContain('#EXTINF:120.000,')
  })
})
