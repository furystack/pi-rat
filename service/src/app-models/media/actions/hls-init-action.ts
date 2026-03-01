import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { HlsInitEndpoint, PlaybackMode } from 'common'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'
import mime from 'mime'
import { TranscodingSessionService } from '../services/transcoding-session.js'

const VALID_MODES: PlaybackMode[] = ['direct-play', 'remux', 'direct-stream', 'transcode']

export const HlsInitAction: RequestAction<HlsInitEndpoint> = async ({ injector, getUrlParams, getQuery, response }) => {
  const logger = getLogger(injector).withScope('HlsInitAction')
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

  // The session should already exist (created when stream.m3u8 was requested)
  let session = sessionService.getSession(letter, path, mode, query.audioTrack ?? 0)
  if (!session) {
    // Create one if it doesn't exist (init might be requested before stream.m3u8)
    session = await sessionService.getOrCreateSession({
      driveLetter: letter,
      path,
      mode,
      audioTrackId: query.audioTrack ?? 0,
    })
  }

  const initPath = join(session.sessionDir, 'init.mp4')
  const ready = await sessionService.waitForFile(initPath, session)
  if (!ready) {
    throw new RequestError('Init segment not available', 504)
  }

  const fileStat = await stat(initPath)
  const mimeType = mime.getType('mp4')

  response.writeHead(200, {
    'Content-Type': mimeType || 'video/mp4',
    'Content-Length': fileStat.size,
    'Cache-Control': 'public, max-age=86400',
  })

  createReadStream(initPath).pipe(response)

  await logger.verbose({ message: `Served init segment for ${letter}:${path}` })

  return BypassResult()
}
