import type {
  DeleteEndpoint,
  GetCollectionEndpoint,
  GetEntityEndpoint,
  PatchEndpoint,
  PostEndpoint,
  RestApi,
} from '@furystack/rest'
import type {
  Movie,
  MovieFile,
  OmdbMovieMetadata,
  OmdbSeriesMetadata,
  Series,
  WatchHistoryEntry,
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

export type ScanForMoviesEndpoint = {
  body: {
    root: PiRatFile
    autoExtractSubtitles?: boolean
  }
  result: {
    added: MovieFile[]
  }
}

export type StreamQueryParams = {
  /**
   * Audio settings. If not provided, the first audio track will be played with the original encoding / bitrate / etc...
   */
  audio?: {
    /**
     * Selects the audio track to stream. If not provided, the first audio track will be played
     */
    trackId: number
    /**
     * Select the codec for audio encoding. If not provided, the original encoding will be used
     */
    audioCodec?: 'aac'

    /**
     * Mix down multi-channel audio to stereo
     */
    mixdown?: boolean

    /**
     * The bitrate for the audio stream. If not provided, the original bitrate will be used
     */
    bitrate?: number
  }

  /**
   * Video settings. If not provided, the original video track will be played with the original encoding / bitrate / etc...
   */
  video?: {
    /**
     * The codec for video encoding. If not provided, the original encoding will be used
     */
    codec?: 'libx264'

    /**
     * The output resolution for the video stream. If not provided, the original resolution will be used
     */
    resolution?: '4k' | '1080p' | '720p' | '480p' | '360p'

    /**
     * Preset options
     */
    quality?: 'high' | 'medium' | 'low'
  }

  /**
   * The start time in seconds
   */
  from: number

  /**
   * The end time in seconds
   */
  to: number
}

export type StreamFileEndpoint = {
  url: {
    letter: string
    path: string
  }
  query: StreamQueryParams
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
    '/movie-files/:id': GetEntityEndpoint<MovieFile, 'id'>
    '/files/:letter/:path/stream': StreamFileEndpoint
  }
  POST: {
    '/movies': PostEndpoint<Movie, 'imdbId', Omit<Movie, 'createdAt' | 'updatedAt'>>
    '/movie-files': PostEndpoint<MovieFile, 'id'>
    '/link-movie': LinkMovie
    '/extract-subtitles': ExtractSubtitles
    '/save-watch-progress': SaveWatchProgress
    '/scan-for-movies': ScanForMoviesEndpoint
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
