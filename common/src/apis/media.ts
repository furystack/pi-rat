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

export type PlaybackMode = 'direct-play' | 'remux' | 'direct-stream' | 'transcode'

export type CodecSupportMap = {
  video: string[]
  audio: string[]
  containers: string[]
}

export type SubtitleTrackInfo = {
  index: number
  label: string
  language: string
  format: 'srt' | 'ass' | 'webvtt' | 'pgs' | 'vobsub' | 'other'
  source: 'embedded' | 'external'
  requiresBurnIn: boolean
  url?: string
}

export type AudioTrackInfo = {
  index: number
  label: string
  language: string
  codecName: string
  channels: number
  isDefault: boolean
}

export type PlaybackInfoRequest = {
  body: {
    file: PiRatFile
    codecSupport: CodecSupportMap
    selectedAudioTrackIndex?: number
    selectedSubtitleTrackIndex?: number
  }
  result: PlaybackInfoResponse
}

export type PlaybackInfoResponse = {
  mode: PlaybackMode
  streamUrl: string
  audioTracks: AudioTrackInfo[]
  subtitleTracks: SubtitleTrackInfo[]
  warnings: string[]
  duration: number
}

export type HlsMasterEndpoint = {
  url: { letter: string; path: string }
  query: { mode?: PlaybackMode; videoCodecs?: string; audioCodecs?: string; containers?: string }
  result: unknown
}

export type HlsStreamEndpoint = {
  url: { letter: string; path: string }
  query: { mode?: PlaybackMode; resolution?: string; audioTrack?: number }
  result: unknown
}

export type HlsSegmentEndpoint = {
  url: { letter: string; path: string; index: string }
  query: { mode?: PlaybackMode; resolution?: string; audioTrack?: number }
  result: unknown
}

export type HlsInitEndpoint = {
  url: { letter: string; path: string }
  query: { mode?: PlaybackMode; audioTrack?: number; resolution?: string }
  result: unknown
}

export type HlsSessionTeardownEndpoint = {
  url: { letter: string; path: string }
  query: { mode?: PlaybackMode; resolution?: string; audioTrack?: number }
  result: { success: boolean }
}

export type GetSubtitlesEndpoint = {
  url: { movieId: string }
  result: string[]
}

export type GetSubtitleFileEndpoint = {
  url: { movieId: string; subtitleName: string }
  result: unknown
}

export interface MediaApi extends RestApi {
  GET: {
    '/movies': GetCollectionEndpoint<Movie>
    '/movies/:id': GetEntityEndpoint<Movie, 'imdbId'>
    '/movies/:movieId/subtitles': GetSubtitlesEndpoint
    '/movies/:movieId/subtitles/:subtitleName': GetSubtitleFileEndpoint
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
    '/files/:letter/:path/master.m3u8': HlsMasterEndpoint
    '/files/:letter/:path/stream.m3u8': HlsStreamEndpoint
    '/files/:letter/:path/init.mp4': HlsInitEndpoint
    '/files/:letter/:path/segment/:index': HlsSegmentEndpoint
  }
  POST: {
    '/movies': PostEndpoint<Movie, 'imdbId', Omit<Movie, 'createdAt' | 'updatedAt'>>
    '/movie-files': PostEndpoint<MovieFile, 'id'>
    '/link-movie': LinkMovie
    '/extract-subtitles': ExtractSubtitles
    '/save-watch-progress': SaveWatchProgress
    '/scan-for-movies': ScanForMoviesEndpoint
    '/playback-info': PlaybackInfoRequest
  }
  PATCH: {
    '/movies/:id': PatchEndpoint<Omit<Movie, 'createdAt' | 'updatedAt'>, 'imdbId'>
    '/movie-files/:id': PatchEndpoint<MovieFile, 'id'>
  }
  DELETE: {
    '/movies/:id': DeleteEndpoint<Movie, 'imdbId'>
    '/movie-files/:id': DeleteEndpoint<MovieFile, 'id'>
    '/my-watch-progresses/:id': DeleteEndpoint<WatchHistoryEntry, 'id'>
    '/files/:letter/:path/hls-session': HlsSessionTeardownEndpoint
  }
}
