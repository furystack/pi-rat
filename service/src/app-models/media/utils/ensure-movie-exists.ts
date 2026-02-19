import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { Movie, type OmdbMovieMetadata } from 'common'

export const ensureMovieExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  const movieDataSet = getDataSetFor(injector, Movie, 'imdbId')
  const existingMovie = await movieDataSet.get(injector, omdbMeta.imdbID)

  if (!existingMovie) {
    const {
      created: [newMovie],
    } = await movieDataSet.add(injector, {
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
