import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { TmdbMovieMetadata } from 'common'

import type { TmdbMovieDetailsResponse } from '../metadata-services/tmdb-api-types.js'

export const ensureTmdbMovieExists = async (
  tmdbMovie: TmdbMovieDetailsResponse,
  language: string,
  injector: Injector,
) => {
  const dataSet = getDataSetFor(injector, TmdbMovieMetadata, 'id')
  const existing = await dataSet.get(injector, tmdbMovie.id)
  if (existing) {
    return existing
  }
  const {
    created: [added],
  } = await dataSet.add(injector, {
    id: tmdbMovie.id,
    imdbId: tmdbMovie.imdb_id ?? undefined,
    title: tmdbMovie.title,
    originalTitle: tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    releaseDate: tmdbMovie.release_date || undefined,
    runtime: tmdbMovie.runtime || undefined,
    posterPath: tmdbMovie.poster_path ?? undefined,
    backdropPath: tmdbMovie.backdrop_path ?? undefined,
    genres: tmdbMovie.genres,
    voteAverage: tmdbMovie.vote_average,
    voteCount: tmdbMovie.vote_count,
    popularity: tmdbMovie.popularity,
    originalLanguage: tmdbMovie.original_language,
    spokenLanguages: tmdbMovie.spoken_languages,
    productionCountries: tmdbMovie.production_countries,
    status: tmdbMovie.status || undefined,
    tagline: tmdbMovie.tagline || undefined,
    budget: tmdbMovie.budget || undefined,
    revenue: tmdbMovie.revenue || undefined,
    language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return added
}
