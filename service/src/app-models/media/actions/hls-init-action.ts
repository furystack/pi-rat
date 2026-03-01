import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import { spawn } from 'child_process'
import type { HlsInitEndpoint, PlaybackMode } from 'common'
import mime from 'mime'
import { StreamFileActionCaches } from '../services/stream-file-action-caches.js'

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

  const cache = injector.getInstance(StreamFileActionCaches)

  const ffmpegArgs = await cache.ffMpegArgsCache.get({
    file: { driveLetter: letter, path },
    queryParams: {
      from: 0,
      to: 0,
      mode,
      audio: { trackId: query.audioTrack ?? 0 },
    },
    injector,
  })

  // Replace the duration arg: -t 0 would produce nothing, so use -t 1 and
  // we'll only keep the ftyp+moov boxes from the output
  const tIdx = ffmpegArgs.indexOf('-t')
  if (tIdx >= 0) {
    ffmpegArgs[tIdx + 1] = '0.001'
  }

  const mimeType = mime.getType('mp4')
  response.writeHead(200, {
    'Content-Type': mimeType || 'video/mp4',
    'Cache-Control': 'public, max-age=86400',
  })

  await logger.verbose({ message: `Generating init segment for ${letter}:${path}` })

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const chunks: Buffer[] = []
  ffmpegProcess.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))

  ffmpegProcess.on('close', () => {
    const fullBuffer = Buffer.concat(chunks)

    // Extract ftyp + moov boxes only (the init segment)
    let pos = 0
    let initEnd = 0
    while (pos < fullBuffer.length) {
      if (pos + 8 > fullBuffer.length) break
      const size = fullBuffer.readUInt32BE(pos)
      const boxType = fullBuffer.toString('ascii', pos + 4, pos + 8)
      if (size < 8) break
      pos += size
      if (boxType === 'ftyp' || boxType === 'moov') {
        initEnd = pos
      }
      if (boxType === 'moof') break
    }

    response.end(fullBuffer.subarray(0, initEnd))
  })

  ffmpegProcess.on('error', (err) => {
    void logger.error({ message: `ffmpeg init error: ${err.message}` })
    response.end()
  })

  return BypassResult()
}
