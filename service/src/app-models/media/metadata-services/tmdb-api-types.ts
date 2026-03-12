/**
 * Hand-written types for the TMDB v3 API endpoints used by pi-rat.
 * Based on https://developer.themoviedb.org/reference/getting-started
 */

// ── Search Movie ── GET /3/search/movie ──────────────────────────────

export type TmdbSearchMovieParams = {
  query: string
  include_adult?: boolean
  language?: string
  primary_release_year?: string
  page?: number
  region?: string
  year?: string
}

export type TmdbSearchMovieResult = {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export type TmdbPaginatedResponse<T> = {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ── Search TV ── GET /3/search/tv ────────────────────────────────────

export type TmdbSearchTvParams = {
  query: string
  first_air_date_year?: number
  include_adult?: boolean
  language?: string
  page?: number
  year?: number
}

export type TmdbSearchTvResult = {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  first_air_date: string
  name: string
  vote_average: number
  vote_count: number
}

// ── Movie Details ── GET /3/movie/{movie_id} ─────────────────────────

export type TmdbMovieDetailsResponse = {
  adult: boolean
  backdrop_path: string | null
  belongs_to_collection: {
    id: number
    name: string
    poster_path: string | null
    backdrop_path: string | null
  } | null
  budget: number
  genres: Array<{ id: number; name: string }>
  homepage: string
  id: number
  imdb_id: string | null
  origin_country: string[]
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  production_countries: Array<{ iso_3166_1: string; name: string }>
  release_date: string
  revenue: number
  runtime: number
  spoken_languages: Array<{
    english_name: string
    iso_639_1: string
    name: string
  }>
  status: string
  tagline: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
  external_ids?: TmdbExternalIds
}

// ── TV Series Details ── GET /3/tv/{series_id} ───────────────────────

export type TmdbTvDetailsResponse = {
  adult: boolean
  backdrop_path: string | null
  created_by: Array<{
    id: number
    credit_id: string
    name: string
    original_name: string
    gender: number
    profile_path: string | null
  }>
  episode_run_time: number[]
  first_air_date: string
  genres: Array<{ id: number; name: string }>
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: TmdbEpisodeSummary | null
  name: string
  networks: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  next_episode_to_air: TmdbEpisodeSummary | null
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: Array<{
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }>
  production_countries: Array<{ iso_3166_1: string; name: string }>
  seasons: Array<{
    air_date: string
    episode_count: number
    id: number
    name: string
    overview: string
    poster_path: string | null
    season_number: number
    vote_average: number
  }>
  spoken_languages: Array<{
    english_name: string
    iso_639_1: string
    name: string
  }>
  status: string
  tagline: string
  type: string
  vote_average: number
  vote_count: number
  external_ids?: TmdbExternalIds
}

export type TmdbEpisodeSummary = {
  air_date: string
  episode_number: number
  episode_type?: string
  id: number
  name: string
  overview: string
  production_code?: string
  runtime: number | null
  season_number: number
  show_id: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

// ── TV Episode Details ── GET /3/tv/{id}/season/{n}/episode/{n} ──────

export type TmdbEpisodeDetailsResponse = {
  air_date: string
  episode_number: number
  id: number
  name: string
  overview: string
  production_code: string
  runtime: number | null
  season_number: number
  still_path: string | null
  vote_average: number
  vote_count: number
  crew: Array<{
    id: number
    name: string
    job: string
    department: string
    profile_path: string | null
  }>
  guest_stars: Array<{
    id: number
    name: string
    character: string
    order: number
    profile_path: string | null
  }>
  external_ids?: TmdbExternalIds
}

// ── Find by External ID ── GET /3/find/{external_id} ─────────────────

export type TmdbFindByIdResponse = {
  movie_results: TmdbSearchMovieResult[]
  tv_results: TmdbSearchTvResult[]
  person_results: unknown[]
  tv_episode_results: unknown[]
  tv_season_results: unknown[]
}

// ── External IDs (append_to_response=external_ids) ───────────────────

export type TmdbExternalIds = {
  imdb_id: string | null
  facebook_id: string | null
  instagram_id: string | null
  twitter_id: string | null
  wikidata_id: string | null
  freebase_id?: string | null
  freebase_mid?: string | null
  tvdb_id?: number | null
  tvrage_id?: number | null
}
