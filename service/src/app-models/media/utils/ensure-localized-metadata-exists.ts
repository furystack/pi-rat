import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import type { MovieMetadataLocalized, SeriesMetadataLocalized } from 'common'
import {
  MovieMetadataLocalized as MovieMetadataLocalizedClass,
  SeriesMetadataLocalized as SeriesMetadataLocalizedClass,
} from 'common'

export const ensureMovieLocalizedMetadataExists = async (
  data: Omit<MovieMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'>,
  injector: Injector,
) => {
  const dataSet = getDataSetFor(injector, MovieMetadataLocalizedClass, 'id')
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
  const dataSet = getDataSetFor(injector, SeriesMetadataLocalizedClass, 'id')
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
