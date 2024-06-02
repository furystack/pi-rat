import { StoreManager } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import type { Disposable } from '@furystack/utils'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { MovieFile } from 'common'
import { linkMovie } from './link-movie-action.js'
import { FileWatcherService } from '../../drives/file-watcher-service.js'

@Injectable({ lifetime: 'singleton' })
export class MovieMaintainerService {
  @Injected((i) => getLogger(i).withScope('MovieFileMaintainer'))
  private declare logger: ScopedLogger
  private declare injector: Injector
  private onUnlink = async ({ drive, path }: { drive: Drive; path: string }) => {
    try {
      const store = this.injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')
      const parentPath = PathHelper.getParentPath(path) || ''
      const fileName = path.split('/').slice(-1)[0]

      const existingMovies = await store.find({
        filter: {
          path: { $eq: parentPath },
          driveLetter: { $eq: drive.letter },
          fileName: { $eq: fileName },
        },
      })

      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A movie file has been removed, cleaning up '${path}' from DB...`,
          data: { driveLetter: drive.letter, path: parentPath, fileName },
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

  private onUnlinkDir = async ({ drive, path }: { drive: Drive; path: string }) => {
    try {
      const store = this.injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')
      const normalizedPath = PathHelper.normalize(path)

      const existingMovies = await store.find({
        filter: {
          path: { $like: `${normalizedPath}%` },
          driveLetter: { $eq: drive.letter },
        },
      })

      if (existingMovies.length > 0) {
        await this.logger.verbose({
          message: `🎬  A folder has been removed, cleaning up movie files inside...`,
          data: {
            path,
            entries: existingMovies.map((movie) => ({
              path: movie.path,
              fileName: movie.fileName,
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

  private onAdd = async ({ drive, path }: { drive: Drive; path: string }) => {
    try {
      const parentPath = PathHelper.getParentPath(path) || ''
      const fileName = path.split('/').slice(-1)[0]
      await linkMovie({ injector: this.injector, drive: drive.letter, fileName, path: parentPath })
    } catch (error) {
      await this.logger.error({
        message: '🎬  Failed to link movie',
        data: { error },
      })
    }
  }

  @Injected(FileWatcherService)
  private declare fileWatcherService: FileWatcherService

  private declare addSubsciption: Disposable

  private declare unlinkDirSubscription: Disposable

  private declare unlinkSubscription: Disposable

  public init(injector: Injector) {
    const fileWatcherService = injector.getInstance(FileWatcherService)
    this.addSubsciption = fileWatcherService.subscribe('add', this.onAdd)
    this.unlinkDirSubscription = fileWatcherService.subscribe('unlinkDir', this.onUnlinkDir)
    this.unlinkSubscription = fileWatcherService.subscribe('unlink', this.onUnlink)
  }

  public dispose() {
    this.addSubsciption.dispose()
    this.unlinkDirSubscription.dispose()
    this.unlinkSubscription.dispose()
  }
}

export const useMovieFileMaintainer = (injector: Injector) => {
  injector.getInstance(MovieMaintainerService)
}
