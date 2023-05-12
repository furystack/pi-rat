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
  MovieWatchHistoryEntry,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
} from '../models/media/index.js'

export interface MediaApi extends RestApi {
  GET: {
    '/movies': GetCollectionEndpoint<Movie>
    '/movies/:id': GetEntityEndpoint<Movie, 'imdbId'>
    '/movies/:movieId/subtitles': { url: { movieId: string }; result: string[] }
    '/movies/:movieId/subtitles/:subtitleName': {
      url: { movieId: string; subtitleName: string }
      result: unknown
    }
    '/stream-original/:movieId': { url: { movieId: string }; result: unknown }
    '/my-watch-progress': GetCollectionEndpoint<MovieWatchHistoryEntry>
    '/series': GetCollectionEndpoint<Series>
    '/series/:id': GetEntityEndpoint<Series, 'id'>
    '/omdb-movie-metadata': GetCollectionEndpoint<OmdbMovieMetadata>
    '/omdb-movie-metadata/:id': GetEntityEndpoint<OmdbMovieMetadata, 'imdbId'>
    '/omdb-series-metadata': GetCollectionEndpoint<OmdbSeriesMetadata>
    '/omdb-series-metadata/:id': GetEntityEndpoint<OmdbSeriesMetadata, 'imdbId'>
    '/movie-files': GetCollectionEndpoint<MovieFile>
    '/movie-files/:id': GetEntityEndpoint<MovieFile, 'id'>
  }
  POST: {
    '/movies': PostEndpoint<Movie, 'imdbId'>
    '/movies/:movieId/save-watch-progress': {
      url: { movieId: string }
      body: { watchProgressInSeconds: number }
      result: { success: boolean }
    }
    '/movies/:movieId/re-fetch-metadata': { url: { movieId: string }; result: { success: boolean } }
    '/movies/:movieId/re-extract-subtitles': { url: { movieId: string }; result: { success: boolean } }
    '/movie-files': PostEndpoint<MovieFile, 'id'>
  }
  PATCH: {
    '/movies/:id': PatchEndpoint<Movie, 'imdbId'>
    '/movie-files/:id': PatchEndpoint<MovieFile, 'id'>
  }
  DELETE: {
    '/movies/:id': DeleteEndpoint<Movie, 'imdbId'>
    '/movie-files/:id': DeleteEndpoint<MovieFile, 'id'>
  }
}
