import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { LinkMovie } from 'common'
import { linkMovie } from '../utils/link-movie.js'

export const LinkMovieAction: RequestAction<LinkMovie> = async ({ getBody, injector }) => {
  const file = await getBody()

  const result = await linkMovie({ injector, file })

  return JsonResult(result)
}
