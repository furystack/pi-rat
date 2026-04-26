import { Cache } from '@furystack/cache'
import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { Semaphore } from '@furystack/utils'
import type { PiRatFile, FfprobeData } from 'common'
import { DriveDataSet } from './app-models/drives/setup-drives.js'
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

export interface FfprobeService extends Disposable {
  getFfprobeForPiratFile(file: PiRatFile): Promise<FfprobeResult>
  getFfprobeForPath(path: string): Promise<FfprobeResult>
}

export class FfprobeServiceImpl implements FfprobeService {
  private readonly semaphore = new Semaphore(3)

  private readonly piRatFileCache: Cache<FfprobeResult, [PiRatFile]>
  private readonly physicalFileCache: Cache<FfprobeResult, [string]>

  constructor(
    private readonly logger: ScopedLogger,
    private readonly systemInjector: Injector,
  ) {
    this.physicalFileCache = new Cache({
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

    this.piRatFileCache = new Cache({
      capacity: 100,
      load: async (file: PiRatFile) => {
        const driveDataSet = getDataSetFor(this.systemInjector, DriveDataSet)
        const drive = await driveDataSet.get(this.systemInjector, file.driveLetter)
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

    this.piRatFileCache.addListener('onLoadError', ({ args, error }) => {
      void this.logger.error({
        message: `Background cache load failed for file '${args[0].path}'`,
        data: { driveLetter: args[0].driveLetter, error },
      })
    })
  }

  public getFfprobeForPiratFile = async (file: PiRatFile) => this.piRatFileCache.get(file)
  public getFfprobeForPath = async (path: string) => this.physicalFileCache.get(path)

  public [Symbol.dispose](): void {
    this.piRatFileCache[Symbol.dispose]()
    this.physicalFileCache[Symbol.dispose]()
  }
}

export const FfprobeService: Token<FfprobeService, 'singleton'> = defineService({
  name: 'pi-rat/FfprobeService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'ffprobe-service' })
    const impl = new FfprobeServiceImpl(logger, systemInjector)
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    return impl
  },
})
