import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { PathHelper } from '@furystack/utils'
import type { Drive, MovieFile, MoviesConfig, PiRatFile, ScanProgress } from 'common'
import {
  createScanProgress,
  getFallbackMetadata,
  getProcessedCount,
  isMovieFile,
  isSampleFile,
  updateScanProgress,
} from 'common'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { type ConfigWatcher, createConfigWatcher } from '../../../utils/config-watcher.js'
import { existsAsync } from '../../../utils/exists-async.js'
import { ConfigDataSet } from '../../config/setup-config-store.js'
import { FileWatcherService } from '../../drives/file-watcher-service.js'
import { DriveDataSet } from '../../drives/setup-drives.js'
import { direntToApiModel } from '../../drives/utils/dirent-to-api-model.js'
import { MovieFileDataSet } from '../media-data-sets.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

const PROGRESS_LOG_INTERVAL = 50

export interface MovieMaintainerService {
  init(): void
  fullSync(): Promise<ScanProgress>
  checkFolderForPossibleMovieFiles(
    path: string,
    drive: Drive,
    alreadyAddedMovieFiles: MovieFile[],
  ): Promise<PiRatFile[]>
}

class MovieMaintainerServiceImpl implements MovieMaintainerService {
  private fileWatcherSubscriptions: Disposable[] = []
  private configWatcher?: ConfigWatcher
  private config: MoviesConfig | undefined

  constructor(
    private readonly logger: ScopedLogger,
    private readonly systemInjector: Injector,
    private readonly fileWatcherService: FileWatcherService,
  ) {}

  private get configDataSet() {
    return getDataSetFor(this.systemInjector, ConfigDataSet)
  }
  private get movieFileDataSet() {
    return getDataSetFor(this.systemInjector, MovieFileDataSet)
  }
  private get driveDataSet() {
    return getDataSetFor(this.systemInjector, DriveDataSet)
  }

  private onUnlink = async (file: PiRatFile) => {
    try {
      const existingMovies = await this.movieFileDataSet.find(this.systemInjector, {
        filter: { path: { $eq: file.path }, driveLetter: { $eq: file.driveLetter } },
      })
      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A movie file has been removed, cleaning up '${file.path}' from DB...`,
          data: file,
        })
        await this.movieFileDataSet.remove(this.systemInjector, ...existingMovies.map((m) => m.id))
      }
    } catch (error) {
      await this.logger.error({ message: '🎬  Failed to unlink movie', data: { error, file } })
    }
  }

  private onUnlinkDir = async (file: PiRatFile) => {
    try {
      const normalizedPath = PathHelper.normalize(file.path)
      const existingMovies = await this.movieFileDataSet.find(this.systemInjector, {
        filter: { path: { $like: `${normalizedPath}%` }, driveLetter: { $eq: file.driveLetter } },
      })
      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A folder has been removed, cleaning up movie files inside...`,
          data: { file, entries: existingMovies.map((movie) => ({ path: movie.path })) },
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
    if (!this.config) return false
    if (this.config.value.watchFiles === 'all') return true
    if (
      this.config.value.watchFiles.some(
        (watchConfig) =>
          watchConfig.drive === file.driveLetter && (!watchConfig.path || file.path.startsWith(watchConfig.path)),
      )
    ) {
      return true
    }
    return false
  }

  private shouldAutoExtractSubtitles = (): boolean => !!this.config?.value.autoExtractSubtitles

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
            await extractSubtitles({ injector: this.systemInjector, file })
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

  private setupFileWatchers() {
    this.fileWatcherSubscriptions.push(
      this.fileWatcherService.subscribe('add', (file) => void this.onAdd(file)),
      this.fileWatcherService.subscribe('unlinkDir', (dir) => void this.onUnlinkDir(dir)),
      this.fileWatcherService.subscribe('unlink', (file) => void this.onUnlink(file)),
    )
  }

  private teardownFileWatchers() {
    for (const sub of this.fileWatcherSubscriptions) sub[Symbol.dispose]()
    this.fileWatcherSubscriptions = []
  }

  public checkFolderForPossibleMovieFiles = async (
    path: string,
    drive: Drive,
    alreadyAddedMovieFiles: MovieFile[],
  ): Promise<PiRatFile[]> => {
    const absolutePath = join(drive.physicalPath, path)
    if (!(await existsAsync(absolutePath))) return []
    const entries = await readdir(absolutePath, { withFileTypes: true, encoding: 'utf-8' })
    const fsEntries = entries.map(direntToApiModel)

    const fromDirs = await Promise.all(
      fsEntries
        .filter((entry) => entry.isDirectory)
        .map(async (entry) =>
          this.checkFolderForPossibleMovieFiles(join(path, entry.name), drive, alreadyAddedMovieFiles),
        ),
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
      .map((entry) => ({ driveLetter: drive.letter, path: join(path, entry.name) }))
    return [...fromDirs.flat(), ...fromFiles] as PiRatFile[]
  }

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: '🎬  Failed to initialize MovieMaintainerService', data: { error } })
    })
  }

  private async initAsync() {
    this.teardownFileWatchers()
    this.setupFileWatchers()

    this.configWatcher?.dispose()
    this.configWatcher = createConfigWatcher<MoviesConfig>({
      configDataSet: this.configDataSet,
      systemInjector: this.systemInjector,
      logger: this.logger,
      configId: 'MOVIES_CONFIG',
      serviceName: 'Movie Maintainer',
      onChange: (config) => {
        this.config = config
        if (config?.value.fullSyncOnStartup) {
          void this.fullSync().catch((error) => {
            void this.logger.error({ message: '🎬  Full sync failed', data: { error } })
          })
        }
      },
    })
    await this.configWatcher.init()
  }

  public async fullSync(): Promise<ScanProgress> {
    await this.logger.information({ message: '🎬  Starting full sync of movie files...' })

    const [drives, alreadyAddedMovieFiles] = await Promise.all([
      this.driveDataSet.find(this.systemInjector, {}),
      this.movieFileDataSet.find(this.systemInjector, {}),
    ])

    await this.logger.verbose({ message: `🎬  Starting checking files on ${drives.length} drives...` })

    const allPossibleMovieFiles = (
      await Promise.all(
        drives.map(async (drive) => this.checkFolderForPossibleMovieFiles('', drive, alreadyAddedMovieFiles)),
      )
    ).flat()

    await this.logger.information({
      message: `🎬  Found ${allPossibleMovieFiles.length} possible movie files. Starting to link movies...`,
    })

    const progress = createScanProgress(allPossibleMovieFiles.length)

    // Sequential to respect OMDB API rate limits.
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

    await this.logger.information({ message: `🎬  Full sync finished.`, data: { progress } })
    return progress
  }

  public dispose() {
    this.teardownFileWatchers()
    this.configWatcher?.dispose()
  }
}

export const MovieMaintainerService: Token<MovieMaintainerService, 'singleton'> = defineService({
  name: 'pi-rat/MovieMaintainerService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { inject, injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'movie-maintainer' })
    const fileWatcherService = inject(FileWatcherService)
    const impl = new MovieMaintainerServiceImpl(logger, systemInjector, fileWatcherService)
    onDispose(() => impl.dispose())
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    return impl
  },
})

export const useMovieFileMaintainer = (injector: Injector) => {
  injector.get(MovieMaintainerService).init()
}
