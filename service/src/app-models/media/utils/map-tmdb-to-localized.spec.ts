import { describe, expect, it } from 'vitest'
import type { TmdbMovieDetailsResponse, TmdbTvDetailsResponse } from '../metadata-services/tmdb-api-types.js'
import { mapTmdbMovieToLocalized, mapTmdbSeriesToLocalized } from './map-tmdb-to-localized.js'

describe('mapTmdbMovieToLocalized', () => {
  const createTmdbMovie = (): TmdbMovieDetailsResponse =>
    ({
      id: 12345,
      imdb_id: 'tt1234567',
      title: 'Test Movie',
      overview: 'A test movie overview.',
      poster_path: '/poster.jpg',
      genres: [
        { id: 28, name: 'Action' },
        { id: 18, name: 'Drama' },
      ],
    }) as TmdbMovieDetailsResponse

  it('should map all fields correctly', () => {
    const result = mapTmdbMovieToLocalized(createTmdbMovie(), 'tt1234567', 'en')

    expect(result).toEqual({
      movieImdbId: 'tt1234567',
      language: 'en',
      title: 'Test Movie',
      plot: 'A test movie overview.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      genre: ['Action', 'Drama'],
      source: 'tmdb',
      sourceId: '12345',
    })
  })

  it('should set posterUrl to undefined when poster_path is null', () => {
    const movie = createTmdbMovie()
    movie.poster_path = null
    const result = mapTmdbMovieToLocalized(movie, 'tt1234567', 'en')
    expect(result.posterUrl).toBeUndefined()
  })

  it('should set plot to undefined when overview is empty', () => {
    const movie = createTmdbMovie()
    movie.overview = ''
    const result = mapTmdbMovieToLocalized(movie, 'tt1234567', 'en')
    expect(result.plot).toBeUndefined()
  })

  it('should use provided language', () => {
    const result = mapTmdbMovieToLocalized(createTmdbMovie(), 'tt1234567', 'fr')
    expect(result.language).toBe('fr')
  })

  it('should use the explicitly provided imdbId', () => {
    const result = mapTmdbMovieToLocalized(createTmdbMovie(), 'tt0000001', 'en')
    expect(result.movieImdbId).toBe('tt0000001')
  })
})

describe('mapTmdbSeriesToLocalized', () => {
  const createTmdbSeries = (): TmdbTvDetailsResponse =>
    ({
      id: 67890,
      name: 'Test Series',
      overview: 'A test series overview.',
      poster_path: '/series-poster.jpg',
    }) as TmdbTvDetailsResponse

  it('should map all fields correctly', () => {
    const result = mapTmdbSeriesToLocalized(createTmdbSeries(), 'tt9876543', 'en')

    expect(result).toEqual({
      seriesImdbId: 'tt9876543',
      language: 'en',
      title: 'Test Series',
      plot: 'A test series overview.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/series-poster.jpg',
      source: 'tmdb',
      sourceId: '67890',
    })
  })

  it('should set posterUrl to undefined when poster_path is null', () => {
    const series = createTmdbSeries()
    series.poster_path = null
    const result = mapTmdbSeriesToLocalized(series, 'tt9876543', 'en')
    expect(result.posterUrl).toBeUndefined()
  })

  it('should set plot to undefined when overview is empty', () => {
    const series = createTmdbSeries()
    series.overview = ''
    const result = mapTmdbSeriesToLocalized(series, 'tt9876543', 'en')
    expect(result.plot).toBeUndefined()
  })
})
