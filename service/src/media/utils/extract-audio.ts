import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { PiRatFile } from 'common'
import { Drive, getFileName, getParentPath } from 'common'
import { promises } from 'fs'
import { join } from 'path'
import { FfprobeService } from '../../ffprobe-service.js'
import { execAsync } from '../../utils/exec-async.js'
import { getPhysicalPath } from '../../utils/physical-path-utils.js'

export const extractAudio = async ({ injector, file }: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(injector).withScope('extract-audio-tracks')

  await logger.verbose({
    message: `Starting to extract audio tracks for movie file '${file.driveLetter}:${file.path}'`,
    data: {
      file,
    },
  })

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, file.driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${file.driveLetter}' not found`)
  }

  const fullPath = getPhysicalPath(drive, file)

  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const audioTracks: Array<{
    streamIndex: number
  }> =
    ffprobeResult.streams
      .filter((stream) => stream.codec_type === 'audio')
      .map((stream) => ({
        streamIndex: stream.index,
      })) || []

  const cwd = join(drive.physicalPath, getParentPath(file))
  const fileName = getFileName(file)
  await promises.mkdir(cwd, { recursive: true })

  await execAsync(
    `ffmpeg -i ${fullPath} -acodec libopus ${audioTracks
      .map((s, i) => `-map 0:a:${i} -acodec aac ${fileName}-audio-track-${s.streamIndex}.aac`)
      .join(' ')} -y`,
    {
      cwd,
    },
  )

  await logger.information({
    message: `Subtitles has been extracted from stream for movie '${fileName}'`,
    data: {
      file,
      audioTracks,
    },
  })
}
