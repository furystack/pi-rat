import { promises } from 'fs'
import { join } from 'path'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { Drive } from 'common'
import { getDataSetFor } from '@furystack/repository'
import ffprobe from 'ffprobe'
import { existsAsync } from '../../utils/exists-async.js'
import { execAsync } from '../../utils/exec-async.js'

export const extractAudio = async ({
  injector,
  driveLetter,
  path,
  fileName,
}: {
  injector: Injector
  driveLetter: string
  path: string
  fileName: string
}) => {
  const logger = getLogger(injector).withScope('extract-audio-tracks')

  logger.verbose({
    message: `Starting to extract audio tracks for movie file '${fileName}'`,
    data: {
      driveLetter,
      path,
      fileName,
    },
  })

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${driveLetter}' not found`)
  }

  const fullPath = join(drive.physicalPath, path, fileName)

  if (!(await existsAsync(fullPath))) {
    throw new Error(`File '${fullPath}' does not exist`)
  }

  const ffprobeResult = await ffprobe(fullPath, { path: 'ffprobe' })

  const audioTracks: Array<{
    streamIndex: number
  }> =
    ffprobeResult.streams
      .filter((stream) => stream.codec_type === 'audio')
      .map((stream) => ({
        streamIndex: stream.index,
      })) || []

  const cwd = join(drive.physicalPath, path)
  await promises.mkdir(cwd, { recursive: true })

  await execAsync(
    `ffmpeg -i ${fullPath} -acodec libopus ${audioTracks
      .map((s, i) => `-map 0:a:${i} -acodec aac ${fileName}-audio-track-${s.streamIndex}.aac`)
      .join(' ')} -y`,
    {
      cwd,
    },
  )

  logger.information({
    message: `Subtitles has been extracted from stream for movie '${fileName}'`,
    data: {
      driveLetter,
      path,
      fileName,
      audioTracks,
    },
  })
}
