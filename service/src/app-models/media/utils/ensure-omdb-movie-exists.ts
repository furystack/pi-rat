import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import type { OmdbMovieMetadata } from 'common'
import { OmdbMovieMetadataDataSet } from '../media-data-sets.js'

export const ensureOmdbMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const dataSet = getDataSetFor(injector, OmdbMovieMetadataDataSet)
  const existing = await dataSet.get(injector, omdbMeta.imdbID)
  if (existing) {
    return existing
  }
  const {
    created: [added],
  } = await dataSet.add(injector, omdbMeta)
  return added
}
