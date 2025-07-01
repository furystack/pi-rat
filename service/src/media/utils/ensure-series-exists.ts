import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Series, type OmdbSeriesMetadata } from 'common'

export const ensureSeriesExists = async (omdbMeta: OmdbSeriesMetadata, injector: Injector) => {
  const seriesStore = getStoreManager(injector).getStoreFor(Series, 'imdbId')
  const existingSeries = await seriesStore.get(omdbMeta.imdbID)

  if (!existingSeries) {
    await seriesStore.add({
      imdbId: omdbMeta.imdbID,
      title: omdbMeta.Title,
      year: omdbMeta.Year,
      thumbnailImageUrl: omdbMeta.Poster,
      plot: omdbMeta.Plot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}
