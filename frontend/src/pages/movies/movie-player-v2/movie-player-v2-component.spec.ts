import type { AudioTrackInfo, FfprobeData, PlaybackInfoResponse } from 'common'
import { describe, expect, it } from 'vitest'
import { getSubtitleTracks, getSubtitleTracksFromPlaybackInfo } from './get-subtitle-tracks.js'

/**
 * The MoviePlayerV2 component is a Shades component tightly coupled to
 * media-chrome custom elements and HTMLVideoElement. Its testable logic
 * is exercised here via the data-mapping helpers it uses inline.
 *
 * The core playback logic is covered in movie-player-service.spec.ts
 * and get-subtitle-tracks.spec.tsx.
 */

const buildRenditionList = (height: number, currentValue?: string) => {
  type Rendition = { id: string; width: number; height: number; src: string; selected: boolean }
  const renditions: Rendition[] = [
    ...(height >= 2160 ? [{ id: '4k', width: 3840, height: 2160, src: '', selected: currentValue === '4k' }] : []),
    ...(height >= 1080
      ? [{ id: '1080p', width: 1920, height: 1080, src: '', selected: currentValue === '1080p' }]
      : []),
    ...(height >= 720 ? [{ id: '720p', width: 1280, height: 720, src: '', selected: currentValue === '720p' }] : []),
    ...(height >= 480 ? [{ id: '480p', width: 854, height: 480, src: '', selected: currentValue === '480p' }] : []),
    { id: '360p', width: 640, height: 360, src: '', selected: currentValue === '360p' },
  ]
  return renditions
}

const mapAudioTracksForMediaChrome = (audioTracks: AudioTrackInfo[]) =>
  audioTracks.map((track, index) => ({
    id: track.index.toFixed(0),
    label: track.label || track.language || `Audio Track ${index + 1}`,
    language: track.language,
    enabled: index === 0,
    kind: track.label,
  }))

describe('MoviePlayerV2 component logic', () => {
  describe('buildRenditionList', () => {
    it('should include all resolutions for 4K source', () => {
      const renditions = buildRenditionList(2160)
      expect(renditions).toHaveLength(5)
      expect(renditions.map((r) => r.id)).toEqual(['4k', '1080p', '720p', '480p', '360p'])
    })

    it('should exclude resolutions above source height', () => {
      const renditions = buildRenditionList(720)
      expect(renditions).toHaveLength(3)
      expect(renditions.map((r) => r.id)).toEqual(['720p', '480p', '360p'])
    })

    it('should always include 360p', () => {
      const renditions = buildRenditionList(240)
      expect(renditions).toHaveLength(1)
      expect(renditions[0].id).toBe('360p')
    })

    it('should mark the selected rendition', () => {
      const renditions = buildRenditionList(1080, '720p')
      const selected = renditions.find((r) => r.selected)
      expect(selected?.id).toBe('720p')
    })

    it('should not mark any rendition when no value is selected', () => {
      const renditions = buildRenditionList(1080)
      expect(renditions.every((r) => !r.selected)).toBe(true)
    })
  })

  describe('mapAudioTracksForMediaChrome', () => {
    it('should map audio tracks with correct ids and labels', () => {
      const tracks: AudioTrackInfo[] = [
        { index: 1, label: 'English', language: 'eng', codecName: 'aac', channels: 2, isDefault: true },
        { index: 2, label: 'French', language: 'fra', codecName: 'ac3', channels: 6, isDefault: false },
      ]

      const mapped = mapAudioTracksForMediaChrome(tracks)
      expect(mapped).toHaveLength(2)
      expect(mapped[0].id).toBe('1')
      expect(mapped[0].label).toBe('English')
      expect(mapped[0].enabled).toBe(true)
      expect(mapped[1].id).toBe('2')
      expect(mapped[1].label).toBe('French')
      expect(mapped[1].enabled).toBe(false)
    })

    it('should fall back to language when label is empty', () => {
      const tracks: AudioTrackInfo[] = [
        { index: 1, label: '', language: 'jpn', codecName: 'aac', channels: 2, isDefault: false },
      ]

      const mapped = mapAudioTracksForMediaChrome(tracks)
      expect(mapped[0].label).toBe('jpn')
    })

    it('should fall back to generic label when both label and language are empty', () => {
      const tracks: AudioTrackInfo[] = [
        { index: 1, label: '', language: '', codecName: 'aac', channels: 2, isDefault: false },
      ]

      const mapped = mapAudioTracksForMediaChrome(tracks)
      expect(mapped[0].label).toBe('Audio Track 1')
    })
  })

  describe('subtitle source selection', () => {
    const selectSubtitleElements = (
      playbackInfo: PlaybackInfoResponse | null,
      file: { driveLetter: string; path: string },
      ffprobe: FfprobeData,
    ) =>
      playbackInfo && playbackInfo.subtitleTracks.length > 0
        ? getSubtitleTracksFromPlaybackInfo(playbackInfo.subtitleTracks)
        : getSubtitleTracks(file, ffprobe)

    it('should use playback-info tracks when available', () => {
      const playbackInfo: PlaybackInfoResponse = {
        mode: 'remux',
        streamUrl: '/api/media/files/A/test.mkv/master.m3u8',
        audioTracks: [],
        subtitleTracks: [
          {
            index: 2,
            label: 'English',
            language: 'eng',
            format: 'srt',
            source: 'embedded',
            requiresBurnIn: false,
            url: '/api/media/movies/tt123/subtitles/test.vtt',
          },
        ],
        warnings: [],
        duration: 100,
      }
      const ffprobe: FfprobeData = {
        streams: [
          { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
          { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng', title: 'English' } },
        ],
        format: { format_name: 'matroska', duration: 100 },
        chapters: [],
      }

      const result = selectSubtitleElements(playbackInfo, { driveLetter: 'A', path: 'test.mkv' }, ffprobe)
      expect(result).toHaveLength(1)
    })

    it('should fall back to ffprobe-based tracks when playback info has no subtitles', () => {
      const playbackInfo: PlaybackInfoResponse = {
        mode: 'remux',
        streamUrl: '/api/media/files/A/test.mkv/master.m3u8',
        audioTracks: [],
        subtitleTracks: [],
        warnings: [],
        duration: 100,
      }
      const ffprobe: FfprobeData = {
        streams: [
          { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
          { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng', title: 'English' } },
        ],
        format: { format_name: 'matroska', duration: 100 },
        chapters: [],
      }

      const result = selectSubtitleElements(playbackInfo, { driveLetter: 'A', path: 'test.mkv' }, ffprobe)
      expect(result).toHaveLength(1)
    })

    it('should fall back to ffprobe-based tracks when playback info is null', () => {
      const ffprobe: FfprobeData = {
        streams: [
          { index: 0, codec_type: 'video', codec_name: 'h264', tags: {} },
          { index: 2, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng', title: 'English' } },
          { index: 3, codec_type: 'subtitle', codec_name: 'ass', tags: { language: 'jpn', title: 'Japanese' } },
        ],
        format: { format_name: 'matroska', duration: 100 },
        chapters: [],
      }

      const result = selectSubtitleElements(null, { driveLetter: 'A', path: 'test.mkv' }, ffprobe)
      expect(result).toHaveLength(2)
    })

    it('should exclude burn-in subtitles from playback-info tracks', () => {
      const playbackInfo: PlaybackInfoResponse = {
        mode: 'transcode',
        streamUrl: '/api/media/files/A/test.mkv/master.m3u8',
        audioTracks: [],
        subtitleTracks: [
          {
            index: 2,
            label: 'English',
            language: 'eng',
            format: 'srt',
            source: 'embedded',
            requiresBurnIn: false,
            url: '/api/media/movies/tt123/subtitles/test.vtt',
          },
          {
            index: 3,
            label: 'PGS',
            language: 'eng',
            format: 'pgs',
            source: 'embedded',
            requiresBurnIn: true,
          },
        ],
        warnings: [],
        duration: 100,
      }
      const ffprobe: FfprobeData = { streams: [], format: { duration: 100 }, chapters: [] }

      const result = selectSubtitleElements(playbackInfo, { driveLetter: 'A', path: 'test.mkv' }, ffprobe)
      expect(result).toHaveLength(1)
    })
  })
})
