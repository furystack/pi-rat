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
  type RequestAction,
} from '@furystack/rest-service'
import type { MediaApi } from 'common'

type PostMovieEndpoint = MediaApi['POST']['/movies']
import mediaApiSchema from 'common/schemas/media-api.json' with { type: 'json' }
import { getCorsOptions } from '../../get-cors-options.js'
import { getPort } from '../../get-port.js'
import { ExtractSubtitlesAction } from './actions/extract-subtitles-action.js'
import { GetSubtitleFileAction } from './actions/get-subtitle-file-action.js'
import { GetSubtitlesAction } from './actions/get-subtitles-action.js'
import { HlsInitAction } from './actions/hls-init-action.js'
import { HlsMasterAction } from './actions/hls-master-action.js'
import { HlsSegmentAction } from './actions/hls-segment-action.js'
import { HlsSessionTeardownAction } from './actions/hls-session-teardown-action.js'
import { HlsStreamAction } from './actions/hls-stream-action.js'
import { LinkMovieAction } from './actions/link-movie-action.js'
import { PlaybackInfoAction } from './actions/playback-info-action.js'
import { SaveWatchProgressAction } from './actions/save-watch-progress-action.js'
import { ScanForMoviesAction } from './actions/scan-for-movies-action.js'
import {
  MovieDataSet,
  MovieFileDataSet,
  MovieMetadataLocalizedDataSet,
  OmdbMovieMetadataDataSet,
  OmdbSeriesMetadataDataSet,
  SeriesDataSet,
  SeriesMetadataLocalizedDataSet,
  TmdbMovieMetadataDataSet,
  TmdbSeriesMetadataDataSet,
  WatchHistoryEntryDataSet,
} from './media-data-sets.js'

export const setupMediaRestApi = async (injector: Injector) => {
  await useRestService<MediaApi>({
    injector,
    root: 'api/media',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/movies': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetCollectionEndpoint(MovieDataSet),
        ),
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetEntityEndpoint(MovieDataSet),
        ),
        '/series': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Series>' })(
          createGetCollectionEndpoint(SeriesDataSet),
        ),
        '/series/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Series>' })(
          createGetEntityEndpoint(SeriesDataSet),
        ),
        '/my-watch-progresses': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<WatchHistoryEntry>',
        })(createGetCollectionEndpoint(WatchHistoryEntryDataSet)),
        '/my-watch-progresses/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<WatchHistoryEntry,"id">',
        })(createGetEntityEndpoint(WatchHistoryEntryDataSet)),
        '/movies/:movieId/subtitles': Validate({ schema: mediaApiSchema, schemaName: 'GetSubtitlesEndpoint' })(
          Authenticate()(GetSubtitlesAction),
        ),
        '/movies/:movieId/subtitles/:subtitleName': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetSubtitleFileEndpoint',
        })(Authenticate()(GetSubtitleFileAction)),
        '/omdb-movie-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbMovieMetadata>',
        })(createGetCollectionEndpoint(OmdbMovieMetadataDataSet)),
        '/omdb-movie-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbMovieMetadata,"imdbID">',
        })(createGetEntityEndpoint(OmdbMovieMetadataDataSet)),
        '/omdb-series-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbSeriesMetadata>',
        })(createGetCollectionEndpoint(OmdbSeriesMetadataDataSet)),
        '/omdb-series-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbSeriesMetadata,"imdbID">',
        })(createGetEntityEndpoint(OmdbSeriesMetadataDataSet)),
        '/tmdb-movie-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<TmdbMovieMetadata>',
        })(createGetCollectionEndpoint(TmdbMovieMetadataDataSet)),
        '/tmdb-movie-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<TmdbMovieMetadata,"id">',
        })(createGetEntityEndpoint(TmdbMovieMetadataDataSet)),
        '/tmdb-series-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<TmdbSeriesMetadata>',
        })(createGetCollectionEndpoint(TmdbSeriesMetadataDataSet)),
        '/tmdb-series-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<TmdbSeriesMetadata,"id">',
        })(createGetEntityEndpoint(TmdbSeriesMetadataDataSet)),
        '/movie-metadata-localized': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<MovieMetadataLocalized>',
        })(createGetCollectionEndpoint(MovieMetadataLocalizedDataSet)),
        '/movie-metadata-localized/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<MovieMetadataLocalized,"id">',
        })(createGetEntityEndpoint(MovieMetadataLocalizedDataSet)),
        '/series-metadata-localized': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<SeriesMetadataLocalized>',
        })(createGetCollectionEndpoint(SeriesMetadataLocalizedDataSet)),
        '/series-metadata-localized/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<SeriesMetadataLocalized,"id">',
        })(createGetEntityEndpoint(SeriesMetadataLocalizedDataSet)),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<MovieFile>' })(
          createGetCollectionEndpoint(MovieFileDataSet),
        ),
        '/files/:letter/:path/master.m3u8': Validate({ schema: mediaApiSchema, schemaName: 'HlsMasterEndpoint' })(
          Authorize()(HlsMasterAction),
        ),
        '/files/:letter/:path/stream.m3u8': Validate({ schema: mediaApiSchema, schemaName: 'HlsStreamEndpoint' })(
          Authorize()(HlsStreamAction),
        ),
        '/files/:letter/:path/init.mp4': Validate({ schema: mediaApiSchema, schemaName: 'HlsInitEndpoint' })(
          Authorize()(HlsInitAction),
        ),
        '/files/:letter/:path/segment/:index': Validate({ schema: mediaApiSchema, schemaName: 'HlsSegmentEndpoint' })(
          Authorize()(HlsSegmentAction),
        ),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetEntityEndpoint<MovieFile,"id">' })(
          createGetEntityEndpoint(MovieFileDataSet),
        ),
      },
      POST: {
        '/movies': Validate({
          schema: mediaApiSchema,
          schemaName: 'PostEndpoint<Movie,"imdbId",Omit<Movie,("createdAt"|"updatedAt")>>',
        })(createPostEndpoint(MovieDataSet) as RequestAction<PostMovieEndpoint>),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'PostEndpoint<MovieFile,"id">' })(
          createPostEndpoint(MovieFileDataSet),
        ),
        '/link-movie': Validate({ schema: mediaApiSchema, schemaName: 'LinkMovie' })(
          Authorize('admin')(LinkMovieAction),
        ),
        '/extract-subtitles': Validate({ schema: mediaApiSchema, schemaName: 'ExtractSubtitles' })(
          Authorize('admin')(ExtractSubtitlesAction),
        ),
        '/save-watch-progress': Validate({ schema: mediaApiSchema, schemaName: 'SaveWatchProgress' })(
          Authenticate()(SaveWatchProgressAction),
        ),
        '/scan-for-movies': Validate({ schema: mediaApiSchema, schemaName: 'ScanForMoviesEndpoint' })(
          Authorize('admin')(ScanForMoviesAction),
        ),
        '/playback-info': Validate({ schema: mediaApiSchema, schemaName: 'PlaybackInfoRequest' })(
          Authenticate()(PlaybackInfoAction),
        ),
      },
      PATCH: {
        '/movies/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'PatchEndpoint<Omit<Movie,("createdAt"|"updatedAt")>,"imdbId">',
        })(createPatchEndpoint(MovieDataSet)),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'PatchEndpoint<MovieFile,"id">' })(
          createPatchEndpoint(MovieFileDataSet),
        ),
      },
      DELETE: {
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<Movie,"imdbId">' })(
          createDeleteEndpoint(MovieDataSet),
        ),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<MovieFile,"id">' })(
          createDeleteEndpoint(MovieFileDataSet),
        ),
        '/my-watch-progresses/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'DeleteEndpoint<WatchHistoryEntry,"id">',
        })(createDeleteEndpoint(WatchHistoryEntryDataSet)),
        '/files/:letter/:path/hls-session': Validate({
          schema: mediaApiSchema,
          schemaName: 'HlsSessionTeardownEndpoint',
        })(Authorize()(HlsSessionTeardownAction)),
      },
    },
  })
}
