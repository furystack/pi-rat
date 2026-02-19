import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { OmdbMovieMetadata } from 'common'

export const ensureOmdbMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const dataSet = getDataSetFor(injector, OmdbMovieMetadata, 'imdbID')
  const existing = await dataSet.get(injector, omdbMeta.imdbID)
  if (existing) {
    return existing
  }
  const {
    created: [added],
  } = await dataSet.add(injector, omdbMeta)
  return added
}
