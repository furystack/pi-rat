import { Cache } from '@furystack/cache'
import { PhysicalStore, StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { Drive, PiRatFile } from 'common'
import fluendFfmpeg, { FfprobeData } from 'fluent-ffmpeg'
import { FileWatcherService } from './drives/file-watcher-service.js'
import { existsAsync } from './utils/exists-async.js'
import { getPhysicalPath } from './utils/physical-path-utils.js'

export type FfprobeResult = FfprobeData

@Injectable({ lifetime: 'singleton' })
export class FfprobeService {
  @Injected((injector) => injector.getInstance(StoreManager).getStoreFor(Drive, 'letter'))
  declare private readonly physicalPathStore: PhysicalStore<Drive, 'letter'>

  private readonly piRatFileCache = new Cache({
    capacity: 100,
    load: async (file: PiRatFile) => {
      const drive = await this.physicalPathStore.get(file.driveLetter)
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
      const ffprobeResult = await new Promise<FfprobeData>((resolve, reject) =>
        fluendFfmpeg.ffprobe(fullPath, (err, data) => (err ? reject(err as Error) : resolve(data))),
      )
      return ffprobeResult
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
