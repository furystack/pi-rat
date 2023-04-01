import type { Injector } from '@furystack/inject'
import {
  createDeleteEndpoint,
  createGetCollectionEndpoint,
  createGetEntityEndpoint,
  createPatchEndpoint,
  createPostEndpoint,
  useRestService,
} from '@furystack/rest-service'
import type { MediaApi } from 'common'
import { Movie, MovieLibrary, MovieWatchHistoryEntry, Series, OmdbMovieMetadata, OmdbSeriesMetadata } from 'common'
import { getPort } from '../get-port'
import { getCorsOptions } from '../get-cors-options'

export const setupMoviesRestApi = async (injector: Injector) => {
  await useRestService<MediaApi>({
    injector,
    root: 'api/identity',
    port: getPort(),
    cors: getCorsOptions(),
    api: {
      GET: {
        '/movie-libraries': createGetCollectionEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        '/movie-libraries/:id': createGetEntityEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        '/movies': createGetCollectionEndpoint({ model: Movie, primaryKey: 'id' }),
        '/movies/:id': createGetEntityEndpoint({ model: Movie, primaryKey: 'id' }),
        '/series': createGetCollectionEndpoint({ model: Series, primaryKey: 'id' }),
        '/series/:id': createGetEntityEndpoint({ model: Series, primaryKey: 'id' }),
        '/my-watch-progress': createGetCollectionEndpoint({ model: MovieWatchHistoryEntry, primaryKey: 'id' }),

        // TODOs:
        '/movies/:movieId/subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/subtitles/:subtitleName': () => null as any, // TODO: Implement
        '/stream-original/:movieId': () => null as any, // TODO: Implement
        '/omdb-movie-metadata': createGetCollectionEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbID' }),
        '/omdb-movie-metadata/:id': createGetEntityEndpoint({ model: OmdbMovieMetadata, primaryKey: 'imdbID' }),
        '/omdb-series-metadata': createGetCollectionEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbID' }),
        '/omdb-series-metadata/:id': createGetEntityEndpoint({ model: OmdbSeriesMetadata, primaryKey: 'imdbID' }),
      },
      POST: {
        '/movie-libraries': createPostEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        '/movies/:movieId/re-extract-subtitles': () => null as any, // TODO: Implement
        '/movies/:movieId/re-fetch-metadata': () => null as any, // TODO: Implement
        '/movies/:movieId/save-watch-progress': () => null as any, // TODO: Implement
      },
      PATCH: {
        '/movies/:id': createPatchEndpoint({ model: Movie, primaryKey: 'id' }),
        '/movie-libraries/:id': createPatchEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
      },
      DELETE: {
        '/movie-libraries/:id': createDeleteEndpoint({ model: MovieLibrary, primaryKey: 'id' }),
        '/movies/:id': createDeleteEndpoint({ model: Movie, primaryKey: 'id' }),
      },
    },
  })
}
