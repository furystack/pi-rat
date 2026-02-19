import type { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import { OmdbSeriesMetadata, type OmdbMovieMetadata } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { ensureSeriesExists } from './ensure-series-exists.js'

export const ensureOmdbSeriesExists = async (omdbMeta: OmdbMovieMetadata, injector: Injector) => {
  if (!omdbMeta.seriesID) {
    return
  }

  const omdbSeriesDataSet = getDataSetFor(injector, OmdbSeriesMetadata, 'imdbID')
  const storedResult = await omdbSeriesDataSet.get(injector, omdbMeta.seriesID)
  if (!storedResult) {
    const omdbClientService = injector.getInstance(OmdbClientService)
    const result = await omdbClientService.fetchOmdbSeriesMetadata({
      imdbId: omdbMeta.seriesID,
    })
    if (!result) {
      throw new RequestError('Metadata not found', 404)
    }
    const {
      created: [newAdded],
    } = await omdbSeriesDataSet.add(injector, result)
    await ensureSeriesExists(newAdded, injector)
  } else {
    await ensureSeriesExists(storedResult, injector)
  }
}
