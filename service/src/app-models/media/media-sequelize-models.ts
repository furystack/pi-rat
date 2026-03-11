import type {
  Movie,
  MovieFile,
  MovieMetadataLocalized,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
  SeriesMetadataLocalized,
  TmdbMovieMetadata,
  TmdbSeriesMetadata,
  WatchHistoryEntry,
} from 'common'

import { Model } from 'sequelize'

import type { FfprobeResult } from '../../ffprobe-service.js'

export class MovieModel extends Model<Movie, Movie> implements Movie {
  declare imdbId: string
  declare year?: number | undefined
  declare duration?: number | undefined
  declare type?: 'episode' | 'movie' | undefined
  declare seriesId?: string | undefined
  declare season?: number | undefined
  declare episode?: number | undefined
  declare createdAt: string
  declare updatedAt: string
}

export class MovieFileModel extends Model<MovieFile, MovieFile> implements MovieFile {
  declare id: string
  declare imdbId?: string
  declare driveLetter: string
  declare path: string
  declare ffprobe: FfprobeResult
  declare relatedFiles?: Array<{ type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'; path: string }> | undefined
}

export class WatchHistoryEntryModel extends Model<WatchHistoryEntry, WatchHistoryEntry> implements WatchHistoryEntry {
  declare movieFileId: string
  declare driveLetter: string
  declare path: string
  declare id: string
  declare userName: string
  declare movie: Movie
  declare watchedSeconds: number
  declare completed: boolean
  declare createdAt: string
  declare updatedAt: string
}

export class SeriesModel extends Model<Series, Series> implements Series {
  declare imdbId: string
  declare year: string
  declare numberOfSeasons?: number | undefined
  declare createdAt: string
  declare updatedAt: string
}

export class OmdbMovieMetadataModel extends Model<OmdbMovieMetadata, OmdbMovieMetadata> implements OmdbMovieMetadata {
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: 'episode' | 'movie'
  declare DVD?: string | undefined
  declare BoxOffice?: string | undefined
  declare Production?: string | undefined
  declare Website?: string | undefined
  declare Response: 'True'
  declare seriesID?: string | undefined
  declare Season?: string | undefined
  declare Episode?: string | undefined
  declare createdAt: string
  declare updatedAt: string
}

export class OmdbSeriesMetadataModel
  extends Model<OmdbSeriesMetadata, OmdbSeriesMetadata>
  implements OmdbSeriesMetadata
{
  declare Title: string
  declare Year: string
  declare Rated: string
  declare Released: string
  declare Runtime: string
  declare Genre: string
  declare Director: string
  declare Writer: string
  declare Actors: string
  declare Plot: string
  declare Language: string
  declare Country: string
  declare Awards: string
  declare Poster: string
  declare Ratings: Array<{ Source: string; Value: string }>
  declare Metascore: string
  declare imdbRating: string
  declare imdbVotes: string
  declare imdbID: string
  declare Type: string
  declare totalSeasons: string
  declare Response: string
  declare createdAt: string
  declare updatedAt: string
}

export class TmdbMovieMetadataModel extends Model<TmdbMovieMetadata, TmdbMovieMetadata> implements TmdbMovieMetadata {
  declare id: number
  declare imdbId?: string
  declare title: string
  declare originalTitle: string
  declare overview: string
  declare releaseDate?: string
  declare runtime?: number
  declare posterPath?: string
  declare backdropPath?: string
  declare genres: Array<{ id: number; name: string }>
  declare voteAverage?: number
  declare voteCount?: number
  declare popularity?: number
  declare originalLanguage: string
  declare spokenLanguages?: Array<{ iso_639_1: string; name: string }>
  declare productionCountries?: Array<{ iso_3166_1: string; name: string }>
  declare status?: string
  declare tagline?: string
  declare budget?: number
  declare revenue?: number
  declare language: string
  declare createdAt: string
  declare updatedAt: string
}

export class TmdbSeriesMetadataModel
  extends Model<TmdbSeriesMetadata, TmdbSeriesMetadata>
  implements TmdbSeriesMetadata
{
  declare id: number
  declare imdbId?: string
  declare name: string
  declare originalName: string
  declare overview: string
  declare firstAirDate?: string
  declare posterPath?: string
  declare backdropPath?: string
  declare genres: Array<{ id: number; name: string }>
  declare voteAverage?: number
  declare voteCount?: number
  declare numberOfSeasons?: number
  declare numberOfEpisodes?: number
  declare status?: string
  declare originalLanguage: string
  declare languages?: string[]
  declare language: string
  declare createdAt: string
  declare updatedAt: string
}

export class MovieMetadataLocalizedModel
  extends Model<MovieMetadataLocalized, MovieMetadataLocalized>
  implements MovieMetadataLocalized
{
  declare id: string
  declare movieImdbId: string
  declare language: string
  declare title: string
  declare plot?: string
  declare posterUrl?: string
  declare genre?: string[]
  declare source: 'omdb' | 'tmdb'
  declare sourceId?: string
  declare createdAt: string
  declare updatedAt: string
}

export class SeriesMetadataLocalizedModel
  extends Model<SeriesMetadataLocalized, SeriesMetadataLocalized>
  implements SeriesMetadataLocalized
{
  declare id: string
  declare seriesImdbId: string
  declare language: string
  declare title: string
  declare plot?: string
  declare posterUrl?: string
  declare source: 'omdb' | 'tmdb'
  declare sourceId?: string
  declare createdAt: string
  declare updatedAt: string
}
