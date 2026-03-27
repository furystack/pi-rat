import type { OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { describe, expect, it } from 'vitest'
import { mapOmdbMovieToLocalized, mapOmdbSeriesToLocalized } from './map-omdb-to-localized.js'

describe('mapOmdbMovieToLocalized', () => {
  const createOmdbMovie = (overrides: Partial<OmdbMovieMetadata> = {}): OmdbMovieMetadata =>
    ({
      imdbID: 'tt1234567',
      Title: 'Test Movie',
      Plot: 'A great movie about testing.',
      Poster: 'https://example.com/poster.jpg',
      Genre: 'Action, Drama',
      ...overrides,
    }) as OmdbMovieMetadata

  it('should map all fields correctly', () => {
    const result = mapOmdbMovieToLocalized(createOmdbMovie())

    expect(result).toEqual({
      movieImdbId: 'tt1234567',
      language: 'en',
      title: 'Test Movie',
      plot: 'A great movie about testing.',
      posterUrl: 'https://example.com/poster.jpg',
      genre: ['Action', 'Drama'],
      source: 'omdb',
      sourceId: 'tt1234567',
    })
  })

  it('should set posterUrl to undefined when Poster is N/A', () => {
    const result = mapOmdbMovieToLocalized(createOmdbMovie({ Poster: 'N/A' }))
    expect(result.posterUrl).toBeUndefined()
  })

  it('should set genre to undefined when Genre is empty', () => {
    const result = mapOmdbMovieToLocalized(createOmdbMovie({ Genre: '' }))
    expect(result.genre).toBeUndefined()
  })

  it('should handle single genre', () => {
    const result = mapOmdbMovieToLocalized(createOmdbMovie({ Genre: 'Comedy' }))
    expect(result.genre).toEqual(['Comedy'])
  })
})

describe('mapOmdbSeriesToLocalized', () => {
  const createOmdbSeries = (overrides: Partial<OmdbSeriesMetadata> = {}): OmdbSeriesMetadata =>
    ({
      imdbID: 'tt9876543',
      Title: 'Test Series',
      Plot: 'A great series about testing.',
      Poster: 'https://example.com/series-poster.jpg',
      ...overrides,
    }) as OmdbSeriesMetadata

  it('should map all fields correctly', () => {
    const result = mapOmdbSeriesToLocalized(createOmdbSeries())

    expect(result).toEqual({
      seriesImdbId: 'tt9876543',
      language: 'en',
      title: 'Test Series',
      plot: 'A great series about testing.',
      posterUrl: 'https://example.com/series-poster.jpg',
      source: 'omdb',
      sourceId: 'tt9876543',
    })
  })

  it('should set posterUrl to undefined when Poster is N/A', () => {
    const result = mapOmdbSeriesToLocalized(createOmdbSeries({ Poster: 'N/A' }))
    expect(result.posterUrl).toBeUndefined()
  })
})
