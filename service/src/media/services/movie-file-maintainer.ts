import { StoreManager } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { PathHelper } from '@furystack/utils'
import type { PiRatFile } from 'common'
import { MovieFile } from 'common'
import { FileWatcherService } from '../../drives/file-watcher-service.js'
import { linkMovie } from '../utils/link-movie.js'

@Injectable({ lifetime: 'singleton' })
export class MovieMaintainerService {
  @Injected((i) => getLogger(i).withScope('MovieFileMaintainer'))
  declare private logger: ScopedLogger
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

  private onAdd = async (file: PiRatFile) => {
    try {
      await linkMovie({ injector: this.injector, file })
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

  public init(injector: Injector) {
    const fileWatcherService = injector.getInstance(FileWatcherService)
    this.addSubsciption = fileWatcherService.subscribe('add', (file) => void this.onAdd(file))
    this.unlinkDirSubscription = fileWatcherService.subscribe('unlinkDir', (dir) => void this.onUnlinkDir(dir))
    this.unlinkSubscription = fileWatcherService.subscribe('unlink', (file) => void this.onUnlink(file))
  }

  public [Symbol.dispose]() {
    this.addSubsciption[Symbol.dispose]()
    this.unlinkDirSubscription[Symbol.dispose]()
    this.unlinkSubscription[Symbol.dispose]()
  }
}

export const useMovieFileMaintainer = (injector: Injector) => {
  injector.getInstance(MovieMaintainerService)
}
