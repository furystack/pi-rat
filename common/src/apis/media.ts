import type {
  RestApi,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PostEndpoint,
  PatchEndpoint,
  DeleteEndpoint,
} from '@furystack/rest'
import type {
  Movie,
  MovieLibrary,
  MovieWatchHistoryEntry,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
} from '../models/media'

export interface MediaApi extends RestApi {
  GET: {
    '/movies': GetCollectionEndpoint<Movie>
    '/movies/:id': GetEntityEndpoint<Movie, 'id'>
    '/movies/:movieId/subtitles': { url: { movieId: string }; result: string[] }
    '/movies/:movieId/subtitles/:subtitleName': {
      url: { movieId: string; subtitleName: string }
      result: unknown
    }
    '/movie-libraries': GetCollectionEndpoint<MovieLibrary>
    '/movie-libraries/:id': GetEntityEndpoint<MovieLibrary, 'id'>
    '/stream-original/:movieId': { url: { movieId: string }; result: unknown }
    '/my-watch-progress': GetCollectionEndpoint<MovieWatchHistoryEntry>
    '/series': GetCollectionEndpoint<Series>
    '/series/:id': GetEntityEndpoint<Series, 'id'>
    '/omdb-movie-metadata': GetCollectionEndpoint<OmdbMovieMetadata>
    '/omdb-movie-metadata/:id': GetEntityEndpoint<OmdbMovieMetadata, 'imdbID'>
    '/omdb-series-metadata': GetCollectionEndpoint<OmdbSeriesMetadata>
    '/omdb-series-metadata/:id': GetEntityEndpoint<OmdbSeriesMetadata, 'imdbID'>
  }
  POST: {
    '/movie-libraries': PostEndpoint<MovieLibrary, 'id'>
    '/movies/:movieId/save-watch-progress': {
      url: { movieId: string }
      body: { watchProgressInSeconds: number }
      result: { success: boolean }
    }
    '/movies/:movieId/re-fetch-metadata': { url: { movieId: string }; result: { success: boolean } }
    '/movies/:movieId/re-extract-subtitles': { url: { movieId: string }; result: { success: boolean } }
  }
  PATCH: {
    '/movies/:id': PatchEndpoint<Movie, 'id'>
    '/movie-libraries/:id': PatchEndpoint<MovieLibrary, 'id'>
  }
  DELETE: {
    '/movies/:id': DeleteEndpoint<Movie, 'id'>
    '/movie-libraries/:id': DeleteEndpoint<MovieLibrary, 'id'>
  }
}
