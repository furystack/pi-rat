import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { HlsStreamEndpoint, PlaybackMode } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { generateMediaPlaylist } from '../services/hls-manifest-generator.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']
const VALID_RESOLUTIONS = ['1080p', '720p', '480p', '360p'] as const

export const HlsStreamAction: RequestAction<HlsStreamEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
  response,
}) => {
  const logger = getLogger(injector).withScope('HlsStreamAction')
  const { letter, path } = getUrlParams()
  const query = getQuery()

  const file = { driveLetter: letter, path }
  const ffprobe = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const duration = ffprobe.format.duration || 0
  const mode = query.mode || 'transcode'
  if (!VALID_MODES.includes(mode)) {
    throw new RequestError('Invalid playback mode', 400)
  }

  if (query.resolution && !(VALID_RESOLUTIONS as readonly string[]).includes(query.resolution)) {
    throw new RequestError('Invalid resolution', 400)
  }

  const segmentDuration = 10

  const encodedLetter = encodeURIComponent(letter)
  const encodedPath = encodeURIComponent(path)
  const baseUrl = `/api/media/files/${encodedLetter}/${encodedPath}`

  const playlist = generateMediaPlaylist({
    duration,
    segmentDuration,
    baseUrl,
    mode,
    resolution: query.resolution,
  })

  await logger.verbose({ message: `Generated media playlist for ${letter}:${path}`, data: { mode, duration } })

  response.writeHead(200, {
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Content-Length': Buffer.byteLength(playlist),
    'Cache-Control': 'no-cache',
  })
  response.end(playlist)

  return BypassResult()
}
