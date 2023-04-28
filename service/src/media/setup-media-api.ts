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
import mediaApiSchema from 'common/schemas/media-api.json'
import { Movie, MovieLibrary, MovieWatchHistoryEntry, Series, OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
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
        '/movie-libraries': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<MovieLibrary>' })(
          createGetCollectionEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        ),
        '/movie-libraries/:id': Validate({
          schema: mediaApiSchema,
          schemaName: 'GetEntityEndpoint<MovieLibrary,"id">',
        })(createGetEntityEndpoint({ model: MovieLibrary, primaryKey: 'id' })),
        '/movies': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetCollectionEndpoint({ model: Movie, primaryKey: 'id' }),
        ),
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'GetCollectionEndpoint<Movie>' })(
          createGetEntityEndpoint({ model: Movie, primaryKey: 'id' }),
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
      },
      POST: {
        '/movie-libraries': Validate({ schema: mediaApiSchema, schemaName: 'PostEndpoint<MovieLibrary,"id">' })(
          createPostEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        ),
        '/movies/:movieId/re-extract-subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/re-fetch-metadata': () => null as any, // TODO: Implement
        '/movies/:movieId/save-watch-progress': () => null as any, // TODO: Implement
      },
      PATCH: {
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'PatchEndpoint<Movie,"id">' })(
          createPatchEndpoint({ model: Movie, primaryKey: 'id' }),
        ),
        '/movie-libraries/:id': Validate({ schema: mediaApiSchema, schemaName: 'PatchEndpoint<MovieLibrary,"id">' })(
          createPatchEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        ),
      },
      DELETE: {
        '/movie-libraries/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<MovieLibrary,"id">' })(
          createDeleteEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        ),
        '/movies/:id': Validate({ schema: mediaApiSchema, schemaName: 'DeleteEndpoint<Movie,"id">' })(
          createDeleteEndpoint({ model: Movie, primaryKey: 'id' }),
        ),
      },
    },
  })
}
