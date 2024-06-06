import { promises } from 'fs'
import { join } from 'path'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import type { PiRatFile } from 'common'
import { Drive, getFileName, getPhysicalParentPath } from 'common'
import { getDataSetFor } from '@furystack/repository'
import ffprobe from 'ffprobe'
import { existsAsync } from '../../utils/exists-async.js'
import { execAsync } from '../../utils/exec-async.js'

export const extractSubtitles = async ({ injector, file }: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(injector).withScope('extract-subtitles')

  logger.verbose({
    message: `Starting to extract subtitles for movie file '${file.driveLetter}:${file.path}'`,
    data: file,
  })

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, file.driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${file.driveLetter}' not found`)
  }

  const fullPath = join(drive.physicalPath, file.path)

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

  const cwd = getPhysicalParentPath(drive, file)
  await promises.mkdir(cwd, { recursive: true })
  const fileName = getFileName(file)
  await execAsync(
    `ffmpeg -i ${fullPath} -f webvtt ${subtitles
      .map((s, i) => `-map 0:s:${i} ${fileName}-subtitle-${s.streamIndex}.vtt`)
      .join(' ')} -y`,
    {
      cwd,
    },
  )

  logger.information({
    message: `Subtitles has been extracted from stream for movie '${fileName}'`,
    data: {
      file,
      subtitles,
    },
  })
}
