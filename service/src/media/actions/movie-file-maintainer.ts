import { StoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { PathHelper } from '@furystack/utils'
import type { Drive } from 'common'
import { MovieFile } from 'common'
import { linkMovie } from './link-movie-action.js'

export const onUnlink = (injector: Injector) => {
  const logger = getLogger(injector).withScope('MovieFileMaintainer')
  return async (drive: Drive, path: string) => {
    const store = injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')

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
      logger.verbose({
        message: `🎬  A movie file has been removed, cleaning up '${path}' from DB...`,
        data: { driveLetter: drive.letter, path: parentPath, fileName },
      })
      await store.remove(existingMovies[0].id)
    }
  }
}

export const onUnlinkDir = (injector: Injector) => {
  const logger = getLogger(injector).withScope('MovieFileMaintainer')
  return async (drive: Drive, path: string) => {
    const store = injector.getInstance(StoreManager).getStoreFor(MovieFile, 'id')
    const normalizedPath = PathHelper.normalize(path)

    const existingMovies = await store.find({
      filter: {
        path: { $like: `${normalizedPath}%` },
        driveLetter: { $eq: drive.letter },
      },
    })

    if (existingMovies.length > 0) {
      logger.verbose({
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
  }
}

export const onAdd = (injector: Injector) => {
  return async (drive: Drive, path: string) => {
    const parentPath = PathHelper.getParentPath(path) || ''
    const fileName = path.split('/').slice(-1)[0]
    await linkMovie({ injector, drive: drive.letter, fileName, path: parentPath })
  }
}
