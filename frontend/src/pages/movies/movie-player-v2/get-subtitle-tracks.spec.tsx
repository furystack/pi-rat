import type { FfprobeData, SubtitleTrackInfo } from 'common'
import { describe, expect, it } from 'vitest'
import { getSubtitleTracksFromPlaybackInfo, getSubtitleTracks } from './get-subtitle-tracks.js'

describe('getSubtitleTracksFromPlaybackInfo', () => {
  it('should filter out burn-in subtitles', () => {
    const tracks: SubtitleTrackInfo[] = [
      {
        index: 2,
        label: 'English',
        language: 'eng',
        format: 'srt',
        source: 'embedded',
        requiresBurnIn: false,
        url: '/api/media/movies/tt1234/subtitles/test-subtitle-2.vtt',
      },
      {
        index: 3,
        label: 'French PGS',
        language: 'fra',
        format: 'pgs',
        source: 'embedded',
        requiresBurnIn: true,
      },
    ]

    const elements = getSubtitleTracksFromPlaybackInfo(tracks)
    expect(elements).toHaveLength(1)
  })

  it('should filter out subtitles without URL', () => {
    const tracks: SubtitleTrackInfo[] = [
      {
        index: 2,
        label: 'English',
        language: 'eng',
        format: 'srt',
        source: 'embedded',
        requiresBurnIn: false,
      },
    ]

    const elements = getSubtitleTracksFromPlaybackInfo(tracks)
    expect(elements).toHaveLength(0)
  })

  it('should return empty array for no tracks', () => {
    const elements = getSubtitleTracksFromPlaybackInfo([])
    expect(elements).toHaveLength(0)
  })
})

describe('getSubtitleTracks', () => {
  it('should create track elements for subtitle streams', () => {
    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const ffprobe: FfprobeData = {
      streams: [
        { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
        {
          index: 2,
          codec_type: 'subtitle',
          codec_name: 'subrip',
          tags: { language: 'eng', title: 'English' },
        },
      ],
      format: { format_name: 'matroska', duration: '100' },
      chapters: [],
    }

    const elements = getSubtitleTracks(file, ffprobe)
    expect(elements).toHaveLength(1)
  })

  it('should return empty array when no subtitle streams exist', () => {
    const file = { driveLetter: 'A', path: 'movies/test.mkv' }
    const ffprobe: FfprobeData = {
      streams: [{ index: 0, codec_type: 'video', codec_name: 'h264', tags: {} }],
      format: { format_name: 'matroska', duration: '100' },
      chapters: [],
    }

    const elements = getSubtitleTracks(file, ffprobe)
    expect(elements).toHaveLength(0)
  })
})
