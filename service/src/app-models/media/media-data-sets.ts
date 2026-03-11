import { getCurrentUser, isAuthorized } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { AuthorizationResult } from '@furystack/repository'
import { getRepository } from '@furystack/repository'
import {
  Movie,
  MovieFile,
  MovieMetadataLocalized,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
  SeriesMetadataLocalized,
  TmdbMovieMetadata,
  TmdbSeriesMetadata,
  WatchHistoryEntry,
} from 'common'

import { authorizedOnly } from '../../authorization/authorized-only.js'
import { withRole } from '../../authorization/with-role.js'

export const setupMediaDataSets = (injector: Injector) => {
  const repo = getRepository(injector)

  repo.createDataSet(Movie, 'imdbId', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(MovieFile, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  const onlyOwned = async ({
    entity,
    injector: i,
  }: {
    entity: WatchHistoryEntry
    injector: Injector
  }): Promise<AuthorizationResult> => {
    const user = await getCurrentUser(i)
    if (user.username === entity.userName) {
      return { isAllowed: true }
    }

    if (await isAuthorized(i, 'admin')) {
      return { isAllowed: true }
    }
    return {
      isAllowed: false,
      message: 'You are not authorized to access this resource',
    }
  }

  repo.createDataSet(WatchHistoryEntry, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: authorizedOnly,
    authorizeUpdate: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeGetEntity: onlyOwned,
    addFilter: async ({ filter, injector: i }) => {
      const user = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          userName: { $eq: user.username },
        },
      } as typeof filter
    },
    authorizeUpdateEntity: onlyOwned,
    authorizeRemoveEntity: onlyOwned,
  })

  repo.createDataSet(Series, 'imdbId', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbMovieMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(OmdbSeriesMetadata, 'imdbID', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(TmdbMovieMetadata, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(TmdbSeriesMetadata, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(MovieMetadataLocalized, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  repo.createDataSet(SeriesMetadataLocalized, 'id', {
    authorizeGet: authorizedOnly,
    authorizeAdd: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })
}
