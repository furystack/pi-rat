import { Cache } from '@furystack/cache'
import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Drive, PiRatFile, type FfprobeData } from 'common'
import { FileWatcherService } from './app-models/drives/file-watcher-service.js'
import { execAsync } from './utils/exec-async.js'
import { existsAsync } from './utils/exists-async.js'
import { getPhysicalPath } from './utils/physical-path-utils.js'

async function runFfprobe(filePath: string): Promise<FfprobeData> {
  const stdout = await execAsync(
    `ffprobe -v error -print_format json -show_format -show_streams -show_chapters ${filePath}`,
    {},
  )
  return JSON.parse(stdout) as FfprobeData
}

async function extractKeyframeTimes(filePath: string): Promise<number[]> {
  const stdout = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries frame=pts_time -of csv=p=0 -skip_frame nokey "${filePath}"`,
    {},
  )
  return stdout
    .split('\n')
    .map((line) => parseFloat(line.trim()))
    .filter((t) => !isNaN(t))
}

export type FfprobeResult = FfprobeData

@Injectable({ lifetime: 'singleton' })
export class FfprobeService {
  @Injected((injector) => getDataSetFor(injector, Drive, 'letter'))
  declare private readonly driveDataSet: DataSet<Drive, 'letter'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'ffprobe-service' }))
  declare private readonly systemInjector: Injector

  private readonly piRatFileCache = new Cache({
    capacity: 100,
    load: async (file: PiRatFile) => {
      const drive = await this.driveDataSet.get(this.systemInjector, file.driveLetter)
      if (!drive) {
        throw new Error(`Drive ${file.driveLetter} not found`)
      }
      const fullPath = getPhysicalPath(drive, file)

      if (!(await existsAsync(fullPath))) {
        throw new Error(`File '${fullPath}' does not exist`)
      }

      return await this.physicalFileCache.get(fullPath)
    },
  })

  private physicalFileCache = new Cache({
    capacity: 100,
    load: async (fullPath: string) => {
      return runFfprobe(fullPath)
    },
  })

  private keyframeCache = new Cache({
    capacity: 50,
    load: async (file: PiRatFile) => {
      const drive = await this.driveDataSet.get(this.systemInjector, file.driveLetter)
      if (!drive) throw new Error(`Drive ${file.driveLetter} not found`)
      return extractKeyframeTimes(getPhysicalPath(drive, file))
    },
  })

  @Injected(FileWatcherService)
  declare private fileWatcherService: FileWatcherService

  public getFfprobeForPiratFile = async (file: PiRatFile) => {
    return await this.piRatFileCache.get(file)
  }

  public getFfprobeForPath = async (path: string) => {
    return await this.physicalFileCache.get(path)
  }

  public getKeyframeTimes = async (file: PiRatFile): Promise<number[]> => {
    return await this.keyframeCache.get(file)
  }
}
