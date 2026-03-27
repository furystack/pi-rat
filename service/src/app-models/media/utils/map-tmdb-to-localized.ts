import type { MovieMetadataLocalized, SeriesMetadataLocalized } from 'common'

import type { TmdbMovieDetailsResponse, TmdbTvDetailsResponse } from '../metadata-services/tmdb-api-types.js'
import { buildTmdbImageUrl } from '../metadata-services/tmdb-client-service.js'

export const mapTmdbMovieToLocalized = (
  tmdbMovie: TmdbMovieDetailsResponse,
  imdbId: string,
  language: string,
): Omit<MovieMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'> => ({
  movieImdbId: imdbId,
  language,
  title: tmdbMovie.title,
  plot: tmdbMovie.overview || undefined,
  posterUrl: buildTmdbImageUrl(tmdbMovie.poster_path),
  genre: tmdbMovie.genres.map((g) => g.name),
  source: 'tmdb',
  sourceId: String(tmdbMovie.id),
})

export const mapTmdbSeriesToLocalized = (
  tmdbSeries: TmdbTvDetailsResponse,
  imdbId: string,
  language: string,
): Omit<SeriesMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'> => ({
  seriesImdbId: imdbId,
  language,
  title: tmdbSeries.name,
  plot: tmdbSeries.overview || undefined,
  posterUrl: buildTmdbImageUrl(tmdbSeries.poster_path),
  source: 'tmdb',
  sourceId: String(tmdbSeries.id),
})
