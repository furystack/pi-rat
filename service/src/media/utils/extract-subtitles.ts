import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { PiRatFile } from 'common'
import { Drive, getFileName } from 'common'
import { promises } from 'fs'
import { FfprobeService } from '../../ffprobe-service.js'
import { execAsync } from '../../utils/exec-async.js'
import { getPhysicalParentPath, getPhysicalPath } from '../../utils/physical-path-utils.js'

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

  const fullPath = getPhysicalPath(drive, file)
  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const subtitles: Array<{
    streamIndex: number
  }> =
    ffprobeResult.streams
      .filter((stream) => (stream.codec_type as any) === 'subtitle' && stream.codec_name === 'subrip')
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
