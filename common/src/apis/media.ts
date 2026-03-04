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
  result: {
    status:
      | 'already-linked'
      | 'linked'
      | 'failed'
      | 'not-movie-file'
      | 'rate-limited'
      | 'metadata-not-found'
      | 'omdb-not-configured'
      | 'omdb-error'
    error?: unknown
  }
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

export type ScanProgress = {
  total: number
  linked: number
  alreadyLinked: number
  failed: number
  rateLimited: number
  metadataNotFound: number
  omdbNotConfigured: number
  omdbError: number
  skipped: number
}

export type LinkMovieStatus = LinkMovie['result']['status']

export const updateScanProgress = (progress: ScanProgress, status: LinkMovieStatus | 'skipped' | 'failed') => {
  switch (status) {
    case 'linked':
      progress.linked++
      break
    case 'already-linked':
      progress.alreadyLinked++
      break
    case 'rate-limited':
      progress.rateLimited++
      break
    case 'metadata-not-found':
      progress.metadataNotFound++
      break
    case 'omdb-not-configured':
      progress.omdbNotConfigured++
      break
    case 'omdb-error':
      progress.omdbError++
      break
    case 'failed':
      progress.failed++
      break
    default:
      progress.skipped++
      break
  }
}

export const createScanProgress = (total: number): ScanProgress => ({
  total,
  linked: 0,
  alreadyLinked: 0,
  failed: 0,
  rateLimited: 0,
  metadataNotFound: 0,
  omdbNotConfigured: 0,
  omdbError: 0,
  skipped: 0,
})

export const getProcessedCount = (progress: ScanProgress): number =>
  progress.linked +
  progress.alreadyLinked +
  progress.failed +
  progress.rateLimited +
  progress.metadataNotFound +
  progress.omdbNotConfigured +
  progress.omdbError +
  progress.skipped

export type ScanForMoviesEndpoint = {
  body: {
    root: PiRatFile
    autoExtractSubtitles?: boolean
  }
  result: {
    added: MovieFile[]
    progress: ScanProgress
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
