import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { StreamEndpoint } from 'common'
import { Drive } from 'common'
import ffmpeg from 'fluent-ffmpeg'
import mime from 'mime'
import { join } from 'path'

export const StreamAction: RequestAction<StreamEndpoint> = async ({ injector, getUrlParams, response, getQuery }) => {
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

  const command = ffmpeg(fullPath)
    .format('mp4')
    .outputOptions(['-movflags empty_moov+default_base_moof+frag_keyframe'])
    .addOutputOption('-map 0:v:0')

  if (from) {
    command.seekInput(from)
  }

  if (to) {
    command.duration(to - from)
  }

  if (audio) {
    if (!isNaN(audio.trackId)) {
      command.addOutputOption(`-map 0:a:${audio.trackId}`)
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
  }

  command.on('start', (commandLine) => {
    logger.verbose({ message: `Spawned Ffmpeg with command: ${commandLine}` })
  })

  try {
    command
      .on('error', (err, stdout, stderr) => {
        logger.error({ message: `an error happened: ${err}`, data: { err, stdout, stderr } })
      })
      .on('end', () => {
        logger.verbose({ message: 'file has been converted succesfully' })
      })
      .on('progress', (progress) => {
        logger.verbose({ message: `Processing: ${progress.percent}%` })
      })
      .pipe(response, { end: true })
  } catch (error) {
    console.error('Stream error', error)
  }

  return BypassResult()
}
