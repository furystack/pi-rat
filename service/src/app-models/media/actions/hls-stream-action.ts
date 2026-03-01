import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { serializeToQueryString } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { HlsStreamEndpoint, PlaybackMode } from 'common'
import { TranscodingSessionService } from '../services/transcoding-session.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']

export const HlsStreamAction: RequestAction<HlsStreamEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
  response,
}) => {
  const logger = getLogger(injector).withScope('HlsStreamAction')
  const { letter, path } = getUrlParams()
  const query = getQuery()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const mode: PlaybackMode = query.mode ?? 'transcode'
  if (!VALID_MODES.includes(mode)) {
    throw new RequestError('Invalid playback mode', 400)
  }

  const sessionService = injector.getInstance(TranscodingSessionService)

  const session = await sessionService.getOrCreateSession({
    driveLetter: letter,
    path,
    mode,
    audioTrackId: query.audioTrack ?? 0,
    resolution: query.resolution,
  })

  const playlistContent = await sessionService.readPlaylist(session)
  if (!playlistContent) {
    throw new RequestError('Failed to generate HLS playlist', 500)
  }

  // Build FuryStack-serialized query strings for the rewritten URLs
  const encodedLetter = encodeURIComponent(letter)
  const encodedPath = encodeURIComponent(path)
  const baseUrl = `/api/media/files/${encodedLetter}/${encodedPath}`

  const queryParams = {
    mode,
    audioTrack: query.audioTrack ?? 0,
    ...(query.resolution ? { resolution: query.resolution } : {}),
  }
  const serializedQuery = serializeToQueryString(queryParams)

  // Rewrite local filenames to API URLs with proper FuryStack-serialized query params
  const rewritten = playlistContent
    .replace(/URI="init\.mp4"/g, `URI="${baseUrl}/init.mp4?${serializedQuery}"`)
    .replace(/segment(\d+)\.m4s/g, (_match, idx) => `${baseUrl}/segment/${idx}.m4s?${serializedQuery}`)

  await logger.verbose({ message: `Serving HLS playlist for ${letter}:${path}`, data: { mode } })

  response.writeHead(200, {
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Content-Length': Buffer.byteLength(rewritten),
    'Cache-Control': 'no-cache',
  })
  response.end(rewritten)

  return BypassResult()
}
