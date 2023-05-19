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
import { MovieFile } from 'common'
import mediaApiSchema from 'common/schemas/media-api.json' assert { type: 'json' }
import { Movie, MovieWatchHistoryEntry, Series, OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { getPort } from '../get-port.js'
import { getCorsOptions } from '../get-cors-options.js'
import { LinkMovieAction } from './actions/link-movie-action.js'
import { ExtractSubtitlesAction } from './actions/extract-subtitles-action.js'
import { SaveWatchProgressAction } from './actions/save-watch-progress-action.js'
import { StreamAction } from './actions/stream-action.js'

export const setupMoviesRestApi = async (injector: Injector) => {
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
          schemaName: 'GetCollectionEndpoint<MovieWatchHistoryEntry>',
        })(createGetCollectionEndpoint({ model: MovieWatchHistoryEntry, primaryKey: 'id' })),
        '/my-watch-progresses/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<MovieWatchHistoryEntry,"id">',
        })(createGetEntityEndpoint({ model: MovieWatchHistoryEntry, primaryKey: 'id' })),

        // TODOs:
        '/movies/:movieId/subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/subtitles/:subtitleName': () => null as any, // TODO: Implement
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
        '/movie-files/:id/stream': Authorize()(
          Validate({ schema: mediaApiSchema, schemaName: 'StreamEndpoint' })(StreamAction),
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
          schemaName: 'DeleteEndpoint<MovieWatchHistoryEntry,"id">',
        })(createDeleteEndpoint({ model: MovieWatchHistoryEntry, primaryKey: 'id' })),
      },
    },
  })
}
