import type { Injector } from '@furystack/inject'
import {
  Authenticate,
  Authorize,
  Validate,
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { Movie, MovieFile, OmdbMovieMetadata, OmdbSeriesMetadata, Series, WatchHistoryEntry } from 'common'
import mediaApiSchema from 'common/schemas/media-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { ExtractSubtitlesAction } from './actions/extract-subtitles-action.js'
import { GetSubtitleFileAction } from './actions/get-subtitle-file-action.js'
import { GetSubtitlesAction } from './actions/get-subtitles-action.js'
import { HlsMasterAction } from './actions/hls-master-action.js'
import { HlsSegmentAction } from './actions/hls-segment-action.js'
import { HlsStreamAction } from './actions/hls-stream-action.js'
import { LinkMovieAction } from './actions/link-movie-action.js'
import { PlaybackInfoAction } from './actions/playback-info-action.js'
import { SaveWatchProgressAction } from './actions/save-watch-progress-action.js'
import { ScanForMoviesAction } from './actions/scan-for-movies-action.js'
import { StreamAction } from './actions/stream-file-action.js'

export const setupMediaRestApi = async (injector: Injector) => {
  await useRestService<MediaApi>({
    injector,
    root: 'api/media',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/movies': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetCollectionEndpoint({ model: Movie, primaryKey: 'imdbId' }),
        ),
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetEntityEndpoint({ model: Movie, primaryKey: 'imdbId' }),
        ),
        '/series': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Series>' })(
          createGetCollectionEndpoint({ model: Series, primaryKey: 'imdbId' }),
        ),
        '/series/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Series>' })(
          createGetEntityEndpoint({ model: Series, primaryKey: 'imdbId' }),
        ),
        '/my-watch-progresses': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<WatchHistoryEntry>',
        })(createGetCollectionEndpoint({ model: WatchHistoryEntry, primaryKey: 'id' })),
        '/my-watch-progresses/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<WatchHistoryEntry,"id">',
        })(createGetEntityEndpoint({ model: WatchHistoryEntry, primaryKey: 'id' })),

        '/movies/:movieId/subtitles': Authenticate()(
          Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(GetSubtitlesAction),
        ),
        '/movies/:movieId/subtitles/:subtitleName': Authenticate()(
          Validate({ schema: mediaApiSchema, schemaName: 'GetEntityEndpoint<Movie,"imdbId">' })(GetSubtitleFileAction),
        ),
        '/omdb-movie-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbMovieMetadata>',
        })(createGetCollectionEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbID' })),
        '/omdb-movie-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbMovieMetadata,"imdbID">',
        })(createGetEntityEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbID' })),
        '/omdb-series-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbSeriesMetadata>',
        })(createGetCollectionEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbID' })),
        '/omdb-series-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbSeriesMetadata,"imdbID">',
        })(createGetEntityEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbID' })),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<MovieFile>' })(
          createGetCollectionEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
        '/files/:letter/:path/stream': Authorize()(
          Validate({ schema: mediaApiSchema, schemaName: 'StreamFileEndpoint' })(StreamAction),
        ),
        '/files/:letter/:path/master.m3u8': Authorize()(
          Validate({ schema: mediaApiSchema, schemaName: 'HlsMasterEndpoint' })(HlsMasterAction),
        ),
        '/files/:letter/:path/stream.m3u8': Authorize()(
          Validate({ schema: mediaApiSchema, schemaName: 'HlsStreamEndpoint' })(HlsStreamAction),
        ),
        '/files/:letter/:path/segment/:index': Authorize()(
          Validate({ schema: mediaApiSchema, schemaName: 'HlsSegmentEndpoint' })(HlsSegmentAction),
        ),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetEntityEndpoint<MovieFile,"id">' })(
          createGetEntityEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
      },
      POST: {
        '/movies': Validate({
          schema: mediaApiSchema,
          schemaName: 'PostEndpoint<Movie,"imdbId",Omit<Movie,("createdAt"|"updatedAt")>>',
        })(createPostEndpoint({ model: Movie, primaryKey: 'imdbId' })),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'PostEndpoint<MovieFile,"id">' })(
          createPostEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
        '/link-movie': Authorize('admin')(
          Validate({ schema: mediaApiSchema, schemaName: 'LinkMovie' })(LinkMovieAction),
        ),
        '/extract-subtitles': Authorize('admin')(
          Validate({ schema: mediaApiSchema, schemaName: 'ExtractSubtitles' })(ExtractSubtitlesAction),
        ),
        '/save-watch-progress': Authenticate()(
          Validate({ schema: mediaApiSchema, schemaName: 'SaveWatchProgress' })(SaveWatchProgressAction),
        ),
        '/scan-for-movies': Authorize('admin')(
          Validate({
            schema: mediaApiSchema,
            schemaName: 'ScanForMoviesEndpoint',
          })(ScanForMoviesAction),
        ),
        '/playback-info': Authenticate()(
          Validate({ schema: mediaApiSchema, schemaName: 'PlaybackInfoRequest' })(PlaybackInfoAction),
        ),
      },
      PATCH: {
        '/movies/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'PatchEndpoint<Omit<Movie,("createdAt"|"updatedAt")>,"imdbId">',
        })(createPatchEndpoint({ model: Movie, primaryKey: 'imdbId' })),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'PatchEndpoint<MovieFile,"id">' })(
          createPatchEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
      },
      DELETE: {
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<Movie,"imdbId">' })(
          createDeleteEndpoint({ model: Movie, primaryKey: 'imdbId' }),
        ),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<MovieFile,"id">' })(
          createDeleteEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
        '/my-watch-progresses/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'DeleteEndpoint<WatchHistoryEntry,"id">',
        })(createDeleteEndpoint({ model: WatchHistoryEntry, primaryKey: 'id' })),
      },
    },
  })
}
