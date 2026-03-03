import { Cache } from '@furystack/cache'
import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { Semaphore } from '@furystack/utils'
import { Drive, PiRatFile, type FfprobeData } from 'common'
import { FileWatcherService } from './app-models/drives/file-watcher-service.js'
import { execFileAsync } from './utils/exec-file-async.js'
import { existsAsync } from './utils/exists-async.js'
import { getPhysicalPath } from './utils/physical-path-utils.js'

async function runFfprobe(filePath: string): Promise<FfprobeData> {
  const stdout = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    '-show_chapters',
    filePath,
  ])
  return JSON.parse(stdout) as FfprobeData
}

export type FfprobeResult = FfprobeData

@Injectable({ lifetime: 'singleton' })
export class FfprobeService {
  @Injected((injector) => getLogger(injector).withScope('FfprobeService'))
  declare private readonly logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Drive, 'letter'))
  declare private readonly driveDataSet: DataSet<Drive, 'letter'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'ffprobe-service' }))
  declare private readonly systemInjector: Injector

  private readonly semaphore = new Semaphore(3)

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
      await this.logger.verbose({ message: `Running ffprobe on '${fullPath}'` })
      return await this.semaphore.execute(async () => {
        try {
          const result = await runFfprobe(fullPath)
          await this.logger.verbose({ message: `ffprobe completed for '${fullPath}'` })
          return result
        } catch (error) {
          await this.logger.error({ message: `ffprobe failed for '${fullPath}'`, data: { error } })
          throw error
        }
      })
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
}
