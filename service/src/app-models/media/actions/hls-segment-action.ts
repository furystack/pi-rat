import { getLogger } from '@furystack/logging'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import { spawn } from 'child_process'
import type { MediaApi } from 'common'
import mime from 'mime'
import { StreamFileActionCaches } from '../services/stream-file-action-caches.js'

type HlsSegmentEndpoint = MediaApi['GET']['/files/:letter/:path/segment/:index']

export const HlsSegmentAction: RequestAction<HlsSegmentEndpoint> = async ({
  injector,
  getUrlParams,
  getQuery,
  response,
}) => {
  const logger = getLogger(injector).withScope('HlsSegmentAction')
  const { letter, path } = getUrlParams()
  const query = getQuery()

  const from = query.from ?? 0
  const to = query.to ?? from + 10
  const mode = query.mode ?? 'transcode'

  const mimeType = mime.getType('mp4')
  response.writeHead(200, {
    'Content-Type': mimeType || 'video/mp4',
    'Cache-Control': mode === 'remux' || mode === 'direct-play' ? 'public, max-age=3600' : 'no-cache',
  })

  const cache = injector.getInstance(StreamFileActionCaches)

  const resolutionMap: Record<string, string> = {
    '1080p': '1080p',
    '720p': '720p',
    '480p': '480p',
    '360p': '360p',
  }

  const ffmpegArgs = await cache.ffMpegArgsCache.get({
    file: { driveLetter: letter, path },
    queryParams: {
      from,
      to,
      mode,
      audio: { trackId: 0 },
      ...(mode === 'transcode' && query.resolution
        ? { video: { codec: 'libx264', resolution: resolutionMap[query.resolution] as '1080p' } }
        : {}),
    },
    injector,
  })

  const abortController = new AbortController()

  await logger.verbose({ message: `Spawning ffmpeg for HLS segment`, data: { from, to, mode } })

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    signal: abortController.signal,
  })

  response.on('close', () => {
    abortController.abort()
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
    response.end()
  })

  return BypassResult()
}
