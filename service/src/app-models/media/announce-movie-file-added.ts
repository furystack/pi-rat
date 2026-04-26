import { isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import type { DataSet } from '@furystack/repository'
import type { Movie, MovieFile } from 'common'

import { WebsocketService } from '../../websocket-service.js'

export const announceMovieFileAdded = async ({
  entity,
  injector,
  movieDataSet,
  logger,
}: {
  entity: MovieFile
  injector: Injector
  movieDataSet: DataSet<Movie, 'imdbId'>
  logger: ScopedLogger
}) => {
  if (!entity.imdbId) return
  try {
    const movie = await movieDataSet.get(injector, entity.imdbId)
    if (movie) {
      const ws = await injector.getAsync(WebsocketService)
      await ws.announce(
        {
          type: 'add-movie',
          file: { driveLetter: entity.driveLetter, path: entity.path },
          movie,
          movieFile: entity,
        },
        async ({ injector: i }) => isAuthorized(i, 'admin'),
      )
    }
  } catch (error) {
    await logger.error({
      message: `Failed to announce new movie file '${entity.path}'`,
      data: { error },
    })
  }
}
