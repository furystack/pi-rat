import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { Series, type OmdbSeriesMetadata } from 'common'

export const ensureSeriesExists = async (omdbMeta: OmdbSeriesMetadata, injector: Injector) => {
  const seriesDataSet = getDataSetFor(injector, Series, 'imdbId')
  const existingSeries = await seriesDataSet.get(injector, omdbMeta.imdbID)

  if (!existingSeries) {
    await seriesDataSet.add(injector, {
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
