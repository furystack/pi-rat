import type { TmdbMovieDetailsResponse, TmdbTvDetailsResponse, TmdbEpisodeDetailsResponse } from './tmdb-api-types.js'

/**
 * Builds a synthetic TmdbMovieDetailsResponse from series + episode data
 * so callers get a consistent shape for ensureMovieExists.
 */
export const buildSyntheticMovieFromEpisode = (
  tvDetails: TmdbTvDetailsResponse,
  episodeDetails: TmdbEpisodeDetailsResponse,
  imdbId: string,
): TmdbMovieDetailsResponse => ({
  adult: tvDetails.adult,
  backdrop_path: episodeDetails.still_path,
  belongs_to_collection: null,
  budget: 0,
  genres: tvDetails.genres,
  homepage: '',
  id: episodeDetails.id,
  imdb_id: imdbId,
  origin_country: tvDetails.origin_country,
  original_language: tvDetails.original_language,
  original_title: episodeDetails.name,
  overview: episodeDetails.overview,
  popularity: 0,
  poster_path: tvDetails.poster_path,
  production_companies: [],
  production_countries: [],
  release_date: episodeDetails.air_date,
  revenue: 0,
  runtime: episodeDetails.runtime ?? 0,
  spoken_languages: [],
  status: 'Released',
  tagline: '',
  title: episodeDetails.name,
  video: false,
  vote_average: episodeDetails.vote_average,
  vote_count: episodeDetails.vote_count,
})
