import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import { spawn } from 'child_process'
import type { StreamFileEndpoint } from 'common'
import { Drive } from 'common'
import mime from 'mime'
import { join } from 'path'
import { FfprobeService } from '../../ffprobe-service.js'

export const StreamAction: RequestAction<StreamFileEndpoint> = async ({
  injector,
  getUrlParams,
  response,
  getQuery,
}) => {
  const logger = getLogger(injector).withScope('StreamAction')

  const { letter, path } = getUrlParams()
  const { from, to, audio, video } = getQuery()

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const fullPath = join(drive.physicalPath, path)
  const mimeType = mime.getType('mp4')
  const mimeHeader = mimeType ? { 'Content-Type': mimeType } : {}
  const head = {
    ...mimeHeader,
  }
  response.writeHead(200, head)

  const ffprobe = await injector.getInstance(FfprobeService).getFfprobeForPiratFile({ driveLetter: letter, path })

  const audioStreams = ffprobe.streams.filter((stream) => stream.codec_type === 'audio')
  const audioStream = audioStreams.find((track) => track.index === audio?.trackId) || audioStreams[0]
  const videoStream = ffprobe.streams.find((stream) => stream.codec_type === 'video')

  await logger.information({
    message: `Starting stream from ${from} to ${to}, transcodeVideo: ${!!video?.codec}, transcodeAudio: ${!!audio?.audioCodec}`,
    data: { fullPath, from, to, audio, video, audioStream, videoStream },
  })

  // Build ffmpeg args
  const ffmpegArgs: string[] = []

  // Fast input seeking for better performance
  if (typeof from === 'number') {
    ffmpegArgs.push('-ss', String(from))
  }

  ffmpegArgs.push('-i', fullPath, '-f', 'mp4', '-movflags', 'empty_moov+frag_keyframe+faststart+default_base_moof')

  if (typeof to === 'number' && typeof from === 'number') {
    ffmpegArgs.push('-t', String(Math.max(to - from, 1)))
  }

  const audioStreamIndex = Math.max(
    0,
    audioStreams.findIndex((stream) => stream === audioStream),
  )
  ffmpegArgs.push('-map', `0:a:${audioStreamIndex}`)

  if (audio?.audioCodec) {
    ffmpegArgs.push('-c:a', audio.audioCodec)
  } else {
    ffmpegArgs.push('-c:a', 'aac')
    ffmpegArgs.push('-b:a', '128k')
  }
  if (audio?.bitrate) {
    ffmpegArgs.push('-b:a', String(audio.bitrate))
  }
  if (audio?.mixdown) {
    ffmpegArgs.push('-ac', '2')
  }

  const videoStreamIndex = 0
  ffmpegArgs.push('-map', `0:v:${videoStreamIndex}`)
  if (video?.codec) {
    ffmpegArgs.push('-c:v', video.codec)
  } else {
    ffmpegArgs.push('-c:v', 'libx264')
    ffmpegArgs.push('-preset', 'ultrafast') // Use a fast preset for lower latency
  }
  if (video?.resolution) {
    switch (video.resolution) {
      case '4k':
        ffmpegArgs.push('-s', '3840x2160')
        break
      case '1080p':
        ffmpegArgs.push('-s', '1920x1080')
        break
      case '720p':
        ffmpegArgs.push('-s', '1280x720')
        break
      case '480p':
        ffmpegArgs.push('-s', '854x480')
        break
      case '360p':
        ffmpegArgs.push('-s', '640x360')
        break
      default:
        break
    }
  }

  const abortController = new AbortController()

  ffmpegArgs.push('pipe:1') // Output to stdout

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
