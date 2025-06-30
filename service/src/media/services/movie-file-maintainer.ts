import { getStoreManager, StoreManager, type PhysicalStore } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { PathHelper } from '@furystack/utils'
import type { PiRatFile } from 'common'
import { Config, Drive, getFallbackMetadata, isMovieFile, isSampleFile, MovieFile } from 'common'
import { readdir } from 'fs/promises'
import { join } from 'path'
import type { MoviesConfig } from '../../../../common/src/models/config/movies-config.js'
import { FileWatcherService } from '../../drives/file-watcher-service.js'
import { direntToApiModel } from '../../drives/utils/dirent-to-api-model.js'
import { existsAsync } from '../../utils/exists-async.js'
import { extractSubtitles } from '../utils/extract-subtitles.js'
import { linkMovie } from '../utils/link-movie.js'

@Injectable({ lifetime: 'singleton' })
export class MovieMaintainerService {
  @Injected((i) => getLogger(i).withScope('MovieFileMaintainer'))
  declare private logger: ScopedLogger

  @Injected((injector) => getStoreManager(injector).getStoreFor(Config, 'id'))
  declare private configStore: PhysicalStore<Config, 'id'>

  declare private injector: Injector
  private onUnlink = async (file: PiRatFile) => {
    try {
      const store = this.injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')

      const existingMovies = await store.find({
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
        await store.remove(existingMovies[0].id)
      }
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to unlink movie',
        data: { error },
      })
    }
  }

  private onUnlinkDir = async (file: PiRatFile) => {
    try {
      const store = this.injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')
      const normalizedPath = PathHelper.normalize(file.path)

      const existingMovies = await store.find({
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
        await store.remove(existingMovies[0].id)
      }
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to unlink movie when deleted its directory',
        data: { error },
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
        await linkMovie({ injector: this.injector, file })
        if (this.shouldAutoExtractSubtitles()) {
          await this.logger.verbose({
            message: `🎬  Auto extracting subtitles for movie file '${file.path}'...`,
            data: file,
          })
          try {
            await extractSubtitles({
              injector: this.injector,
              file,
            })
          } catch (error) {
            await this.logger.error({
              message: `🎬  Failed to auto extract subtitles for movie file '${file.path}'`,
              data: { error },
            })
          }
        }
      }
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to link movie',
        data: { error },
      })
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

  public async init() {
    this.config = (await this.configStore.get('MOVIES_CONFIG')) as MoviesConfig | undefined
    this.addSubsciption = this.fileWatcherService.subscribe('add', (file) => void this.onAdd(file))
    this.unlinkDirSubscription = this.fileWatcherService.subscribe('unlinkDir', (dir) => void this.onUnlinkDir(dir))
    this.unlinkSubscription = this.fileWatcherService.subscribe('unlink', (file) => void this.onUnlink(file))
  }

  public async fullSync() {
    await this.logger.information({
      message: '🎬  Starting full sync of movie files...',
    })

    const drivesStore = this.injector.getInstance(StoreManager).getStoreFor(Drive, 'letter')

    const movieFilesStore = this.injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')

    const [drives, alreadyAddedMovieFiles] = await Promise.all([drivesStore.find({}), movieFilesStore.find({})])

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

    await this.logger.verbose({
      message: `🎬  Found ${allPossibleMovieFiles.length} possible movie files. Starting to link movies...`,
    })

    await Promise.all(
      allPossibleMovieFiles.map(async (file) => {
        await this.onAdd(file)
      }),
    )

    await this.logger.information({
      message: 'Full sync finished.',
    })
  }

  public [Symbol.dispose]() {
    this.addSubsciption[Symbol.dispose]()
    this.unlinkDirSubscription[Symbol.dispose]()
    this.unlinkSubscription[Symbol.dispose]()
  }
}

export const useMovieFileMaintainer = (injector: Injector) => {
  const configStore = injector.getInstance(StoreManager).getStoreFor(Config, 'id')

  configStore.subscribe('onEntityAdded', (config) => {
    if (config.entity.id === 'MOVIES_CONFIG') {
      void injector.getInstance(MovieMaintainerService).init()
    }
  })

  configStore.subscribe('onEntityUpdated', ({ id }) => {
    if (id === 'MOVIES_CONFIG') {
      void injector.getInstance(MovieMaintainerService).init()
    }
  })

  configStore.subscribe('onEntityRemoved', ({ key }) => {
    if (key === 'MOVIES_CONFIG') {
      injector.getInstance(MovieMaintainerService)[Symbol.dispose]()
    }
  })

  injector.getInstance(MovieMaintainerService)
}
