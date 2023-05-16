import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { FetchOmdbMovie } from 'common'
import { OmdbClientService } from '../metadata-services/omdb-client-service.js'
import { RequestError } from '@furystack/rest'

export const FetchOmdbMovieAction: RequestAction<FetchOmdbMovie> = async ({ getBody, injector }) => {
  const { title, year, season, episode } = await getBody()
  const omdbClientService = injector.getInstance(OmdbClientService)

  const result = await omdbClientService.fetchOmdbMovieMetadata({
    title,
    year,
    season,
    episode,
  })

  if (!result) {
    throw new RequestError('Metadata not found', 404)
  }

  return JsonResult(result)
}
