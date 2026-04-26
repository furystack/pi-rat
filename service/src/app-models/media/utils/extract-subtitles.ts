import { DriveDataSet } from '../../drives/setup-drives.js'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import type { PiRatFile } from 'common'
import { getFileName } from 'common'
import { promises } from 'fs'
import { spawn } from 'child_process'
import { FfprobeService } from '../../../ffprobe-service.js'
import { getPhysicalParentPath, getPhysicalPath } from '../../../utils/physical-path-utils.js'

const EXTRACTABLE_TEXT_CODECS = ['subrip', 'ass', 'ssa', 'mov_text', 'webvtt']

const spawnAsync = (command: string, args: string[], options: { cwd: string }): Promise<void> =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr.slice(0, 500)}`))
      }
    })
    proc.on('error', reject)
  })

export const extractSubtitles = async ({ injector, file }: { injector: Injector; file: PiRatFile }) => {
  const logger = getLogger(injector).withScope('extract-subtitles')

  await logger.verbose({
    message: `Starting to extract subtitles for movie file '${file.driveLetter}:${file.path}'`,
    data: file,
  })

  const drive = await getDataSetFor(injector, DriveDataSet).get(injector, file.driveLetter)

  if (!drive) {
    throw new Error(`Drive with letter '${file.driveLetter}' not found`)
  }

  const fullPath = getPhysicalPath(drive, file)
  const ffprobeResult = await injector.get(FfprobeService).getFfprobeForPiratFile(file)

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

  const ffmpegArgs = ['-i', fullPath]
  for (const s of subtitles) {
    ffmpegArgs.push('-map', `0:s:${s.relativeIndex}`, '-c:s', 'webvtt', `${fileName}-subtitle-${s.streamIndex}.vtt`)
  }
  ffmpegArgs.push('-y')

  await spawnAsync('ffmpeg', ffmpegArgs, { cwd })

  await logger.information({
    message: `Subtitles extracted for movie '${fileName}'`,
    data: { file, subtitles: subtitles.map((s) => ({ streamIndex: s.streamIndex, codec: s.codecName })) },
  })
}
