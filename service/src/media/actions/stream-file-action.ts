import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { StreamFileEndpoint } from 'common'
import { Drive } from 'common'
import ffmpeg from 'fluent-ffmpeg'
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

  const command = ffmpeg(fullPath)
    .format('mp4')
    .outputOptions(['-movflags empty_moov+frag_keyframe+faststart+default_base_moof'])
    .addOutputOption('-map 0:v:0')
    .addOutputOption('-fflags +genpts')
    .addOutputOption('-avoid_negative_ts make_zero')

  if (audio) {
    const audioStreamIndex = audioStreams.findIndex((stream) => stream === audioStream)
    if (audioStreamIndex > -1) {
      command.addOutputOption(`-map 0:a:${audioStreamIndex}`)
    }
    if (audio.audioCodec) {
      command.audioCodec('aac')
    }
    if (audio.bitrate) {
      command.audioBitrate(audio.bitrate)
    }

    if (audio.mixdown) {
      command.audioChannels(2)
    }
  } else {
    command.audioCodec('copy')
  }

  if (video) {
    if (video.codec) {
      command.videoCodec(video.codec)
    }

    if (video.quality) {
      // TODO: Figure out how to set quality
    }

    if (video.resolution) {
      switch (video.resolution) {
        case '4k':
          command.size('3840x2160')
          break
        case '1080p':
          command.size('1920x1080')
          break
        case '720p':
          command.size('1280x720')
          break
        case '480p':
          command.size('854x480')
          break
        case '360p':
          command.size('640x360')
          break
        default:
          break
      }
    }
  } else {
    // command.videoCodec('copy')
  }

  if (from) {
    command.seekInput(from)
  }

  if (to) {
    command.duration(to - from)
  }

  command.on('start', (commandLine) => {
    void logger.verbose({ message: `Spawned Ffmpeg with command: ${commandLine}` })
  })

  try {
    command
      .on('error', (err, stdout, stderr) => {
        void logger.error({ message: `an error happened: ${err.message}`, data: { err, stdout, stderr } })
      })
      .on('end', () => {
        void logger.verbose({ message: 'file has been converted succesfully' })
      })
      .on('progress', (progress) => {
        void logger.verbose({ message: `Processing: ${progress.percent}%` })
      })
      .pipe(response, { end: true })
  } catch (error) {
    await logger.error({ message: 'Stream error', data: { error } })
  }

  return BypassResult()
}
