import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { FetchOmdbSeries } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { RequestError } from '@furystack/rest'

export const FetchOmdbSeriesAction: RequestAction<FetchOmdbSeries> = async ({ getBody, injector }) => {
  const { imdbId } = await getBody()
  const omdbClientService = injector.getInstance(OmdbClientService)

  const result = await omdbClientService.fetchOmdbSeriesMetadata({ imdbId })

  if (!result) {
    throw new RequestError('Metadata not found', 404)
  }

  return JsonResult(result)
}
