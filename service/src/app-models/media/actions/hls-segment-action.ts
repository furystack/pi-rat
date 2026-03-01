import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import { spawn } from 'child_process'
import type { HlsSegmentEndpoint, PlaybackMode } from 'common'
import mime from 'mime'
import { SegmentCache } from '../services/segment-cache.js'
import { StreamFileActionCaches } from '../services/stream-file-action-caches.js'

const VALID_RESOLUTIONS = ['1080p', '720p', '480p', '360p'] as const
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
  if (isNaN(segmentIndex) || segmentIndex < 0) {
    throw new RequestError('Invalid segment index', 400)
  }

  const from = query.from ?? 0
  const to = query.to ?? from + 10
  if (from < 0 || to <= from) {
    throw new RequestError('Invalid time range', 400)
  }

  const mode: PlaybackMode = query.mode ?? 'transcode'
  if (!VALID_MODES.includes(mode)) {
    throw new RequestError('Invalid playback mode', 400)
  }

  const resolution = query.resolution as (typeof VALID_RESOLUTIONS)[number] | undefined
  if (resolution && !VALID_RESOLUTIONS.includes(resolution)) {
    throw new RequestError('Invalid resolution', 400)
  }

  const segmentCache = injector.getInstance(SegmentCache)

  const cachedStream = await segmentCache.get(letter, path, segmentIndex, mode, resolution)
  if (cachedStream) {
    const mimeType = mime.getType('mp4')
    response.writeHead(200, {
      'Content-Type': mimeType || 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
    })
    cachedStream.pipe(response)
    return BypassResult()
  }

  const mimeType = mime.getType('mp4')
  response.writeHead(200, {
    'Content-Type': mimeType || 'video/mp4',
    'Cache-Control': mode === 'remux' || mode === 'direct-play' ? 'public, max-age=3600' : 'no-cache',
  })

  const cache = injector.getInstance(StreamFileActionCaches)

  const ffmpegArgs = await cache.ffMpegArgsCache.get({
    file: { driveLetter: letter, path },
    queryParams: {
      from,
      to,
      mode,
      audio: { trackId: query.audioTrack ?? 0 },
      ...(mode === 'transcode' && resolution && VALID_RESOLUTIONS.includes(resolution)
        ? { video: { codec: 'libx264', resolution } }
        : {}),
    },
    injector,
  })

  const abortController = new AbortController()

  await logger.verbose({ message: `Spawning ffmpeg for HLS segment`, data: { from, to, mode, segmentIndex } })

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    signal: abortController.signal,
  })

  response.on('close', () => {
    abortController.abort()
  })

  const chunks: Buffer[] = []
  ffmpegProcess.stdout.on('data', (chunk: Buffer) => {
    chunks.push(chunk)
  })

  ffmpegProcess.stdout.pipe(response)

  ffmpegProcess.stderr.on('data', (data: Buffer) => {
    void logger.verbose({ message: `ffmpeg stderr: ${data.toString()}` })
  })

  ffmpegProcess.on('error', (err) => {
    void logger.error({ message: `ffmpeg process error: ${err.message}`, data: { err } })
    response.end()
  })

  ffmpegProcess.on('close', (code) => {
    void logger.verbose({ message: `ffmpeg process exited with code ${code}` })
    if (code === 0 && chunks.length > 0) {
      const fullBuffer = Buffer.concat(chunks)
      void segmentCache.put(letter, path, segmentIndex, mode, fullBuffer, resolution)
    }
    response.end()
  })

  return BypassResult()
}
