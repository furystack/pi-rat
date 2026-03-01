import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { HlsSegmentEndpoint, PlaybackMode } from 'common'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'
import mime from 'mime'
import { TranscodingSessionService } from '../services/transcoding-session.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']

export const HlsSegmentAction: RequestAction<HlsSegmentEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
  response,
}) => {
  const logger = getLogger(injector).withScope('HlsSegmentAction')
  const { letter, path, index } = getUrlParams()
  const query = getQuery()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const segmentIndex = parseInt(index, 10)
  if (isNaN(segmentIndex) || segmentIndex < 0 || segmentIndex > 100_000) {
    throw new RequestError('Invalid segment index', 400)
  }

  const mode: PlaybackMode = query.mode ?? 'transcode'
  if (!VALID_MODES.includes(mode)) {
    throw new RequestError('Invalid playback mode', 400)
  }

  const sessionService = injector.getInstance(TranscodingSessionService)

  const session = sessionService.getSession(letter, path, mode, query.audioTrack ?? 0, query.resolution)
  if (!session) {
    throw new RequestError('No active transcoding session', 404)
  }

  const ready = await sessionService.waitForSegment(session, segmentIndex)
  if (!ready) {
    throw new RequestError('Segment not available', 504)
  }

  const segmentPath = join(session.sessionDir, `segment${segmentIndex}.m4s`)
  const fileStat = await stat(segmentPath)

  const mimeType = mime.getType('mp4')
  response.writeHead(200, {
    'Content-Type': mimeType || 'video/mp4',
    'Content-Length': fileStat.size,
    'Cache-Control': 'public, max-age=3600',
  })

  const stream = createReadStream(segmentPath)
  stream.pipe(response)

  await logger.verbose({ message: `Served segment ${segmentIndex} for ${letter}:${path}` })

  return BypassResult()
}
