import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { BypassResult } from '@furystack/rest-service'
import type { StreamEndpoint } from 'common'
import { Drive } from 'common'
import ffmpeg from 'fluent-ffmpeg'
import mime from 'mime'
import { extname, join } from 'path'

export const StreamAction: RequestAction<StreamEndpoint> = async ({
  injector,
  getUrlParams,
  //getQuery,
  request,
  response,
}) => {
  const logger = getLogger(injector).withScope('StreamAction')

  // const { audioCodec, videoCodec } = getQuery()
  const { letter, path } = getUrlParams()

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const fullPath = join(drive.physicalPath, path)
  // const fileStats = await stat(fullPath)
  // const fileSize = fileStats.size
  const mimeType = mime.getType(extname(path))
  const mimeHeader = mimeType ? { 'Content-Type': mimeType } : {}
  const { range } = request.headers

  if (range) {
    // const parts = range.replace(/bytes=/, '').split('-')
    // const start = parseInt(parts[0], 10)
    // const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    // const chunksize = end - start + 1
    const head = {
      // 'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      // 'Accept-Ranges': 'bytes',
      // 'Content-Length': chunksize,
      ...mimeHeader,
    }
    response.writeHead(200, head)

    // const calculatedSeekOffset = start / fileSize

    ffmpeg(fullPath)
      .outputOptions(['-movflags isml+frag_keyframe'])
      // .toFormat('mp4')
      // .withAudioCodec('copy')
      // .seekInput(seekOffset || 0)
      // .map('0:v:0')
      // .map(`${audioTrackId}:a:1`)
      .videoCodec('copy')
      .format('matroska')
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
  } else {
    response.writeHead(200, mimeHeader)
    response.end()
  }

  return BypassResult()
}
