import type { Injector } from '@furystack/inject'
import {
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
          createGetCollectionEndpoint({ model: Series, primaryKey: 'id' }),
        ),
        '/series/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Series>' })(
          createGetEntityEndpoint({ model: Series, primaryKey: 'id' }),
        ),
        '/my-watch-progress': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<MovieWatchHistoryEntry>',
        })(createGetCollectionEndpoint({ model: MovieWatchHistoryEntry, primaryKey: 'id' })),

        // TODOs:
        '/movies/:movieId/subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/subtitles/:subtitleName': () => null as any, // TODO: Implement
        '/stream-original/:movieId': () => null as any, // TODO: Implement
        '/omdb-movie-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbMovieMetadata>',
        })(createGetCollectionEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbId' })),
        '/omdb-movie-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbMovieMetadata,"imdbId">',
        })(createGetEntityEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbId' })),
        '/omdb-series-metadata': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetCollectionEndpoint<OmdbSeriesMetadata>',
        })(createGetCollectionEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbId' })),
        '/omdb-series-metadata/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<OmdbSeriesMetadata,"imdbId">',
        })(createGetEntityEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbId' })),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<MovieFile>' })(
          createGetCollectionEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
        '/movie-files/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetEntityEndpoint<MovieFile,"id">' })(
          createGetEntityEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
      },
      POST: {
        '/movies': Validate({ schema: mediaApiSchema, schemaName: 'PostEndpoint<Movie,"imdbId">' })(
          createPostEndpoint({ model: Movie, primaryKey: 'imdbId' }),
        ),
        '/movie-files': Validate({ schema: mediaApiSchema, schemaName: 'PostEndpoint<MovieFile,"id">' })(
          createPostEndpoint({ model: MovieFile, primaryKey: 'id' }),
        ),
        '/movies/:movieId/re-extract-subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/re-fetch-metadata': () => null as any, // TODO: Implement
        '/movies/:movieId/save-watch-progress': () => null as any, // TODO: Implement
      },
      PATCH: {
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'PatchEndpoint<Movie,"imdbId">' })(
          createPatchEndpoint({ model: Movie, primaryKey: 'imdbId' }),
        ),
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
      },
    },
  })
}
