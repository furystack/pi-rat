import type {
  AudioTrackInfo,
  CodecSupportMap,
  FfprobeData,
  PiRatFile,
  PlaybackInfoResponse,
  PlaybackMode,
  SubtitleTrackInfo,
} from 'common'

const BITMAP_SUBTITLE_CODECS = ['hdmv_pgs_subtitle', 'dvd_subtitle', 'dvb_subtitle']

const TEXT_SUBTITLE_CODECS: Record<string, SubtitleTrackInfo['format']> = {
  subrip: 'srt',
  ass: 'ass',
  ssa: 'ass',
  webvtt: 'webvtt',
  mov_text: 'srt',
}

const CONTAINER_COMPATIBLE_WITH_BROWSER = ['mp4', 'mov', 'webm']

/**
 * Resolves the optimal playback mode for a given file based on the client's codec support.
 * Priority order: direct-play > remux > direct-stream > transcode
 */
export const resolvePlaybackMode = ({
  ffprobe,
  codecSupport,
  selectedAudioTrackIndex,
  selectedSubtitleTrackIndex,
}: {
  ffprobe: FfprobeData
  codecSupport: CodecSupportMap
  selectedAudioTrackIndex?: number
  selectedSubtitleTrackIndex?: number
}): { mode: PlaybackMode; warnings: string[] } => {
  const warnings: string[] = []

  const videoStream = ffprobe.streams.find((s) => s.codec_type === 'video')
  const audioStreams = ffprobe.streams.filter((s) => s.codec_type === 'audio')
  const subtitleStreams = ffprobe.streams.filter((s) => s.codec_type === 'subtitle')

  if (!videoStream?.codec_name) {
    return { mode: 'transcode', warnings: ['No video stream found, falling back to transcode'] }
  }

  const selectedAudio = audioStreams.find((s) => s.index === selectedAudioTrackIndex) || audioStreams[0]

  const selectedSubtitle =
    selectedSubtitleTrackIndex !== undefined
      ? subtitleStreams.find((s) => s.index === selectedSubtitleTrackIndex)
      : undefined

  if (selectedSubtitle && BITMAP_SUBTITLE_CODECS.includes(selectedSubtitle.codec_name ?? '')) {
    warnings.push('Bitmap subtitles require transcoding, playback may be slower')
    return { mode: 'transcode', warnings }
  }

  const videoSupported = codecSupport.video.includes(videoStream.codec_name)
  const audioSupported = selectedAudio?.codec_name ? codecSupport.audio.includes(selectedAudio.codec_name) : true

  const containerFormat = ffprobe.format.format_name?.split(',')[0] ?? ''
  const containerSupported =
    codecSupport.containers.includes(containerFormat) ||
    CONTAINER_COMPATIBLE_WITH_BROWSER.some((c) => containerFormat.includes(c))

  if (videoSupported && audioSupported && containerSupported) {
    return { mode: 'direct-play', warnings }
  }

  if (videoSupported && audioSupported) {
    return { mode: 'remux', warnings }
  }

  if (videoSupported && !audioSupported) {
    return { mode: 'direct-stream', warnings }
  }

  return { mode: 'transcode', warnings }
}

export const buildAudioTrackList = (ffprobe: FfprobeData): AudioTrackInfo[] => {
  return ffprobe.streams
    .filter((s) => s.codec_type === 'audio')
    .map((stream, idx) => {
      const tags = stream.tags as Record<string, string> | undefined
      const language = tags?.language ?? 'und'
      const title = tags?.title ?? ''
      const label = title || language || `Audio Track ${idx + 1}`

      return {
        index: stream.index,
        label,
        language,
        codecName: stream.codec_name ?? 'unknown',
        channels: stream.channels ?? 2,
        isDefault: stream.disposition?.default === 1,
      }
    })
}

export const buildSubtitleTrackList = (
  ffprobe: FfprobeData,
  file: PiRatFile,
  relatedFiles?: Array<{ type: string; path: string }>,
  movieId?: string,
): SubtitleTrackInfo[] => {
  const tracks: SubtitleTrackInfo[] = []

  for (const stream of ffprobe.streams.filter((s) => s.codec_type === 'subtitle')) {
    const tags = stream.tags as Record<string, string> | undefined
    const language = tags?.language ?? 'und'
    const title = tags?.title ?? ''
    const codecName = stream.codec_name ?? ''

    const isBitmap = BITMAP_SUBTITLE_CODECS.includes(codecName)
    const format: SubtitleTrackInfo['format'] = isBitmap
      ? codecName === 'dvd_subtitle'
        ? 'vobsub'
        : 'pgs'
      : (TEXT_SUBTITLE_CODECS[codecName] ?? 'other')

    const subtitleFileName = `${file.path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '')}-subtitle-${stream.index}.vtt`
    const embeddedUrl =
      !isBitmap && movieId
        ? `/api/media/movies/${encodeURIComponent(movieId)}/subtitles/${encodeURIComponent(subtitleFileName)}`
        : undefined

    tracks.push({
      index: stream.index,
      label: title || language || `Subtitle ${stream.index}`,
      language,
      format,
      source: 'embedded',
      requiresBurnIn: isBitmap,
      url: embeddedUrl,
    })
  }

  if (relatedFiles) {
    for (const related of relatedFiles.filter((r) => r.type === 'subtitle')) {
      const ext = related.path.split('.').pop()?.toLowerCase() ?? ''
      const format: SubtitleTrackInfo['format'] =
        ext === 'srt' ? 'srt' : ext === 'ass' || ext === 'ssa' ? 'ass' : ext === 'vtt' ? 'webvtt' : 'other'

      tracks.push({
        index: -1,
        label: related.path.split('/').pop() ?? related.path,
        language: 'und',
        format,
        source: 'external',
        requiresBurnIn: false,
        url: `/api/drives/files/${encodeURIComponent(file.driveLetter)}/${encodeURIComponent(related.path)}/download`,
      })
    }
  }

  return tracks
}

export const buildPlaybackInfoResponse = ({
  ffprobe,
  file,
  codecSupport,
  selectedAudioTrackIndex,
  selectedSubtitleTrackIndex,
  relatedFiles,
  streamBaseUrl,
  movieId,
}: {
  ffprobe: FfprobeData
  file: PiRatFile
  codecSupport: CodecSupportMap
  selectedAudioTrackIndex?: number
  selectedSubtitleTrackIndex?: number
  relatedFiles?: Array<{ type: string; path: string }>
  streamBaseUrl: string
  movieId?: string
}): PlaybackInfoResponse => {
  const { mode, warnings } = resolvePlaybackMode({
    ffprobe,
    codecSupport,
    selectedAudioTrackIndex,
    selectedSubtitleTrackIndex,
  })

  const encodedLetter = encodeURIComponent(file.driveLetter)
  const encodedPath = encodeURIComponent(file.path)

  const streamUrl =
    mode === 'direct-play'
      ? `/api/drives/files/${encodedLetter}/${encodedPath}/download`
      : `${streamBaseUrl}/files/${encodedLetter}/${encodedPath}/master.m3u8`

  return {
    mode,
    streamUrl,
    audioTracks: buildAudioTrackList(ffprobe),
    subtitleTracks: buildSubtitleTrackList(ffprobe, file, relatedFiles, movieId),
    warnings,
    duration: ffprobe.format.duration ?? 0,
  }
}
