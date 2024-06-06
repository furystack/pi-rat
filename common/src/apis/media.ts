import type {
  RestApi,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  DeleteEndpoint,
  PostEndpoint,
} from '@furystack/rest'
import type {
  Movie,
  MovieFile,
  WatchHistoryEntry,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
} from '../models/media/index.js'
import type { PiRatFile } from '../models/pirat-file.js'

export type LinkMovie = {
  body: PiRatFile
  result: { status: 'already-linked' | 'linked' | 'failed' | 'not-movie-file' }
}

export type ExtractSubtitles = {
  body: PiRatFile
  result: { success: boolean }
}

export type FetchOmdbSeries = {
  body: {
    imdbId: string
  }
  result: OmdbSeriesMetadata
}

export type SaveWatchProgress = {
  body: Omit<WatchHistoryEntry, 'userName' | 'createdAt' | 'updatedAt' | 'id'>
  result: WatchHistoryEntry
}

export type StreamEndpoint = {
  url: {
    id: string
  }
  result: unknown
}

export interface MediaApi extends RestApi {
  GET: {
    '/movies': GetCollectionEndpoint<Movie>
    '/movies/:id': GetEntityEndpoint<Movie, 'imdbId'>
    '/movies/:movieId/subtitles': { url: { movieId: string }; result: string[] }
    '/movies/:movieId/subtitles/:subtitleName': {
      url: { movieId: string; subtitleName: string }
      result: unknown
    }
    '/my-watch-progresses': GetCollectionEndpoint<WatchHistoryEntry>
    '/my-watch-progresses/:id': GetEntityEndpoint<WatchHistoryEntry, 'id'>
    '/series': GetCollectionEndpoint<Series>
    '/series/:id': GetEntityEndpoint<Series, 'imdbId'>
    '/omdb-movie-metadata': GetCollectionEndpoint<OmdbMovieMetadata>
    '/omdb-movie-metadata/:id': GetEntityEndpoint<OmdbMovieMetadata, 'imdbID'>
    '/omdb-series-metadata': GetCollectionEndpoint<OmdbSeriesMetadata>
    '/omdb-series-metadata/:id': GetEntityEndpoint<OmdbSeriesMetadata, 'imdbID'>
    '/movie-files': GetCollectionEndpoint<MovieFile>
    '/movie-files/:id/stream': StreamEndpoint
    '/movie-files/:id': GetEntityEndpoint<MovieFile, 'id'>
  }
  POST: {
    '/movies': PostEndpoint<Movie, 'imdbId', Omit<Movie, 'createdAt' | 'updatedAt'>>
    '/movie-files': PostEndpoint<MovieFile, 'id'>
    '/link-movie': LinkMovie
    '/extract-subtitles': ExtractSubtitles
    '/save-watch-progress': SaveWatchProgress
  }
  PATCH: {
    '/movies/:id': PatchEndpoint<Omit<Movie, 'createdAt' | 'updatedAt'>, 'imdbId'>
    '/movie-files/:id': PatchEndpoint<MovieFile, 'id'>
  }
  DELETE: {
    '/movies/:id': DeleteEndpoint<Movie, 'imdbId'>
    '/movie-files/:id': DeleteEndpoint<MovieFile, 'id'>
    '/my-watch-progresses/:id': DeleteEndpoint<WatchHistoryEntry, 'id'>
  }
}
