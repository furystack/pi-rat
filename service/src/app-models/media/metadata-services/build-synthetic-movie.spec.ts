import { describe, expect, it } from 'vitest'

import type { TmdbTvDetailsResponse, TmdbEpisodeDetailsResponse } from './tmdb-api-types.js'
import { buildSyntheticMovieFromEpisode } from './build-synthetic-movie.js'

const makeTvDetails = (overrides?: Partial<TmdbTvDetailsResponse>): TmdbTvDetailsResponse => ({
  adult: false,
  backdrop_path: '/tv-backdrop.jpg',
  created_by: [],
  episode_run_time: [45],
  first_air_date: '2020-01-01',
  genres: [{ id: 18, name: 'Drama' }],
  homepage: '',
  id: 100,
  in_production: false,
  languages: ['en'],
  last_air_date: '2020-12-31',
  last_episode_to_air: null,
  name: 'Test Series',
  networks: [],
  next_episode_to_air: null,
  number_of_episodes: 10,
  number_of_seasons: 1,
  origin_country: ['US'],
  original_language: 'en',
  original_name: 'Test Series',
  overview: 'A test series',
  popularity: 50,
  poster_path: '/tv-poster.jpg',
  production_companies: [],
  production_countries: [],
  seasons: [],
  spoken_languages: [],
  status: 'Ended',
  tagline: '',
  type: 'Scripted',
  vote_average: 8.0,
  vote_count: 1000,
  ...overrides,
})

const makeEpisodeDetails = (overrides?: Partial<TmdbEpisodeDetailsResponse>): TmdbEpisodeDetailsResponse => ({
  air_date: '2020-03-15',
  episode_number: 5,
  id: 500,
  name: 'Test Episode',
  overview: 'Episode overview',
  production_code: 'S01E05',
  runtime: 42,
  season_number: 1,
  still_path: '/episode-still.jpg',
  vote_average: 7.5,
  vote_count: 200,
  crew: [],
  guest_stars: [],
  ...overrides,
})

describe('buildSyntheticMovieFromEpisode', () => {
  it('should map all fields correctly', () => {
    const tv = makeTvDetails()
    const ep = makeEpisodeDetails()
    const result = buildSyntheticMovieFromEpisode(tv, ep, 'tt1234567')

    expect(result.imdb_id).toBe('tt1234567')
    expect(result.id).toBe(ep.id)
    expect(result.title).toBe(ep.name)
    expect(result.original_title).toBe(ep.name)
    expect(result.overview).toBe(ep.overview)
    expect(result.release_date).toBe(ep.air_date)
    expect(result.runtime).toBe(42)
    expect(result.vote_average).toBe(ep.vote_average)
    expect(result.vote_count).toBe(ep.vote_count)
  })

  it('should use episode still_path for backdrop', () => {
    const result = buildSyntheticMovieFromEpisode(makeTvDetails(), makeEpisodeDetails(), 'tt0000001')
    expect(result.backdrop_path).toBe('/episode-still.jpg')
  })

  it('should use series poster_path for poster', () => {
    const result = buildSyntheticMovieFromEpisode(makeTvDetails(), makeEpisodeDetails(), 'tt0000001')
    expect(result.poster_path).toBe('/tv-poster.jpg')
  })

  it('should inherit genres from series', () => {
    const tv = makeTvDetails({
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Sci-Fi' },
      ],
    })
    const result = buildSyntheticMovieFromEpisode(tv, makeEpisodeDetails(), 'tt0000001')
    expect(result.genres).toEqual([
      { id: 1, name: 'Action' },
      { id: 2, name: 'Sci-Fi' },
    ])
  })

  it('should inherit origin_country and original_language from series', () => {
    const tv = makeTvDetails({ origin_country: ['GB'], original_language: 'fr' })
    const result = buildSyntheticMovieFromEpisode(tv, makeEpisodeDetails(), 'tt0000001')
    expect(result.origin_country).toEqual(['GB'])
    expect(result.original_language).toBe('fr')
  })

  it('should default runtime to 0 when episode runtime is null', () => {
    const ep = makeEpisodeDetails({ runtime: null })
    const result = buildSyntheticMovieFromEpisode(makeTvDetails(), ep, 'tt0000001')
    expect(result.runtime).toBe(0)
  })

  it('should set static fields to expected defaults', () => {
    const result = buildSyntheticMovieFromEpisode(makeTvDetails(), makeEpisodeDetails(), 'tt0000001')
    expect(result.adult).toBe(false)
    expect(result.budget).toBe(0)
    expect(result.revenue).toBe(0)
    expect(result.popularity).toBe(0)
    expect(result.status).toBe('Released')
    expect(result.video).toBe(false)
    expect(result.tagline).toBe('')
    expect(result.homepage).toBe('')
    expect(result.belongs_to_collection).toBeNull()
    expect(result.production_companies).toEqual([])
    expect(result.production_countries).toEqual([])
    expect(result.spoken_languages).toEqual([])
  })
})
