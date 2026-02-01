import { getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Movie, type OmdbMovieMetadata } from 'common'

export const ensureMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const movieStore = getStoreManager(injector).getStoreFor(Movie, 'imdbId')
  const existingMovie = await movieStore.get(omdbMeta.imdbID)

  if (!existingMovie) {
    const {
      created: [newMovie],
    } = await movieStore.add({
      imdbId: omdbMeta.imdbID,
      title: omdbMeta.Title,
      year: parseInt(omdbMeta.Year, 10),
      season: omdbMeta.Season ? parseInt(omdbMeta.Season, 10) : undefined,
      episode: omdbMeta.Episode ? parseInt(omdbMeta.Episode, 10) : undefined,
      type: omdbMeta.Type,
      duration: omdbMeta.Runtime ? parseInt(omdbMeta.Runtime, 10) : undefined,
      thumbnailImageUrl: omdbMeta.Poster,
      plot: omdbMeta.Plot,
      seriesId: omdbMeta.seriesID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return newMovie
  }
  return existingMovie
}
