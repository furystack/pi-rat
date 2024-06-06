import { promises } from 'fs'
import { join } from 'path'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import type { PiRatFile } from 'common'
import { Drive, getFileName, getParentPath, getPhysicalPath } from 'common'
import { getDataSetFor } from '@furystack/repository'
import ffprobe from 'ffprobe'
import { existsAsync } from '../../utils/exists-async.js'
import { execAsync } from '../../utils/exec-async.js'

export const extractAudio = async ({ injector, file }: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(injector).withScope('extract-audio-tracks')

  logger.verbose({
    message: `Starting to extract audio tracks for movie file '${file}'`,
    data: {
      file,
    },
  })

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, file.driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${file.driveLetter}' not found`)
  }

  const fullPath = getPhysicalPath(drive, file)

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

  logger.information({
    message: `Subtitles has been extracted from stream for movie '${fileName}'`,
    data: {
      file,
      audioTracks,
    },
  })
}
