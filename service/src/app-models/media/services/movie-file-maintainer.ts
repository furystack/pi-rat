import { useSystemIdentityContext } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getDataSetFor, type DataSet } from '@furystack/repository'
import { PathHelper } from '@furystack/utils'
import type { MoviesConfig, PiRatFile, ScanProgress } from 'common'
import {
  Config,
  Drive,
  createScanProgress,
  getFallbackMetadata,
  getProcessedCount,
  isMovieFile,
  isSampleFile,
  MovieFile,
  updateScanProgress,
} from 'common'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsAsync } from '../../../utils/exists-async.js'
import { FileWatcherService } from '../../drives/file-watcher-service.js'
import { direntToApiModel } from '../../drives/utils/dirent-to-api-model.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

const PROGRESS_LOG_INTERVAL = 50

@Injectable({ lifetime: 'singleton' })
export class MovieMaintainerService {
  @Injected((i) => getLogger(i).withScope('MovieFileMaintainer'))
  declare private logger: ScopedLogger

  @Injected((injector) => getDataSetFor(injector, Config, 'id'))
  declare private configDataSet: DataSet<Config, 'id'>

  @Injected((injector) => getDataSetFor(injector, MovieFile, 'id'))
  declare private movieFileDataSet: DataSet<MovieFile, 'id'>

  @Injected((injector) => getDataSetFor(injector, Drive, 'letter'))
  declare private driveDataSet: DataSet<Drive, 'letter'>

  @Injected((injector) => useSystemIdentityContext({ injector, username: 'movie-maintainer' }))
  declare private systemInjector: Injector

  declare private injector: Injector
  private onUnlink = async (file: PiRatFile) => {
    try {
      const existingMovies = await this.movieFileDataSet.find(this.systemInjector, {
        filter: {
          path: { $eq: file.path },
          driveLetter: { $eq: file.driveLetter },
        },
      })

      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A movie file has been removed, cleaning up '${file.path}' from DB...`,
          data: file,
        })
        await this.movieFileDataSet.remove(this.systemInjector, ...existingMovies.map((m) => m.id))
      }
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to unlink movie',
        data: { error, file },
      })
    }
  }

  private onUnlinkDir = async (file: PiRatFile) => {
    try {
      const normalizedPath = PathHelper.normalize(file.path)

      const existingMovies = await this.movieFileDataSet.find(this.systemInjector, {
        filter: {
          path: { $like: `${normalizedPath}%` },
          driveLetter: { $eq: file.driveLetter },
        },
      })

      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A folder has been removed, cleaning up movie files inside...`,
          data: {
            file,
            entries: existingMovies.map((movie) => ({
              path: movie.path,
            })),
          },
        })
        await this.movieFileDataSet.remove(this.systemInjector, ...existingMovies.map((m) => m.id))
      }
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to unlink movie when deleted its directory',
        data: { error, file },
      })
    }
  }

  private shouldTryLinkMovie = (file: PiRatFile): boolean => {
    if (!this.config) {
      return false
    }
    if (this.config.value.watchFiles === 'all') {
      return true
    }
    if (
      this.config.value.watchFiles.some((watchConfig) => {
        return watchConfig.drive === file.driveLetter && (!watchConfig.path || file.path.startsWith(watchConfig.path))
      })
    ) {
      return true
    }
    return false
  }

  private shouldAutoExtractSubtitles = (): boolean => {
    if (!this.config) {
      return false
    }
    return !!this.config.value.autoExtractSubtitles
  }

  private onAdd = async (file: PiRatFile) => {
    try {
      if (this.shouldTryLinkMovie(file)) {
        const result = await linkMovie({ injector: this.systemInjector, file })
        if (result.status === 'linked' && this.shouldAutoExtractSubtitles()) {
          await this.logger.verbose({
            message: `🎬  Auto extracting subtitles for movie file '${file.path}'...`,
            data: file,
          })
          try {
            await extractSubtitles({
              injector: this.systemInjector,
              file,
            })
          } catch (error) {
            await this.logger.error({
              message: `🎬  Failed to auto extract subtitles for movie file '${file.path}'`,
              data: { error, file },
            })
          }
        }
        return result
      }
      return { status: 'skipped' } as const
    } catch (error) {
      await this.logger.error({
        message: `🎬  Failed to link movie '${file.driveLetter}:${file.path}'`,
        data: { error, file },
      })
      return { status: 'failed' } as const
    }
  }

  @Injected(FileWatcherService)
  declare private fileWatcherService: FileWatcherService

  declare private addSubsciption: Disposable

  declare private unlinkDirSubscription: Disposable

  declare private unlinkSubscription: Disposable

  declare private config: MoviesConfig | undefined

  public checkFolderForPossibleMovieFiles = async (
    path: string,
    drive: Drive,
    alreadyAddedMovieFiles: MovieFile[],
  ): Promise<PiRatFile[]> => {
    const absolutePath = join(drive.physicalPath, path)
    if (!(await existsAsync(absolutePath))) {
      return []
    }
    const entries = await readdir(absolutePath, { withFileTypes: true, encoding: 'utf-8' })
    const fsEntries = entries.map(direntToApiModel)

    const fromDirs = await Promise.all(
      fsEntries
        .filter((entry) => entry.isDirectory)
        .map(async (entry) => {
          return this.checkFolderForPossibleMovieFiles(join(path, entry.name), drive, alreadyAddedMovieFiles)
        }),
    )

    const fromFiles = fsEntries
      .filter((entry) => entry.isFile)
      .filter((entry) => isMovieFile(entry.name))
      .filter((entry) => !isSampleFile(entry.name))
      .filter((entry) => getFallbackMetadata(entry.name))
      .filter(
        (entry) =>
          !alreadyAddedMovieFiles.some(
            (file) => file.path === join(path, entry.name) && file.driveLetter === drive.letter,
          ),
      )
      .map(
        (entry) =>
          ({
            driveLetter: drive.letter,
            path: join(path, entry.name),
          }) as PiRatFile,
      )
    return [...fromDirs.flat(), ...fromFiles] as PiRatFile[]
  }

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: '🎬  Failed to initialize MovieMaintainerService', data: { error } })
    })
  }

  private async initAsync() {
    this.config = (await this.configDataSet.get(this.systemInjector, 'MOVIES_CONFIG')) as MoviesConfig | undefined
    this.addSubsciption = this.fileWatcherService.subscribe('add', (file) => void this.onAdd(file))
    this.unlinkDirSubscription = this.fileWatcherService.subscribe('unlinkDir', (dir) => void this.onUnlinkDir(dir))
    this.unlinkSubscription = this.fileWatcherService.subscribe('unlink', (file) => void this.onUnlink(file))

    if (this.config?.value.fullSyncOnStartup) {
      void this.fullSync().catch((error) => {
        void this.logger.error({ message: '🎬  Full sync on startup failed', data: { error } })
      })
    }
  }

  public async fullSync(): Promise<ScanProgress> {
    await this.logger.information({
      message: '🎬  Starting full sync of movie files...',
    })

    const [drives, alreadyAddedMovieFiles] = await Promise.all([
      this.driveDataSet.find(this.systemInjector, {}),
      this.movieFileDataSet.find(this.systemInjector, {}),
    ])

    await this.logger.verbose({
      message: `🎬  Starting checking files on ${drives.length} drives...`,
    })

    const allPossibleMovieFiles = (
      await Promise.all(
        drives.map(async (drive) => {
          return await this.checkFolderForPossibleMovieFiles('', drive, alreadyAddedMovieFiles)
        }),
      )
    ).flat()

    await this.logger.information({
      message: `🎬  Found ${allPossibleMovieFiles.length} possible movie files. Starting to link movies...`,
    })

    const progress = createScanProgress(allPossibleMovieFiles.length)

    for (const file of allPossibleMovieFiles) {
      const result = await this.onAdd(file)
      updateScanProgress(progress, result.status)

      const processed = getProcessedCount(progress)
      if (processed > 0 && processed % PROGRESS_LOG_INTERVAL === 0) {
        await this.logger.information({
          message: `🎬  Sync progress: ${processed}/${progress.total}`,
          data: { progress },
        })
      }
    }

    await this.logger.information({
      message: `🎬  Full sync finished.`,
      data: { progress },
    })

    return progress
  }

  public [Symbol.dispose]() {
    this.addSubsciption[Symbol.dispose]()
    this.unlinkDirSubscription[Symbol.dispose]()
    this.unlinkSubscription[Symbol.dispose]()
  }
}

export const useMovieFileMaintainer = (injector: Injector) => {
  const configDataSet = getDataSetFor(injector, Config, 'id')

  configDataSet.subscribe('onEntityAdded', ({ entity }) => {
    if (entity.id === 'MOVIES_CONFIG') {
      injector.getInstance(MovieMaintainerService).init()
    }
  })

  configDataSet.subscribe('onEntityUpdated', ({ id }) => {
    if (id === 'MOVIES_CONFIG') {
      injector.getInstance(MovieMaintainerService).init()
    }
  })

  configDataSet.subscribe('onEntityRemoved', ({ key }) => {
    if (key === 'MOVIES_CONFIG') {
      injector.getInstance(MovieMaintainerService)[Symbol.dispose]()
    }
  })

  injector.getInstance(MovieMaintainerService)
}
