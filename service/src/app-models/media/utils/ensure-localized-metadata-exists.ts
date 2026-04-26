import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import type { MovieMetadataLocalized, SeriesMetadataLocalized } from 'common'
import { MovieMetadataLocalizedDataSet, SeriesMetadataLocalizedDataSet } from '../media-data-sets.js'

export const ensureMovieLocalizedMetadataExists = async (
  data: Omit<MovieMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'>,
  injector: Injector,
) => {
  const dataSet = getDataSetFor(injector, MovieMetadataLocalizedDataSet)
  const existing = await dataSet.find(injector, {
    filter: {
      movieImdbId: { $eq: data.movieImdbId },
      language: { $eq: data.language },
      source: { $eq: data.source },
    },
    top: 1,
  })

  if (existing.length > 0) {
    return existing[0]
  }

  const {
    created: [added],
  } = await dataSet.add(injector, {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return added
}

export const ensureSeriesLocalizedMetadataExists = async (
  data: Omit<SeriesMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'>,
  injector: Injector,
) => {
  const dataSet = getDataSetFor(injector, SeriesMetadataLocalizedDataSet)
  const existing = await dataSet.find(injector, {
    filter: {
      seriesImdbId: { $eq: data.seriesImdbId },
      language: { $eq: data.language },
      source: { $eq: data.source },
    },
    top: 1,
  })

  if (existing.length > 0) {
    return existing[0]
  }

  const {
    created: [added],
  } = await dataSet.add(injector, {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return added
}
