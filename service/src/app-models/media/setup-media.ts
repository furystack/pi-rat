import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { Movie, MovieFile } from 'common'

import { ExternalServiceStatusRegistry } from '../../external-service-status-registry.js'
import { OmdbClientService } from './metadata-services/omdb-client-service.js'
import { TmdbClientService } from './metadata-services/tmdb-client-service.js'
import { useMovieFileMaintainer } from './services/movie-file-maintainer.js'
import { announceMovieFileAdded } from './announce-movie-file-added.js'
import { setupMediaSchema } from './media-schema-setup.js'
import { setupMediaDataSets } from './media-data-sets.js'

export { announceMovieFileAdded } from './announce-movie-file-added.js'

export const setupMedia = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Movies')

  setupMediaSchema(injector, logger)
  setupMediaDataSets(injector)

  const omdbClientService = injector.getInstance(OmdbClientService)
  const tmdbClientService = injector.getInstance(TmdbClientService)

  injector.getInstance(ExternalServiceStatusRegistry).register('omdb', () => !!omdbClientService.config)
  injector.getInstance(ExternalServiceStatusRegistry).register('tmdb', () => !!tmdbClientService.config)

  const movieFileDataSet = getDataSetFor(injector, MovieFile, 'id')
  const movieDataSet = getDataSetFor(injector, Movie, 'imdbId')

  movieFileDataSet.subscribe('onEntityAdded', ({ entity }) => {
    void announceMovieFileAdded({ entity, injector, movieDataSet, logger })
  })

  useMovieFileMaintainer(injector)
}
