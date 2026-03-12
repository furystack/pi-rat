import type { FfprobeData, PlaybackInfoResponse } from 'common'
import { describe, expect, it } from 'vitest'
import { getSubtitleTracks, getSubtitleTracksFromPlaybackInfo } from './get-subtitle-tracks.js'

/**
 * The MoviePlayerV2 component is a Shades component that uses custom
 * Shades controls bound to MoviePlayerService observables. Its testable
 * logic is exercised here via the data-mapping helpers it uses inline.
 *
 * The core playback logic is covered in movie-player-service.spec.ts
 * and get-subtitle-tracks.spec.tsx.
 */

describe('MoviePlayerV2 component logic', () => {
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
        format: { format_name: 'matroska', duration: '100' },
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
        format: { format_name: 'matroska', duration: '100' },
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
        format: { format_name: 'matroska', duration: '100' },
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
      const ffprobe: FfprobeData = { streams: [], format: { duration: '100' }, chapters: [] }

      const result = selectSubtitleElements(playbackInfo, { driveLetter: 'A', path: 'test.mkv' }, ffprobe)
      expect(result).toHaveLength(1)
    })
  })
})
