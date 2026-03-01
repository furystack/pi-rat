import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import { spawn } from 'child_process'
import type { StreamFileEndpoint } from 'common'
import mime from 'mime'
import { StreamFileActionCaches } from '../services/stream-file-action-caches.js'

export const StreamAction: RequestAction<StreamFileEndpoint> = async ({
  injector,
  getUrlParams,
  response,
  getQuery,
}) => {
  const logger = getLogger(injector).withScope('StreamAction')
  const { letter, path } = getUrlParams()

  if (path.includes('..') || path.includes('\0')) {
    throw new RequestError('Invalid path', 400)
  }

  const mimeType = mime.getType('mp4')
  const mimeHeader = mimeType ? { 'Content-Type': mimeType } : {}
  response.writeHead(200, { ...mimeHeader })

  const cache = injector.getInstance(StreamFileActionCaches)

  const ffmpegArgs = await cache.ffMpegArgsCache.get({
    file: {
      driveLetter: letter,
      path,
    },
    queryParams: getQuery(),
    injector,
  })

  // Fast input seeking for better performance

  const abortController = new AbortController()

  await logger.verbose({ message: `Spawning ffmpeg with args: ${ffmpegArgs.join(' ')}` })

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    signal: abortController.signal,
  })

  // Abort ffmpeg if response is terminated
  response.on('close', () => {
    void logger.verbose({ message: 'Response closed, aborting ffmpeg process.' })
    abortController.abort()
  })

  ffmpegProcess.stdout.pipe(response)

  ffmpegProcess.stderr.on('data', (data) => {
    void logger.verbose({ message: `ffmpeg stderr: ${data}` })
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
