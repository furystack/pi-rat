import type { AudioTrackInfo, FfprobeData, PlaybackMode, SubtitleTrackInfo } from 'common'
import { buildAudioTrackList, buildSubtitleTrackList } from './stream-builder.js'

export type HlsVariant = {
  resolution: string
  width: number
  height: number
  bandwidth: number
}

const DEFAULT_VARIANTS: HlsVariant[] = [
  { resolution: '1920x1080', width: 1920, height: 1080, bandwidth: 5000000 },
  { resolution: '1280x720', width: 1280, height: 720, bandwidth: 2800000 },
  { resolution: '854x480', width: 854, height: 480, bandwidth: 1400000 },
  { resolution: '640x360', width: 640, height: 360, bandwidth: 800000 },
]

export const generateMasterPlaylist = ({
  ffprobe,
  file,
  mode,
  baseUrl,
  audioTracks,
  subtitleTracks,
}: {
  ffprobe: FfprobeData
  file: { driveLetter: string; path: string }
  mode: PlaybackMode
  baseUrl: string
  audioTracks: AudioTrackInfo[]
  subtitleTracks: SubtitleTrackInfo[]
}): string => {
  const lines: string[] = ['#EXTM3U', '#EXT-X-VERSION:7']

  const encodedLetter = encodeURIComponent(file.driveLetter)
  const encodedPath = encodeURIComponent(file.path)
  const streamBase = `${baseUrl}/files/${encodedLetter}/${encodedPath}`

  for (const track of subtitleTracks.filter((t) => !t.requiresBurnIn)) {
    const isDefault = track.index === subtitleTracks.filter((t) => !t.requiresBurnIn)[0]?.index ? 'YES' : 'NO'
    lines.push(
      `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="${track.label}",LANGUAGE="${track.language}",DEFAULT=${isDefault},AUTOSELECT=${isDefault},URI="${track.url || `${streamBase}/subtitle/${track.index}.m3u8`}"`,
    )
  }

  for (let i = 0; i < audioTracks.length; i++) {
    const track = audioTracks[i]
    const isDefault = track.isDefault || i === 0 ? 'YES' : 'NO'
    lines.push(
      `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${track.label}",LANGUAGE="${track.language}",DEFAULT=${isDefault},AUTOSELECT=${isDefault},URI="${streamBase}/audio/${track.index}/stream.m3u8"`,
    )
  }

  const videoStream = ffprobe.streams.find((s) => s.codec_type === 'video')
  const sourceHeight = videoStream?.height || 1080
  const sourceWidth = videoStream?.width || 1920
  const sourceBitrate = ffprobe.format.bit_rate || 5000000

  if (mode === 'remux' || mode === 'direct-play' || mode === 'direct-stream') {
    const subtitleGroup = subtitleTracks.filter((t) => !t.requiresBurnIn).length > 0 ? ',SUBTITLES="subs"' : ''
    const audioGroup = audioTracks.length > 1 ? ',AUDIO="audio"' : ''
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${sourceBitrate},RESOLUTION=${sourceWidth}x${sourceHeight},CODECS="${getCodecString(ffprobe)}"${audioGroup}${subtitleGroup}`,
      `${streamBase}/stream.m3u8?mode=${mode}`,
    )
  } else {
    const applicableVariants = DEFAULT_VARIANTS.filter((v) => v.height <= sourceHeight)
    if (applicableVariants.length === 0) {
      applicableVariants.push(DEFAULT_VARIANTS[DEFAULT_VARIANTS.length - 1])
    }

    const subtitleGroup = subtitleTracks.filter((t) => !t.requiresBurnIn).length > 0 ? ',SUBTITLES="subs"' : ''
    const audioGroup = audioTracks.length > 1 ? ',AUDIO="audio"' : ''

    for (const variant of applicableVariants) {
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},CODECS="avc1.42E01E,mp4a.40.2"${audioGroup}${subtitleGroup}`,
        `${streamBase}/stream.m3u8?mode=transcode&resolution=${variant.height}p`,
      )
    }
  }

  return `${lines.join('\n')}\n`
}

export const generateMediaPlaylist = ({
  duration,
  segmentDuration,
  baseUrl,
  mode,
  resolution,
}: {
  duration: number
  segmentDuration: number
  baseUrl: string
  mode: PlaybackMode
  resolution?: string
}): string => {
  const segmentCount = Math.ceil(duration / segmentDuration)
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    `#EXT-X-TARGETDURATION:${segmentDuration}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    '#EXT-X-MAP:URI="init.mp4"',
  ]

  for (let i = 0; i < segmentCount; i++) {
    const from = i * segmentDuration
    const remaining = duration - from
    const actualDuration = Math.min(segmentDuration, remaining)

    const resolutionParam = resolution ? `&resolution=${resolution}` : ''
    lines.push(
      `#EXTINF:${actualDuration.toFixed(3)},`,
      `${baseUrl}/segment/${i}.m4s?mode=${mode}&from=${from}&to=${from + actualDuration}${resolutionParam}`,
    )
  }

  lines.push('#EXT-X-ENDLIST')
  return `${lines.join('\n')}\n`
}

export const generateSubtitlePlaylist = ({
  duration,
  subtitleUrl,
}: {
  duration: number
  subtitleUrl: string
}): string => {
  const lines: string[] = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    `#EXT-X-TARGETDURATION:${Math.ceil(duration)}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXTINF:${duration.toFixed(3)},`,
    subtitleUrl,
    '#EXT-X-ENDLIST',
  ]
  return `${lines.join('\n')}\n`
}

const getCodecString = (ffprobe: FfprobeData): string => {
  const videoStream = ffprobe.streams.find((s) => s.codec_type === 'video')
  const audioStream = ffprobe.streams.find((s) => s.codec_type === 'audio')

  const videoCodecMap: Record<string, string> = {
    h264: 'avc1.42E01E',
    hevc: 'hev1.2.4.L120.B0',
    vp9: 'vp09.00.10.08',
  }

  const audioCodecMap: Record<string, string> = {
    aac: 'mp4a.40.2',
    ac3: 'ac-3',
    eac3: 'mp4a.40.5',
    opus: 'opus',
  }

  const videoCodec = videoCodecMap[videoStream?.codec_name ?? ''] ?? 'avc1.42E01E'
  const audioCodec = audioCodecMap[audioStream?.codec_name ?? ''] ?? 'mp4a.40.2'

  return `${videoCodec},${audioCodec}`
}

export { buildAudioTrackList, buildSubtitleTrackList }
