import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { JsonResult } from '@furystack/rest-service'
import type { RequestAction } from '@furystack/rest-service'
import type { HlsSessionTeardownEndpoint, PlaybackMode } from 'common'
import { TranscodingSessionService } from '../services/transcoding-session.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']

export const HlsSessionTeardownAction: RequestAction<HlsSessionTeardownEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
}) => {
  const logger = getLogger(injector).withScope('HlsSessionTeardownAction')
  const { letter, path } = getUrlParams()
  const query = getQuery()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const mode: PlaybackMode = query.mode || 'transcode'
  if (!VALID_MODES.includes(mode)) {
    throw new RequestError('Invalid playback mode', 400)
  }

  const sessionService = injector.getInstance(TranscodingSessionService)
  sessionService.removeSession(letter, path, mode, query.audioTrack ?? 0, query.resolution)

  await logger.verbose({
    message: `Tore down HLS session for ${letter}:${path}`,
    data: { mode, audioTrack: query.audioTrack },
  })

  return JsonResult({ success: true })
}
