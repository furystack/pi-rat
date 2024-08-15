import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { FfprobeEndpoint } from 'common'
import { FfprobeService } from '../../ffprobe-service.js'

export const FfprobeAction: RequestAction<FfprobeEndpoint> = async ({ getUrlParams, injector }) => {
  const { letter, path } = getUrlParams()

  const result = await injector.getInstance(FfprobeService).getFfprobeForPiratFile({ driveLetter: letter, path })

  return JsonResult(result)
}
