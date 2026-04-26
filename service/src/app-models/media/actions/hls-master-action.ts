import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { MediaApi, PlaybackMode } from 'common'
import { FfprobeService } from '../../../ffprobe-service.js'
import { generateMasterPlaylist } from '../services/hls-manifest-generator.js'
import { resolvePlaybackMode } from '../services/stream-builder.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']

type HlsMasterEndpoint = MediaApi['GET']['/files/:letter/:path/master.m3u8']

export const HlsMasterAction: RequestAction<HlsMasterEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
  response,
}) => {
  const logger = getLogger(injector).withScope('HlsMasterAction')
  const { letter, path } = getUrlParams()
  const query = getQuery()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const file = { driveLetter: letter, path }
  const ffprobe = await injector.get(FfprobeService).getFfprobeForPiratFile(file)

  // Normal flow: mode is set by the frontend after calling /playback-info.
  // Fallback codec defaults are conservative — they assume minimal browser
  // support so the server safely falls back to transcode when unknown.
  const mode: PlaybackMode =
    query.mode && VALID_MODES.includes(query.mode)
      ? query.mode
      : resolvePlaybackMode({
          ffprobe,
          codecSupport: {
            video: query.videoCodecs?.split(',').filter(Boolean) ?? ['h264'],
            audio: query.audioCodecs?.split(',').filter(Boolean) ?? ['aac'],
            containers: query.containers?.split(',').filter(Boolean) ?? ['mp4'],
          },
        }).mode

  const playlist = generateMasterPlaylist({
    ffprobe,
    file,
    mode,
    baseUrl: '/api/media',
    audioTrack: query.audioTrack,
    startTime: query.startTime,
  })

  await logger.verbose({ message: `Generated master playlist for ${letter}:${path}`, data: { mode } })

  response.writeHead(200, {
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Content-Length': Buffer.byteLength(playlist),
    'Cache-Control': 'no-cache',
  })
  response.end(playlist)

  return BypassResult()
}
