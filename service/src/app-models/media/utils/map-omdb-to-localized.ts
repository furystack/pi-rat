import type { MovieMetadataLocalized, OmdbMovieMetadata, OmdbSeriesMetadata, SeriesMetadataLocalized } from 'common'

export const mapOmdbMovieToLocalized = (
  omdbMeta: OmdbMovieMetadata,
): Omit<MovieMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'> => ({
  movieImdbId: omdbMeta.imdbID,
  language: 'en',
  title: omdbMeta.Title,
  plot: omdbMeta.Plot,
  posterUrl: omdbMeta.Poster !== 'N/A' ? omdbMeta.Poster : undefined,
  genre: omdbMeta.Genre ? omdbMeta.Genre.split(', ') : undefined,
  source: 'omdb',
  sourceId: omdbMeta.imdbID,
})

export const mapOmdbSeriesToLocalized = (
  omdbMeta: OmdbSeriesMetadata,
): Omit<SeriesMetadataLocalized, 'id' | 'createdAt' | 'updatedAt'> => ({
  seriesImdbId: omdbMeta.imdbID,
  language: 'en',
  title: omdbMeta.Title,
  plot: omdbMeta.Plot,
  posterUrl: omdbMeta.Poster !== 'N/A' ? omdbMeta.Poster : undefined,
  source: 'omdb',
  sourceId: omdbMeta.imdbID,
})
