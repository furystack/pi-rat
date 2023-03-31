import type {
  RestApi,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PostEndpoint,
  PatchEndpoint,
  DeleteEndpoint,
} from '@furystack/rest'
import type { CreateResult } from '@furystack/core'
import type { Movie, MovieLibrary, MovieWatchHistoryEntry, EncodingTask, EncodingType, Series } from '../models/movies'

export interface MediaApi extends RestApi {
  GET: {
    '/movies': GetCollectionEndpoint<Movie>
    '/movies/:id': GetEntityEndpoint<Movie, '_id'>
    '/movies/:movieId/subtitles': { url: { movieId: string }; result: string[] }
    '/movies/:movieId/subtitles/:subtitleName': {
      url: { movieId: string; subtitleName: string }
      result: unknown
    }
    '/movie-libraries': GetCollectionEndpoint<MovieLibrary>
    '/movie-libraries/:id': GetEntityEndpoint<MovieLibrary, '_id'>
    '/stream-original/:movieId/:accessToken?': { url: { movieId: string; accessToken?: string }; result: unknown }
    '/watch-stream/:id/:codec/:mode/:chunk?': {
      url: { id: string; codec: EncodingType['codec']; mode: EncodingType['mode']; chunk?: string }
      result: unknown
    }
    '/my-watch-progress': GetCollectionEndpoint<MovieWatchHistoryEntry>
    '/encode/tasks': GetCollectionEndpoint<EncodingTask>
    '/encode/tasks/:id': GetEntityEndpoint<EncodingTask, '_id'>
    '/encode/get-worker-task/:taskId': {
      url: { taskId: string }
      result: EncodingTask
      headers: { 'task-token': string }
    }
    '/series': GetCollectionEndpoint<Series>
    '/series/:id': GetEntityEndpoint<Series, '_id'>
  }
  POST: {
    '/movie-libraries': PostEndpoint<Pick<MovieLibrary, '_id' | 'name' | 'path' | 'icon'>, '_id'>
    '/save-watch-progress': { body: { movieId: string; watchedSeconds: number }; result: { success: boolean } }
    '/upload-encoded/:movieId/:accessToken': {
      url: { movieId: string; accessToken: string }
      result: { success: boolean }
    }
    '/upload-subtitles/:movieId/:accessToken': {
      url: { movieId: string; accessToken: string }
      result: { success: boolean }
    }
    '/finialize-encoding': {
      body: {
        accessToken: string
        codec: EncodingType['codec']
        mode: EncodingType['mode']
        log: Array<{ timestamp: string; message: string }>
      }
      result: { success: boolean }
    }
    '/save-encoding-failure': {
      body: { accessToken: string; error: any; log: Array<{ timestamp: string; message: string }> }
      result: { success: boolean }
    }
    '/encode/reencode': { body: { movieId: string }; result: CreateResult<EncodingTask> }
    '/movies/:movieId/re-fetch-metadata': { url: { movieId: string }; result: { success: boolean } }
    '/movies/:movieId/re-extract-subtitles': { url: { movieId: string }; result: { success: boolean } }
  }
  PATCH: {
    '/movies/:id': PatchEndpoint<Movie, '_id'>
    '/movie-libraries/:id': PatchEndpoint<MovieLibrary, '_id'>
  }
  DELETE: {
    '/encode/tasks/:id': DeleteEndpoint<EncodingTask, '_id'>
  }
}
