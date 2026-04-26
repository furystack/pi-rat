import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'

import { ExternalServiceStatusRegistry } from '../../external-service-status-registry.js'
import { announceMovieFileAdded } from './announce-movie-file-added.js'
import { MovieDataSet, MovieFileDataSet, setupMediaStores } from './media-data-sets.js'
import { OmdbClientService } from './metadata-services/omdb-client-service.js'
import { TmdbClientService } from './metadata-services/tmdb-client-service.js'
import { useMovieFileMaintainer } from './services/movie-file-maintainer.js'

export { announceMovieFileAdded } from './announce-movie-file-added.js'

export const setupMedia = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Movies')

  setupMediaStores(injector)

  const omdbClientService = injector.get(OmdbClientService)
  const tmdbClientService = injector.get(TmdbClientService)

  const registry = injector.get(ExternalServiceStatusRegistry)
  registry.register('omdb', () => !!omdbClientService.config)
  registry.register('tmdb', () => !!tmdbClientService.config)

  const movieFileDataSet = getDataSetFor(injector, MovieFileDataSet)
  const movieDataSet = getDataSetFor(injector, MovieDataSet)

  movieFileDataSet.subscribe('onEntityAdded', ({ entity }) => {
    void announceMovieFileAdded({ entity, injector, movieDataSet, logger })
  })

  useMovieFileMaintainer(injector)
}
