import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { PiRatFile } from 'common'
import { Drive, getFileName } from 'common'
import { promises } from 'fs'
import { FfprobeService } from '../../../ffprobe-service.js'
import { execAsync } from '../../../utils/exec-async.js'
import { getPhysicalParentPath, getPhysicalPath } from '../../../utils/physical-path-utils.js'

const EXTRACTABLE_TEXT_CODECS = ['subrip', 'ass', 'ssa', 'mov_text', 'webvtt']

export const extractSubtitles = async ({ injector, file }: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(injector).withScope('extract-subtitles')

  await logger.verbose({
    message: `Starting to extract subtitles for movie file '${file.driveLetter}:${file.path}'`,
    data: file,
  })

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, file.driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${file.driveLetter}' not found`)
  }

  const fullPath = getPhysicalPath(drive, file)
  const ffprobeResult = await injector.getInstance(FfprobeService).getFfprobeForPiratFile(file)

  const subtitles = ffprobeResult.streams
    .filter((stream) => stream.codec_type === 'subtitle' && EXTRACTABLE_TEXT_CODECS.includes(stream.codec_name ?? ''))
    .map((stream, relativeIndex) => ({
      streamIndex: stream.index,
      relativeIndex,
      codecName: stream.codec_name ?? '',
    }))

  if (subtitles.length === 0) {
    await logger.verbose({ message: 'No extractable text subtitles found', data: file })
    return
  }

  const cwd = getPhysicalParentPath(drive, file)
  await promises.mkdir(cwd, { recursive: true })
  const fileName = getFileName(file)

  const mappings = subtitles
    .map((s) => `-map 0:s:${s.relativeIndex} -c:s webvtt ${fileName}-subtitle-${s.streamIndex}.vtt`)
    .join(' ')

  await execAsync(`ffmpeg -i ${fullPath} ${mappings} -y`, { cwd })

  await logger.information({
    message: `Subtitles extracted for movie '${fileName}'`,
    data: { file, subtitles: subtitles.map((s) => ({ streamIndex: s.streamIndex, codec: s.codecName })) },
  })
}
