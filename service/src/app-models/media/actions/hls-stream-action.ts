import { getLogger } from '@furystack/logging'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { generateMediaPlaylist } from '../services/hls-manifest-generator.js'

type HlsStreamEndpoint = MediaApi['GET']['/files/:letter/:path/stream.m3u8']

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
