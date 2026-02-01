import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { OmdbMovieMetadata } from 'common'

export const ensureOmdbMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const store = getStoreManager(injector).getStoreFor(OmdbMovieMetadata, 'imdbID')
  const existing = await store.get(omdbMeta.imdbID)
  if (existing) {
    return existing
  }
  const {
    created: [added],
  } = await store.add(omdbMeta)
  return added
}
