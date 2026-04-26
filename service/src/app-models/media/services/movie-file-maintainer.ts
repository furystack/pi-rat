import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
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
import { createConfigWatcher } from '../../../utils/config-watcher.js'
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
  fullSync(): Promise<ScanProgress>
  checkFolderForPossibleMovieFiles(
    path: string,
    drive: Drive,
    alreadyAddedMovieFiles: MovieFile[],
  ): Promise<PiRatFile[]>
}

export const MovieMaintainerService: Token<MovieMaintainerService, 'singleton'> = defineService({
  name: 'pi-rat/MovieMaintainerService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { inject, injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'movie-maintainer' })
    const fileWatcherService = inject(FileWatcherService)

    let config: MoviesConfig | undefined
    let fileWatcherSubscriptions: Disposable[] = []

    const configDataSet = getDataSetFor(systemInjector, ConfigDataSet)
    const movieFileDataSet = getDataSetFor(systemInjector, MovieFileDataSet)
    const driveDataSet = getDataSetFor(systemInjector, DriveDataSet)

    const service: MovieMaintainerService = {
      fullSync: async () => fullSync(),
      checkFolderForPossibleMovieFiles: async (path, drive, alreadyAddedMovieFiles) =>
        checkFolderForPossibleMovieFiles(path, drive, alreadyAddedMovieFiles),
    }

    const onUnlink = async (file: PiRatFile) => {
      try {
        const existingMovies = await movieFileDataSet.find(systemInjector, {
          filter: { path: { $eq: file.path }, driveLetter: { $eq: file.driveLetter } },
        })
        if (existingMovies.length > 0) {
          await logger.verbose({
            message: `🎬  A movie file has been removed, cleaning up '${file.path}' from DB...`,
            data: file,
          })
          await movieFileDataSet.remove(systemInjector, ...existingMovies.map((m) => m.id))
        }
      } catch (error) {
        await logger.error({ message: '🎬  Failed to unlink movie', data: { error, file } })
      }
    }

    const onUnlinkDir = async (file: PiRatFile) => {
      try {
        const normalizedPath = PathHelper.normalize(file.path)
        const existingMovies = await movieFileDataSet.find(systemInjector, {
          filter: { path: { $like: `${normalizedPath}%` }, driveLetter: { $eq: file.driveLetter } },
        })
        if (existingMovies.length > 0) {
          await logger.verbose({
            message: `🎬  A folder has been removed, cleaning up movie files inside...`,
            data: { file, entries: existingMovies.map((movie) => ({ path: movie.path })) },
          })
          await movieFileDataSet.remove(systemInjector, ...existingMovies.map((m) => m.id))
        }
      } catch (error) {
        await logger.error({
          message: '🎬  Failed to unlink movie when deleted its directory',
          data: { error, file },
        })
      }
    }

    const shouldTryLinkMovie = (file: PiRatFile): boolean => {
      if (!config) return false
      if (config.value.watchFiles === 'all') return true
      if (
        config.value.watchFiles.some(
          (watchConfig) =>
            watchConfig.drive === file.driveLetter && (!watchConfig.path || file.path.startsWith(watchConfig.path)),
        )
      ) {
        return true
      }
      return false
    }

    const shouldAutoExtractSubtitles = (): boolean => !!config?.value.autoExtractSubtitles

    const onAdd = async (file: PiRatFile) => {
      try {
        if (shouldTryLinkMovie(file)) {
          const result = await linkMovie({ injector: systemInjector, file })
          if (result.status === 'linked' && shouldAutoExtractSubtitles()) {
            await logger.verbose({
              message: `🎬  Auto extracting subtitles for movie file '${file.path}'...`,
              data: file,
            })
            try {
              await extractSubtitles({ injector: systemInjector, file })
            } catch (error) {
              await logger.error({
                message: `🎬  Failed to auto extract subtitles for movie file '${file.path}'`,
                data: { error, file },
              })
            }
          }
          return result
        }
        return { status: 'skipped' } as const
      } catch (error) {
        await logger.error({
          message: `🎬  Failed to link movie '${file.driveLetter}:${file.path}'`,
          data: { error, file },
        })
        return { status: 'failed' } as const
      }
    }

    const checkFolderForPossibleMovieFiles = async (
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
            checkFolderForPossibleMovieFiles(join(path, entry.name), drive, alreadyAddedMovieFiles),
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

    const fullSync = async (): Promise<ScanProgress> => {
      await logger.information({ message: '🎬  Starting full sync of movie files...' })

      const [drives, alreadyAddedMovieFiles] = await Promise.all([
        driveDataSet.find(systemInjector, {}),
        movieFileDataSet.find(systemInjector, {}),
      ])

      await logger.verbose({ message: `🎬  Starting checking files on ${drives.length} drives...` })

      const allPossibleMovieFiles = (
        await Promise.all(
          drives.map(async (drive) => service.checkFolderForPossibleMovieFiles('', drive, alreadyAddedMovieFiles)),
        )
      ).flat()

      await logger.information({
        message: `🎬  Found ${allPossibleMovieFiles.length} possible movie files. Starting to link movies...`,
      })

      const progress = createScanProgress(allPossibleMovieFiles.length)

      // Sequential to respect OMDB API rate limits.
      for (const file of allPossibleMovieFiles) {
        const result = await onAdd(file)
        updateScanProgress(progress, result.status)
        const processed = getProcessedCount(progress)
        if (processed > 0 && processed % PROGRESS_LOG_INTERVAL === 0) {
          await logger.information({
            message: `🎬  Sync progress: ${processed}/${progress.total}`,
            data: { progress },
          })
        }
      }

      await logger.information({ message: `🎬  Full sync finished.`, data: { progress } })
      return progress
    }

    const setupFileWatchers = () => {
      fileWatcherSubscriptions.push(
        fileWatcherService.subscribe('add', (file) => void onAdd(file)),
        fileWatcherService.subscribe('unlinkDir', (dir) => void onUnlinkDir(dir)),
        fileWatcherService.subscribe('unlink', (file) => void onUnlink(file)),
      )
    }

    const teardownFileWatchers = () => {
      for (const sub of fileWatcherSubscriptions) sub[Symbol.dispose]()
      fileWatcherSubscriptions = []
    }

    setupFileWatchers()

    const configWatcher = createConfigWatcher<MoviesConfig>({
      configDataSet,
      systemInjector,
      logger,
      configId: 'MOVIES_CONFIG',
      serviceName: 'Movie Maintainer',
      onChange: (newConfig) => {
        config = newConfig
        if (newConfig?.value.fullSyncOnStartup) {
          void fullSync().catch((error) => {
            void logger.error({ message: '🎬  Full sync failed', data: { error } })
          })
        }
      },
    })

    void configWatcher.init().catch((error) => {
      void logger.error({ message: '🎬  Failed to initialize MovieMaintainerService', data: { error } })
    })

    onDispose(() => {
      teardownFileWatchers()
      configWatcher.dispose()
    })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    return service
  },
})

export const useMovieFileMaintainer = (injector: Injector) => {
  injector.get(MovieMaintainerService)
}
