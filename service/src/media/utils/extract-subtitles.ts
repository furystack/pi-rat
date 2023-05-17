import { promises } from 'fs'
import { join } from 'path'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { Drive } from 'common'
import { getDataSetFor } from '@furystack/repository'
import ffprobe from 'ffprobe'
import { existsAsync } from '../../utils/exists-async.js'
import { execAsync } from '../../utils/exec-async.js'

export const extractSubtitles = async ({
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
  const logger = getLogger(injector).withScope('extract-subtitles')

  logger.verbose({
    message: `Starting to extract subtitles for movie file '${fileName}'`,
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

  const subtitles: Array<{
    streamIndex: number
  }> =
    ffprobeResult.streams
      .filter((stream) => (stream.codec_type as any) === 'subtitle')
      .map((stream) => ({
        streamIndex: stream.index,
      })) || []

  const cwd = join(drive.physicalPath, path)
  await promises.mkdir(cwd, { recursive: true })

  await execAsync(
    `ffmpeg -i ${fullPath} -f webvtt ${subtitles
      .map((s, i) => `-map 0:s:${i} ${fileName}-subtitle-${s.streamIndex}.vtt`)
      .join(' ')}`,
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
      subtitles,
    },
  })
}
