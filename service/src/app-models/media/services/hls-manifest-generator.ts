import { serializeToQueryString } from '@furystack/rest'
import type { FfprobeData, PlaybackMode, SubtitleTrackInfo } from 'common'

export type HlsVariant = {
  resolution: string
  width: number
  height: number
  bandwidth: number
}

const DEFAULT_VARIANTS: HlsVariant[] = [
  { resolution: '3840x2160', width: 3840, height: 2160, bandwidth: 15000000 },
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
  subtitleTracks,
}: {
  ffprobe: FfprobeData
  file: { driveLetter: string; path: string }
  mode: PlaybackMode
  baseUrl: string
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

  const videoStream = ffprobe.streams.find((s) => s.codec_type === 'video')
  const sourceHeight = videoStream?.height || 1080
  const sourceWidth = videoStream?.width || 1920
  const sourceBitrate = ffprobe.format.bit_rate || 5000000

  if (mode === 'remux' || mode === 'direct-play' || mode === 'direct-stream') {
    const subtitleGroup = subtitleTracks.filter((t) => !t.requiresBurnIn).length > 0 ? ',SUBTITLES="subs"' : ''
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${sourceBitrate},RESOLUTION=${sourceWidth}x${sourceHeight},CODECS="${getCodecString(ffprobe)}"${subtitleGroup}`,
      `${streamBase}/stream.m3u8?${serializeToQueryString({ mode })}`,
    )
  } else {
    const applicableVariants = DEFAULT_VARIANTS.filter((v) => v.height <= sourceHeight)
    if (applicableVariants.length === 0) {
      applicableVariants.push(DEFAULT_VARIANTS[DEFAULT_VARIANTS.length - 1])
    }

    const subtitleGroup = subtitleTracks.filter((t) => !t.requiresBurnIn).length > 0 ? ',SUBTITLES="subs"' : ''

    for (const variant of applicableVariants) {
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},CODECS="avc1.42E01E,mp4a.40.2"${subtitleGroup}`,
        `${streamBase}/stream.m3u8?${serializeToQueryString({ mode: 'transcode' as PlaybackMode, resolution: `${variant.height}p` })}`,
      )
    }
  }

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
    eac3: 'ec-3',
    opus: 'opus',
  }

  const videoCodec = videoCodecMap[videoStream?.codec_name ?? ''] ?? 'avc1.42E01E'
  const audioCodec = audioCodecMap[audioStream?.codec_name ?? ''] ?? 'mp4a.40.2'

  return `${videoCodec},${audioCodec}`
}
