import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import type { FfprobeEndpoint } from 'common'
import { Drive } from 'common'
import { join } from 'path'
import ffprobe from 'ffprobe'

export const FfprobeAction: RequestAction<FfprobeEndpoint> = async ({ getUrlParams, injector }) => {
  const { letter, path } = getUrlParams()

  const drive = await getDataSetFor(injector, Drive, 'letter').get(injector, letter)
  if (!drive) {
    throw new RequestError(`Drive ${letter} not found`, 404)
  }

  const fullPath = join(drive.physicalPath, path)

  const ffprobeResult = await ffprobe(fullPath, { path: 'ffprobe' })

  return JsonResult(ffprobeResult)
}
